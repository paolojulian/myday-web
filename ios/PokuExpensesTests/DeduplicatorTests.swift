import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

@MainActor
struct DeduplicatorTests {
    let cal = TestCalendar.calendar
    let t0 = TestCalendar.date(2026, 1, 1)
    let t1 = TestCalendar.date(2026, 1, 2)

    @discardableResult func run(_ store: TestStore) throws -> Deduplicator.Result {
        try Deduplicator(context: store.context).run(calendar: cal)
    }

    func insert(_ store: TestStore, _ models: [any PersistentModel]) throws {
        for model in models { store.context.insert(model) }
        try store.context.save()
    }

    @Test func emptyStoreIsANoOp() throws {
        let store = TestStore()
        #expect(try run(store) == Deduplicator.Result())
    }

    @Test func removesSameIDCopiesInEveryModel() throws {
        let store = TestStore()
        try insert(store, [
            Expense(id: "exp1", uid: "b", title: "late", amount: 1, transactionDate: t0, createdAt: t1),
            Expense(id: "exp1", uid: "a", title: "early", amount: 1, transactionDate: t0, createdAt: t0),
            ExpenseCategory(id: "ctg1", uid: "a", name: "Food", createdAt: t0),
            ExpenseCategory(id: "ctg1", uid: "b", name: "Food", createdAt: t0),
            Budget(id: "bdg1", uid: "z", amount: 1, createdAt: t0),
            Budget(id: "bdg1", uid: "y", amount: 2, createdAt: t0),
            Warranty(id: "wrt1", uid: "a", title: "TV", createdAt: t0),
            Warranty(id: "wrt1", uid: "b", title: "TV", createdAt: t0),
        ])
        let result = try run(store)
        #expect(result.identicalRemoved == 4)
        #expect(result.categoriesMerged == 0)
        #expect(try store.fetch(Expense.self).map(\.title) == ["early"])
        #expect(try store.fetch(ExpenseCategory.self).map(\.uid) == ["a"])
        #expect(try store.fetch(Budget.self).map(\.amount) == [2])   // same createdAt → smallest uid "y"
        #expect(try store.fetch(Warranty.self).map(\.uid) == ["a"])
    }

    @Test func mergesCategoriesByNameAndRepointsExpenses() throws {
        let store = TestStore()
        try insert(store, [
            ExpenseCategory(id: "ctg-a", uid: "u2", name: "Food", createdAt: t1),
            ExpenseCategory(id: "ctg-b", uid: "u1", name: " food ", createdAt: t0),
            ExpenseCategory(id: "ctg-c", uid: "u3", name: "Bills", createdAt: t0),
            Expense(id: "exp1", title: "x", amount: 1, transactionDate: t0, categoryID: "ctg-a"),
            Expense(id: "exp2", title: "y", amount: 1, transactionDate: t0, categoryID: "ctg-c"),
        ])
        let result = try run(store)
        #expect(result.categoriesMerged == 1)
        #expect(Set(try store.fetch(ExpenseCategory.self).map(\.id)) == ["ctg-b", "ctg-c"])
        let byID = Dictionary(uniqueKeysWithValues: try store.fetch(Expense.self).map { ($0.id, $0.categoryID) })
        #expect(byID["exp1"] == "ctg-b" && byID["exp2"] == "ctg-c")
    }

    @Test func removesExtraRecurringCopiesInOneMonthOnly() throws {
        let store = TestStore()
        try insert(store, [
            Expense(id: "exp-t", title: "Rent", amount: 1, transactionDate: TestCalendar.date(2026, 9, 3), recurrence: .monthly),
            Expense(id: "exp-n1", uid: "u2", title: "Rent", amount: 1, transactionDate: TestCalendar.date(2026, 11, 1, 0, 0), recurrenceID: "exp-t", createdAt: t0),
            Expense(id: "exp-n2", uid: "u1", title: "Rent", amount: 1, transactionDate: TestCalendar.date(2026, 11, 1, 0, 0), recurrenceID: "exp-t", createdAt: t0),
            Expense(id: "exp-o1", title: "Rent", amount: 1, transactionDate: TestCalendar.date(2026, 10, 1, 0, 0), recurrenceID: "exp-t", createdAt: t1),
            Expense(id: "exp-g1", title: "Gym", amount: 1, transactionDate: TestCalendar.date(2026, 11, 1, 0, 0), recurrenceID: "exp-other", createdAt: t1),
        ])
        let result = try run(store)
        #expect(result.recurringRemoved == 1)
        #expect(Set(try store.fetch(Expense.self).map(\.id)) == ["exp-t", "exp-n2", "exp-o1", "exp-g1"])
    }

    @Test func isIdempotent() throws {
        let store = TestStore()
        try insert(store, [
            ExpenseCategory(id: "ctg-a", name: "Food", createdAt: t0),
            ExpenseCategory(id: "ctg-b", name: "Food", createdAt: t1),
            ExpenseCategory(id: "ctg-a", name: "Food", createdAt: t1),
        ])
        let first = try run(store)
        #expect(first.identicalRemoved == 1 && first.categoriesMerged == 1)
        #expect(try run(store) == Deduplicator.Result())
        #expect(try store.fetch(ExpenseCategory.self).map(\.id) == ["ctg-a"])
    }

    @Test func picksTheSameSurvivorRegardlessOfInsertOrder() throws {
        func survivors(order: [Int]) throws -> (String, String) {
            let store = TestStore()
            let categories = [("ctg-x", "u9", t1), ("ctg-y", "u5", t0), ("ctg-z", "u1", t0)]
            let budgets = [("u3", 3.0), ("u1", 1.0), ("u2", 2.0)]
            for i in order {
                let c = categories[i]
                store.context.insert(ExpenseCategory(id: c.0, uid: c.1, name: "Food", createdAt: c.2))
                store.context.insert(Budget(id: "bdg1", uid: budgets[i].0, amount: budgets[i].1, createdAt: t0))
            }
            try store.context.save()
            try run(store)
            let category = try #require(try store.fetch(ExpenseCategory.self).first)
            let budget = try #require(try store.fetch(Budget.self).first)
            return (category.id, budget.uid)
        }
        for order in [[0, 1, 2], [2, 1, 0], [1, 2, 0], [2, 0, 1]] {
            let (category, budget) = try survivors(order: order)
            #expect(category == "ctg-z")
            #expect(budget == "u1")
        }
    }

    @Test func neverDeletesRecordsWithoutDuplicates() throws {
        let store = TestStore()
        try insert(store, [
            ExpenseCategory(name: "Food"), ExpenseCategory(name: "Bills"),
            Budget(amount: 1), Budget(amount: 1),
            Warranty(title: "TV"), Warranty(title: "TV"),
            Expense(title: "Lunch", amount: 1, transactionDate: t0),
            Expense(title: "Lunch", amount: 1, transactionDate: t0),
            Expense(title: "Rent", amount: 1, transactionDate: TestCalendar.date(2026, 10, 1), recurrenceID: "exp-t"),
            Expense(title: "Rent", amount: 1, transactionDate: TestCalendar.date(2026, 11, 1), recurrenceID: "exp-t"),
        ])
        #expect(try run(store) == Deduplicator.Result())
        #expect(try store.fetch(ExpenseCategory.self).count == 2)
        #expect(try store.fetch(Budget.self).count == 2)
        #expect(try store.fetch(Warranty.self).count == 2)
        #expect(try store.fetch(Expense.self).count == 4)
    }
}
