import Testing
@testable import PokuExpenses

/// Ported from src/lib/currency.utils.test.ts, formatters.utils.test.ts and the amount validation
/// rules in transaction-amount-field.tsx / modal-budget-setup.tsx.
struct MoneyTests {
    // toCurrency
    @Test func formatWholeNumbers() {
        #expect(Money.format(1000) == "₱1,000")
        #expect(Money.format(0) == "₱0")
        #expect(Money.format(1_234_567) == "₱1,234,567")
        #expect(Money.format(500) == "₱500") // no ".00"
    }

    @Test func formatFractions() {
        #expect(Money.format(1250.5) == "₱1,250.5")
        #expect(Money.format(1250.75) == "₱1,250.75")
        #expect(Money.format(10.005) == "₱10.01")
        #expect(Money.format(0.1 + 0.2) == "₱0.3")
    }

    @Test func formatNegative() {
        #expect(Money.format(-500) == "-₱500")
        #expect(Money.format(-1250.5) == "-₱1,250.5")
    }

    @Test func formatSigned() {
        #expect(Money.formatSigned(expenseAmount: -500) == "+₱500")
        #expect(Money.formatSigned(expenseAmount: 650) == "₱650")
        #expect(Money.formatSigned(expenseAmount: 0) == "₱0")
    }

    // formatCurrency
    @Test(arguments: [
        ("1000", "₱ 1,000"),
        ("1234567", "₱ 1,234,567"),
        ("1000.50", "₱ 1,000.50"),
        ("1000.999", "₱ 1,000.99"),
        ("", ""),
        ("100.", "₱ 100."),
        (".", "₱ 0."),
        ("₱ 500", "₱ 500"),
        ("1,000", "₱ 1,000"),
        ("-500", "-₱ 500"),
        ("-", "-"),
        ("abc", ""),
        (".5", "₱ 0.5"),
        ("007", "₱ 7"),
        ("12abc", "₱ 12"),
        ("-₱ 1,234.5", "-₱ 1,234.5"),
    ])
    func formatInput(raw: String, expected: String) {
        #expect(Money.formatInput(raw) == expected)
    }

    // clearCurrencyFormatting + Number()
    @Test func parseInput() {
        #expect(Money.parseInput("₱ 1,000") == 1000)
        #expect(Money.parseInput("1,234,567") == 1_234_567)
        #expect(Money.parseInput("₱ 1,000.50") == 1000.5)
        #expect(Money.parseInput("-₱ 500") == -500)
        #expect(Money.parseInput("") == nil)
        #expect(Money.parseInput("₱ ") == nil)
        #expect(Money.parseInput("abc") == nil)
        #expect(Money.parseInput("-") == nil)
        #expect(Money.parseInput("inf") == nil)
        #expect(Money.parseInput("nan") == nil)
    }

    @Test func expenseAmountError() {
        #expect(Money.expenseAmountError("") == "Amount is required")
        #expect(Money.expenseAmountError("₱ ") == "Amount is required")
        #expect(Money.expenseAmountError("abc") == "Please enter a valid number")
        #expect(Money.expenseAmountError("-") == "Please enter a valid number")
        #expect(Money.expenseAmountError("₱ 0") == "Amount cannot be zero")
        #expect(Money.expenseAmountError("₱ 0.00") == "Amount cannot be zero")
        #expect(Money.expenseAmountError("₱ 999,999,999") == "Amount must be less than 999,999,999")
        #expect(Money.expenseAmountError("₱ 999,999,998.99") == nil)
        #expect(Money.expenseAmountError("₱ 250") == nil)
        #expect(Money.expenseAmountError("-₱ 250") == nil)
    }

    @Test func budgetAmountError() {
        #expect(Money.budgetAmountError("") == "Amount is required")
        #expect(Money.budgetAmountError("abc") == "Please enter a valid number")
        #expect(Money.budgetAmountError("₱ 0") == "Amount must be greater than 0")
        #expect(Money.budgetAmountError("-₱ 5") == "Amount must be greater than 0")
        #expect(Money.budgetAmountError("₱ 1,000,000,000") == "Amount must be less than 999,999,999")
        #expect(Money.budgetAmountError("₱ 20,000") == nil)
    }
}
