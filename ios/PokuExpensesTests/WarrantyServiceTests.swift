import Foundation
import SwiftData
import Testing
import UIKit
@testable import PokuExpenses

@MainActor
struct WarrantyServiceTests {
    let store = TestStore()
    var service: WarrantyService { WarrantyService(context: store.context) }
    let image = Data([0xFF, 0xD8, 0xFF])

    @Test func addPersistsTitleImageAndTimestamps() throws {
        let now = TestCalendar.date(2026, 11, 10)
        let expiry = TestCalendar.date(2027, 11, 10)
        let warranty = try service.add(title: "  Macbook M5 ", expirationDate: expiry, imageData: image, now: now)
        #expect(warranty.id.hasPrefix("wrt"))
        let all = try store.fetch(Warranty.self)
        #expect(all.count == 1)
        #expect(all[0].title == "Macbook M5" && all[0].imageData == image && all[0].imageURL == nil)
        #expect(all[0].expirationDate == expiry && all[0].createdAt == now && all[0].updatedAt == now)
    }

    @Test func addAllowsNoExpirationDate() throws {
        try service.add(title: "Fan", expirationDate: nil, imageData: image)
        #expect(try store.fetch(Warranty.self)[0].expirationDate == nil)
    }

    @Test func updateKeepsTheImageWhenNoneIsGiven() throws {
        let warranty = try service.add(title: "TV", expirationDate: nil, imageData: image,
                                       now: TestCalendar.date(2026, 1, 1))
        let later = TestCalendar.date(2026, 2, 1)
        try service.update(warranty, title: " TV 55 ", expirationDate: TestCalendar.date(2027, 1, 1), now: later)
        #expect(warranty.title == "TV 55" && warranty.imageData == image)
        #expect(warranty.expirationDate == TestCalendar.date(2027, 1, 1) && warranty.updatedAt == later)
    }

    @Test func updateReplacesTheImageWhenGiven() throws {
        let warranty = try service.add(title: "TV", expirationDate: TestCalendar.date(2027, 1, 1), imageData: image)
        try service.update(warranty, title: "TV", expirationDate: nil, imageData: Data([9]))
        #expect(warranty.imageData == Data([9]) && warranty.expirationDate == nil)
    }

    @Test func warrantyByID() throws {
        let warranty = try service.add(title: "TV", expirationDate: nil, imageData: image)
        #expect(try service.warranty(id: warranty.id)?.title == "TV")
        #expect(try service.warranty(id: "wrt-none") == nil)
    }

    @Test func allSortsSoonestExpiryFirstUndatedLast() throws {
        try service.add(title: "Later", expirationDate: TestCalendar.date(2030, 1, 1), imageData: image)
        try service.add(title: "Undated", expirationDate: nil, imageData: image)
        try service.add(title: "Soonest", expirationDate: TestCalendar.date(2026, 7, 1), imageData: image)
        #expect(try service.all().map(\.title) == ["Soonest", "Later", "Undated"])
    }

    @Test func deleteRemovesTheWarranty() throws {
        let warranty = try service.add(title: "Delete me", expirationDate: nil, imageData: image)
        try service.delete(warranty)
        #expect(try store.fetch(Warranty.self).isEmpty)
    }

    @Test func deleteUnlinksExpensesThatPointAtIt() throws {
        let warranty = try service.add(title: "TV", expirationDate: nil, imageData: image)
        let expenses = ExpenseService(context: store.context)
        func draft(_ warrantyID: String?) -> ExpenseDraft {
            ExpenseDraft(title: "x", amount: 1, transactionDate: .now, note: nil, categoryID: nil,
                         recurrence: nil, recurrenceID: nil, warrantyID: warrantyID)
        }
        let linked = try expenses.add(draft(warranty.id))
        let other = try expenses.add(draft("wrt-other"))
        try service.delete(warranty)
        #expect(linked.warrantyID == nil)
        #expect(other.warrantyID == "wrt-other")
        #expect(try store.fetch(Expense.self).count == 2)
    }
}

@MainActor
struct ReceiptImageTests {
    func image(width: CGFloat, height: CGFloat) -> UIImage {
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        return UIGraphicsImageRenderer(size: CGSize(width: width, height: height), format: format).image { ctx in
            UIColor.red.setFill()
            ctx.fill(CGRect(x: 0, y: 0, width: width, height: height))
        }
    }

    func pixelSize(_ data: Data) throws -> CGSize {
        let decoded = try #require(UIImage(data: data))
        return CGSize(width: decoded.size.width * decoded.scale, height: decoded.size.height * decoded.scale)
    }

    @Test func downscalesSoTheLongEdgeFits() throws {
        let data = try #require(ReceiptImage.prepare(image(width: 4000, height: 3000), maxDimension: 2048))
        #expect(data.starts(with: [0xFF, 0xD8]))   // JPEG
        let size = try pixelSize(data)
        #expect(size.width == 2048 && size.height == 1536)
    }

    @Test func leavesSmallImagesAtTheirSize() throws {
        let data = try #require(ReceiptImage.prepare(image(width: 300, height: 600)))
        #expect(try pixelSize(data) == CGSize(width: 300, height: 600))
    }
}
