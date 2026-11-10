import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

/// Requirement 12: decoding the web export and importing it once, against the fixture the web test also uses.
@MainActor
struct WebImportTests {
    static let fixtureURL = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent()
        .appendingPathComponent("Fixtures/web-export-v1.json")

    let store = TestStore()
    var context: ModelContext { store.context }

    func fixture() throws -> Data { try Data(contentsOf: Self.fixtureURL) }

    func json(_ object: [String: Any]) throws -> Data { try JSONSerialization.data(withJSONObject: object) }

    func seededFood() throws -> ExpenseCategory {
        try CategoryService(context: context).seedDefaultsIfEmpty(now: TestCalendar.date(2026, 1, 1))
        return try #require(try store.fetch(ExpenseCategory.self).first { $0.name == "Food" })
    }

    // MARK: decode

    @Test func decodesTheFixture() throws {
        let file = try WebImport.decode(try fixture())
        #expect(file.format == "poku-expenses-export")
        #expect(file.version == 1)
        #expect(file.categories.map(\.id) == ["ctg-web-food", "ctg-web-pets"])
        #expect(file.budget.map(\.amount) == [25000, 30000])
        #expect(file.expenses.count == 4)
        #expect(file.warranties.count == 2)

        let lunch = try #require(file.expenses.first { $0.id == "exp-web-lunch" })
        #expect(abs(lunch.transactionDate.timeIntervalSince1970 - 1_793_678_706.789) < 0.0005)
        #expect(lunch.description == "With the team")
        #expect(lunch.categoryID == "ctg-web-food")
        let rent = try #require(file.expenses.first { $0.id == "exp-web-rent" })
        #expect(rent.recurrence == "monthly")
        #expect(rent.description == nil && rent.categoryID == nil)
    }

    @Test func datesWithoutFractionalSecondsDecodeToo() throws {
        let data = try json(["format": "poku-expenses-export", "version": 1, "exported_at": "2026-11-10T01:00:00Z",
                             "categories": [["id": "ctg-1", "name": "Pets", "created_at": "2025-01-02T03:04:05Z"]],
                             "budget": [], "expenses": [], "warranties": []])
        let file = try WebImport.decode(data)
        #expect(file.categories[0].createdAt == Date(timeIntervalSince1970: 1_735_787_045))
    }

    @Test func rejectsAnOversizedFile() {
        let data = Data(count: WebImport.maxBytes + 1)
        #expect(throws: WebImportError.tooLarge) { try WebImport.decode(data) }
    }

    @Test func rejectsFilesThatAreNotAnExport() throws {
        #expect(throws: WebImportError.notAnExport) { try WebImport.decode(Data("not json".utf8)) }
        #expect(throws: WebImportError.notAnExport) { try WebImport.decode(try json(["hello": "world"])) }
        #expect(throws: WebImportError.notAnExport) {
            try WebImport.decode(try json(["format": "something-else", "version": 1]))
        }
        // Right header, wrong body.
        #expect(throws: WebImportError.notAnExport) {
            try WebImport.decode(try json(["format": "poku-expenses-export", "version": 1, "expenses": "nope"]))
        }
    }

    @Test func rejectsANewerVersion() throws {
        let data = try json(["format": "poku-expenses-export", "version": 2])
        #expect(throws: WebImportError.unsupportedVersion(2)) { try WebImport.decode(data) }
    }

    @Test func errorsHaveReadableMessages() {
        #expect(WebImportError.tooLarge.errorDescription == "That file is too large to import.")
        #expect(WebImportError.notAnExport.errorDescription == "That file is not a Poku Expenses export.")
        #expect(WebImportError.unsupportedVersion(2).errorDescription
                == "This export is from a newer version of the web app.")
    }

    // MARK: summary

    @Test func summaryText() {
        let summary = ImportSummary(expensesAdded: 412, categoriesAdded: 11, budgetsAdded: 3, warrantiesAdded: 4, skipped: 0)
        #expect(summary.text == "412 expenses, 11 categories, 3 budgets, 4 warranties added. 0 skipped.")
        let one = ImportSummary(expensesAdded: 1, categoriesAdded: 1, budgetsAdded: 1, warrantiesAdded: 1, skipped: 1)
        #expect(one.text == "1 expense, 1 category, 1 budget, 1 warranty added. 1 skipped.")
    }

    // MARK: run

    @Test func importsTheFixtureMappingCategoriesByName() throws {
        let food = try seededFood()
        let summary = try WebImporter(context: context).run(try WebImport.decode(try fixture()))

        #expect(summary == ImportSummary(expensesAdded: 4, categoriesAdded: 1, budgetsAdded: 2, warrantiesAdded: 2,
                                         skipped: 1))
        let categories = try store.fetch(ExpenseCategory.self)
        #expect(categories.count == CategoryService.defaults.count + 1)
        #expect(categories.contains { $0.id == "ctg-web-pets" && $0.name == "Pets" })
        #expect(!categories.contains { $0.id == "ctg-web-food" })

        let expenses = try store.fetch(Expense.self)
        let lunch = try #require(expenses.first { $0.id == "exp-web-lunch" })
        #expect(lunch.categoryID == food.id)
        #expect(lunch.note == "With the team")
        #expect(lunch.amount == 650)
        #expect(abs(lunch.transactionDate.timeIntervalSince1970 - 1_793_678_706.789) < 0.0005)
        #expect(lunch.createdAt == lunch.transactionDate && lunch.updatedAt == lunch.transactionDate)
        #expect(!lunch.uid.isEmpty)
        #expect(expenses.first { $0.id == "exp-web-vet" }?.categoryID == "ctg-web-pets")
        let rent = try #require(expenses.first { $0.id == "exp-web-rent" })
        #expect(rent.recurrence == .monthly && rent.recurrenceID == nil && rent.categoryID == nil)
        let refund = try #require(expenses.first { $0.id == "exp-web-refund" })
        #expect(refund.amount == -500 && refund.isRefund)
        #expect(refund.categoryID == "ctg-web-missing")
        #expect(refund.warrantyID == "wrt-web-fan")

        let budgets = try store.fetch(Budget.self)
        #expect(Set(budgets.map(\.id)) == ["bdg-web-1", "bdg-web-2"])
        #expect(budgets.first { $0.id == "bdg-web-2" }?.createdAt == Date(timeIntervalSince1970: 1_790_812_800))
    }

    @Test func warrantyImageBytesWinOverTheURL() throws {
        try WebImporter(context: context).run(try WebImport.decode(try fixture()))
        let warranties = try store.fetch(Warranty.self)
        let fan = try #require(warranties.first { $0.id == "wrt-web-fan" })
        let bytes = try #require(fan.imageData)
        // Re-encoded as JPEG by ReceiptImage.prepare.
        #expect(bytes.starts(with: [0xFF, 0xD8]))
        #expect(fan.imageURL == nil)
        #expect(fan.expirationDate == Date(timeIntervalSince1970: 1_836_604_800))
        let tv = try #require(warranties.first { $0.id == "wrt-web-tv" })
        #expect(tv.imageData == nil)
        #expect(tv.imageURL == "https://res.cloudinary.com/demo/tv.jpg")
        #expect(tv.expirationDate == nil)
    }

    @Test func undecodableImageBytesBecomeNilAndKeepTheURL() throws {
        let data = try json(["format": "poku-expenses-export", "version": 1, "exported_at": "2026-11-10T01:00:00Z",
                             "categories": [], "budget": [], "expenses": [],
                             "warranties": [["id": "wrt-1", "title": "Broken", "expiration_date": NSNull(),
                                             "image_base64": "bm90IGFuIGltYWdl", "image_content_type": "image/png",
                                             "image_url": "https://example.com/x.png",
                                             "created_at": "2026-01-01T00:00:00Z",
                                             "updated_at": "2026-01-01T00:00:00Z"]]])
        try WebImporter(context: context).run(try WebImport.decode(data))
        let warranty = try #require(try store.fetch(Warranty.self).first)
        #expect(warranty.imageData == nil)
        #expect(warranty.imageURL == "https://example.com/x.png")
    }

    @Test func aSecondImportAddsNothing() throws {
        try seededFood()
        let file = try WebImport.decode(try fixture())
        try WebImporter(context: context).run(file)
        let counts = try (store.fetch(Expense.self).count, store.fetch(ExpenseCategory.self).count,
                          store.fetch(Budget.self).count, store.fetch(Warranty.self).count)

        let second = try WebImporter(context: context).run(file)
        #expect(second == ImportSummary(skipped: 10))
        #expect(try store.fetch(Expense.self).count == counts.0)
        #expect(try store.fetch(ExpenseCategory.self).count == counts.1)
        #expect(try store.fetch(Budget.self).count == counts.2)
        #expect(try store.fetch(Warranty.self).count == counts.3)
    }

    @Test func intoAnEmptyStoreEveryCategoryIsAdded() throws {
        let summary = try WebImporter(context: context).run(try WebImport.decode(try fixture()))
        #expect(summary.categoriesAdded == 2 && summary.skipped == 0)
        #expect(try store.fetch(Expense.self).first { $0.id == "exp-web-lunch" }?.categoryID == "ctg-web-food")
    }

    @Test func leavesTheStoreUntouchedWhenItThrowsMidWay() throws {
        try seededFood()
        struct Boom: Error {}
        var importer = WebImporter(context: context)
        importer.beforeSave = { throw Boom() }
        #expect(throws: Boom.self) { try importer.run(try WebImport.decode(try fixture())) }

        #expect(try store.fetch(Expense.self).isEmpty)
        #expect(try store.fetch(Budget.self).isEmpty)
        #expect(try store.fetch(Warranty.self).isEmpty)
        #expect(try store.fetch(ExpenseCategory.self).count == CategoryService.defaults.count)
    }

    // MARK: Settings path

    @Test func settingsImportRunsMaintenanceAfterwards() throws {
        let summary = try SettingsScreen.importWebExport(from: Self.fixtureURL, context: context,
                                                         now: TestCalendar.date(2026, 11, 10))
        #expect(summary.expensesAdded == 4)
        // Maintenance added this month's copy of the October rent template.
        let expenses = try store.fetch(Expense.self)
        #expect(expenses.filter { $0.recurrenceID == "exp-web-rent" }.count == 1)
    }
}
