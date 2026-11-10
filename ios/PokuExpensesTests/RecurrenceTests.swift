import Testing
@testable import PokuExpenses

/// Ported from the resolveRecurrenceFields cases in recurring-expense.service.test.ts.
struct RecurrenceTests {
    @Test func plainExpenseBecomesATemplateWhenToggledOn() {
        let r = Recurrence.resolveFields(isRecurring: true, recurrenceID: nil)
        #expect(r.recurrence == .monthly && r.recurrenceID == nil)
    }

    @Test func instanceStaysAnInstance() {
        let r = Recurrence.resolveFields(isRecurring: true, recurrenceID: "exp-tmpl")
        #expect(r.recurrence == nil && r.recurrenceID == "exp-tmpl")
    }

    @Test func templateDetachesWhenToggledOff() {
        let r = Recurrence.resolveFields(isRecurring: false, recurrenceID: nil)
        #expect(r.recurrence == nil && r.recurrenceID == nil)
    }

    @Test func instanceDetachesWhenToggledOff() {
        let r = Recurrence.resolveFields(isRecurring: false, recurrenceID: "exp-tmpl")
        #expect(r.recurrence == nil && r.recurrenceID == nil)
    }

    @Test func emptyRecurrenceIDCountsAsNone() {
        let r = Recurrence.resolveFields(isRecurring: true, recurrenceID: "")
        #expect(r.recurrence == .monthly && r.recurrenceID == nil)
    }
}
