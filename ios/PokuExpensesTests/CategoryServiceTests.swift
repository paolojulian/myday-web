import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

@MainActor
struct CategoryServiceTests {
    let store = TestStore()
    var service: CategoryService { CategoryService(context: store.context) }

    @Test func addReturnsAndPersistsTheCategory() throws {
        let now = TestCalendar.date(2026, 11, 10)
        let category = try service.add(name: "Food", now: now)
        #expect(category.name == "Food" && category.id.hasPrefix("ctg") && category.createdAt == now)
        let all = try store.fetch(ExpenseCategory.self)
        #expect(all.count == 1 && all[0].name == "Food")
    }

    @Test func addGeneratesUniqueIDs() throws {
        let a = try service.add(name: "A")
        let b = try service.add(name: "B")
        #expect(a.id != b.id)
    }

    @Test func addTrimsTheName() throws {
        #expect(try service.add(name: "  Pets \n").name == "Pets")
    }

    @Test func addRejectsAnEmptyName() throws {
        #expect(throws: CategoryServiceError.emptyName) { try service.add(name: "   ") }
        #expect(try store.fetch(ExpenseCategory.self).isEmpty)
    }

    @Test func addingAnExistingNameReturnsTheExistingRecord() throws {
        let food = try service.add(name: "Food")
        let again = try service.add(name: " food ")
        #expect(again.id == food.id)
        #expect(try store.fetch(ExpenseCategory.self).count == 1)
    }

    @Test func allIsOrderedByNameCaseInsensitive() throws {
        for name in ["Zebra", "apple", "Mango"] { try service.add(name: name) }
        #expect(try service.all().map(\.name) == ["apple", "Mango", "Zebra"])
    }

    @Test func allIsEmptyWithNoCategories() throws {
        #expect(try service.all().isEmpty)
    }

    @Test func deleteRemovesTheCategoryAndLeavesExpensesPointingAtIt() throws {
        let bills = try service.add(name: "Bills")
        let expense = try ExpenseService(context: store.context).add(
            ExpenseDraft(title: "Power", amount: 10, transactionDate: .now, note: nil, categoryID: bills.id,
                         recurrence: nil, recurrenceID: nil, warrantyID: nil))
        try service.delete(bills)
        #expect(try store.fetch(ExpenseCategory.self).isEmpty)
        #expect(expense.categoryID == bills.id)
    }

    @Test func seedsTheNineDefaultsWhenEmpty() throws {
        try service.seedDefaultsIfEmpty()
        let names = Set(try store.fetch(ExpenseCategory.self).map(\.name))
        #expect(names.count == 9)
        #expect(names == Set(CategoryService.defaults))
        #expect(names.isSuperset(of: ["Food", "Bills", "Transportation"]))
    }

    @Test func doesNotSeedWhenCategoriesExist() throws {
        try service.add(name: "Mine")
        try service.seedDefaultsIfEmpty()
        #expect(try store.fetch(ExpenseCategory.self).map(\.name) == ["Mine"])
    }
}
