import Testing
@testable import PokuExpenses

/// The one as-you-type money formatting, shared by the budget sheet and the expense form.
struct UnderlineFieldTests {
    @Test func moneyInputRewritesTypedDigits() {
        #expect(UnderlineField.reformatted("6", moneyInput: true) == "₱ 6")
        #expect(UnderlineField.reformatted("₱ 6505", moneyInput: true) == "₱ 6,505")
        #expect(UnderlineField.reformatted("₱ 1.234", moneyInput: true) == "₱ 1.23")
    }

    @Test func moneyInputLeavesFormattedTextAlone() {
        #expect(UnderlineField.reformatted("₱ 6,505", moneyInput: true) == nil)
        #expect(UnderlineField.reformatted("", moneyInput: true) == nil)
    }

    @Test func plainFieldsAreNeverRewritten() {
        #expect(UnderlineField.reformatted("1234", moneyInput: false) == nil)
    }
}
