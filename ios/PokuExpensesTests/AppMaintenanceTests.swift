import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

@MainActor
struct AppMaintenanceTests {
    @Test func runningTwiceOnAnEmptyStoreYieldsExactlyTheNineDefaults() throws {
        let store = TestStore()
        let maintenance = AppMaintenance(context: store.context)
        try maintenance.run()
        try maintenance.run()
        let names = try store.fetch(ExpenseCategory.self).map(\.name).sorted()
        #expect(names == CategoryService.defaults.sorted())
        #expect(try store.fetch(Expense.self).isEmpty)
    }

    @Test func mergesSecondDeviceDefaultsAndPopulatesRecurringOnce() throws {
        let store = TestStore()
        let now = Date.now
        // Defaults seeded on two devices, both synced in.
        for name in CategoryService.defaults {
            store.context.insert(ExpenseCategory(name: name, createdAt: now.addingTimeInterval(-10)))
            store.context.insert(ExpenseCategory(name: name, createdAt: now.addingTimeInterval(-5)))
        }
        let lastMonth = DateMath.addingMonths(-1, to: now)
        store.context.insert(Expense(title: "Rent", amount: 100, transactionDate: lastMonth, recurrence: .monthly))
        try store.context.save()

        let maintenance = AppMaintenance(context: store.context)
        try maintenance.run(now: now)
        try maintenance.run(now: now)

        #expect(try store.fetch(ExpenseCategory.self).count == 9)
        #expect(try store.fetch(Expense.self).filter { $0.recurrenceID != nil }.count == 1)
    }
}
