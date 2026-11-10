import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

@MainActor
struct RecurringServiceTests {
    let store = TestStore()
    let cal = TestCalendar.calendar
    let now = TestCalendar.date(2026, 11, 10, 9)
    var service: RecurringService { RecurringService(context: store.context) }

    @discardableResult
    func insert(_ title: String, on date: Date, recurrence: ExpenseRecurrence? = nil, recurrenceID: String? = nil,
                amount: Double = 500) throws -> Expense {
        let expense = Expense(title: title, amount: amount, transactionDate: date, note: "memo", categoryID: "ctg-bills",
                              recurrence: recurrence, recurrenceID: recurrenceID, warrantyID: "wrt-x",
                              now: TestCalendar.date(2026, 1, 1))
        store.context.insert(expense)
        try store.context.save()
        return expense
    }

    func copies(of template: Expense) throws -> [Expense] {
        try store.fetch(Expense.self).filter { $0.recurrenceID == template.id }
    }

    @Test func createsACopyOnTheFirstFromALastMonthTemplate() throws {
        let template = try insert("Rent", on: TestCalendar.date(2026, 10, 15), recurrence: .monthly)
        try service.populateCurrentPeriod(now: now, calendar: cal)
        let made = try copies(of: template)
        #expect(made.count == 1)
        let copy = try #require(made.first)
        #expect(copy.transactionDate == TestCalendar.date(2026, 11, 1, 0, 0))
        #expect(copy.title == "Rent" && copy.amount == 500 && copy.note == "memo" && copy.categoryID == "ctg-bills")
        #expect(copy.recurrence == nil && copy.recurrenceID == template.id && copy.warrantyID == nil)
        #expect(copy.id != template.id && copy.createdAt == now)
    }

    @Test func runningTwiceIsANoOp() throws {
        let template = try insert("Rent", on: TestCalendar.date(2026, 9, 15), recurrence: .monthly)
        try service.populateCurrentPeriod(now: now, calendar: cal)
        try service.populateCurrentPeriod(now: now.addingTimeInterval(3600), calendar: cal)
        #expect(try copies(of: template).count == 1)
        #expect(try store.fetch(Expense.self).count == 2)
    }

    @Test func noCopyWhenTheTemplateIsInTheCurrentMonth() throws {
        try insert("Rent", on: TestCalendar.date(2026, 11, 1, 0, 0), recurrence: .monthly)
        try insert("Gym", on: TestCalendar.date(2026, 11, 30, 23, 59), recurrence: .monthly)
        try service.populateCurrentPeriod(now: now, calendar: cal)
        #expect(try store.fetch(Expense.self).count == 2)
    }

    @Test func ignoresNonRecurringExpensesAndCopies() throws {
        try insert("Lunch", on: TestCalendar.date(2026, 10, 15))
        try insert("Old copy", on: TestCalendar.date(2026, 10, 1), recurrenceID: "exp-gone")
        try service.populateCurrentPeriod(now: now, calendar: cal)
        #expect(try store.fetch(Expense.self).count == 2)
    }

    @Test func aCopyFromAnEarlierMonthDoesNotCountForThisMonth() throws {
        let template = try insert("Rent", on: TestCalendar.date(2026, 9, 15), recurrence: .monthly)
        try insert("Rent", on: TestCalendar.date(2026, 10, 1), recurrenceID: template.id)
        try service.populateCurrentPeriod(now: now, calendar: cal)
        let made = try copies(of: template).map(\.transactionDate).sorted()
        #expect(made == [TestCalendar.date(2026, 10, 1), TestCalendar.date(2026, 11, 1, 0, 0)])
    }

    @Test func stopsGeneratingAfterTheSeriesIsCancelled() throws {
        let template = try insert("Rent", on: TestCalendar.date(2026, 9, 15), recurrence: .monthly)
        try service.populateCurrentPeriod(now: TestCalendar.date(2026, 10, 5), calendar: cal)
        #expect(try copies(of: template).count == 1)
        try service.cancelRecurrence(templateID: template.id, now: now)
        #expect(template.recurrence == nil && template.updatedAt == now)
        try service.populateCurrentPeriod(now: now, calendar: cal)
        #expect(try copies(of: template).count == 1)
        #expect(try store.fetch(Expense.self).count == 2)
    }

    @Test func cancellingAnUnknownTemplateDoesNothing() throws {
        try service.cancelRecurrence(templateID: "exp-unknown", now: now)
        #expect(try store.fetch(Expense.self).isEmpty)
    }

    @Test func handlesMultipleTemplatesIndependently() throws {
        let rent = try insert("Rent", on: TestCalendar.date(2026, 10, 15), recurrence: .monthly)
        let gym = try insert("Gym", on: TestCalendar.date(2026, 8, 3), recurrence: .monthly)
        try insert("Gym", on: TestCalendar.date(2026, 11, 1, 0, 0), recurrenceID: gym.id)
        try service.populateCurrentPeriod(now: now, calendar: cal)
        #expect(try copies(of: rent).count == 1)
        #expect(try copies(of: gym).count == 1)
    }
}
