import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

@MainActor
struct ExpenseServiceTests {
    let store = TestStore()
    var service: ExpenseService { ExpenseService(context: store.context) }
    let cal = TestCalendar.calendar

    func draft(_ title: String = "Test expense", amount: Double = 100,
               on date: Date = TestCalendar.date(2026, 11, 10)) -> ExpenseDraft {
        ExpenseDraft(title: title, amount: amount, transactionDate: date, note: nil, categoryID: nil,
                     recurrence: nil, recurrenceID: nil, warrantyID: nil)
    }

    @Test func addPersistsTheExpense() throws {
        try service.add(draft())
        let all = try store.fetch(Expense.self)
        #expect(all.count == 1)
        #expect(all[0].title == "Test expense" && all[0].amount == 100)
    }

    @Test func addGeneratesAnExpID() throws {
        let expense = try service.add(draft())
        #expect(expense.id.hasPrefix("exp"))
    }

    @Test func addSetsTimestampsAndEveryDraftField() throws {
        let now = TestCalendar.date(2026, 11, 10, 9)
        var d = draft(on: TestCalendar.date(2026, 11, 9))
        d.note = "n"; d.categoryID = "ctg1"; d.recurrence = .monthly; d.warrantyID = "wrt1"
        let expense = try service.add(d, now: now)
        #expect(expense.createdAt == now && expense.updatedAt == now)
        #expect(expense.transactionDate == TestCalendar.date(2026, 11, 9))
        #expect(expense.note == "n" && expense.categoryID == "ctg1")
        #expect(expense.recurrence == .monthly && expense.recurrenceID == nil && expense.warrantyID == "wrt1")
    }

    @Test func updateChangesFieldsAndBumpsUpdatedAt() throws {
        let created = TestCalendar.date(2026, 11, 1)
        let expense = try service.add(draft(), now: created)
        var d = draft("Updated title", amount: 250)
        d.recurrenceID = "exp-template"
        let later = TestCalendar.date(2026, 11, 2)
        try service.update(expense, with: d, now: later)
        let all = try store.fetch(Expense.self)
        #expect(all.count == 1)
        #expect(all[0].title == "Updated title" && all[0].amount == 250)
        #expect(all[0].recurrenceID == "exp-template")
        #expect(all[0].createdAt == created && all[0].updatedAt == later)
    }

    @Test func expensesInIntervalReturnsOnlyThatMonthNewestFirst() throws {
        try service.add(draft("Old", on: TestCalendar.date(2026, 10, 31, 23, 59)))
        try service.add(draft("Early", on: TestCalendar.date(2026, 11, 1, 0, 0)))
        try service.add(draft("Late", on: TestCalendar.date(2026, 11, 30, 23, 59)))
        try service.add(draft("Next", on: TestCalendar.date(2026, 12, 1, 0, 0)))
        let month = DateMath.monthInterval(TestCalendar.date(2026, 11, 15), calendar: cal)
        #expect(try service.expenses(in: month).map(\.title) == ["Late", "Early"])
    }

    @Test func expensesInIntervalIsEmptyWhenNothingMatches() throws {
        try service.add(draft(on: TestCalendar.date(2026, 11, 10)))
        let month = DateMath.monthInterval(TestCalendar.date(2025, 1, 15), calendar: cal)
        #expect(try service.expenses(in: month).isEmpty)
    }

    @Test func expenseByIDFindsOrReturnsNil() throws {
        let expense = try service.add(draft())
        #expect(try service.expense(id: expense.id)?.id == expense.id)
        #expect(try service.expense(id: "exp-unknown") == nil)
    }

    @Test func deleteRemovesTheExpenseButKeepsItsWarranty() throws {
        let warranty = try WarrantyService(context: store.context)
            .add(title: "TV", expirationDate: nil, imageData: Data([1]))
        var d = draft(); d.warrantyID = warranty.id
        let expense = try service.add(d)
        try service.delete(expense)
        #expect(try store.fetch(Expense.self).isEmpty)
        #expect(try store.fetch(Warranty.self).count == 1)
    }
}
