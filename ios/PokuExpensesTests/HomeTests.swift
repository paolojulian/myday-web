import Foundation
import Testing
@testable import PokuExpenses

@MainActor
struct HomeTests {
    let cal = TestCalendar.calendar

    // MARK: whole-day windows

    @Test func selectedDayIntervalIsTheWholeDay() {
        let interval = DateMath.dayInterval(TestCalendar.date(2026, 11, 10, 15), calendar: cal)
        #expect(interval.start == TestCalendar.date(2026, 11, 10, 0))
        #expect(interval.end == TestCalendar.date(2026, 11, 11, 0))
    }

    @Test func earlierWindowEndsAtTheStartOfTheSelectedDay() {
        let interval = HomeScreen.earlierInterval(selectedDay: TestCalendar.date(2026, 11, 10, 15), windowDays: 30, calendar: cal)
        #expect(interval.start == TestCalendar.date(2026, 10, 11, 0))
        #expect(interval.end == TestCalendar.date(2026, 11, 10, 0))
    }

    @Test func showEarlierAddsThirtyWholeDays() {
        let interval = HomeScreen.earlierInterval(selectedDay: TestCalendar.date(2026, 11, 10), windowDays: 60, calendar: cal)
        #expect(interval.start == TestCalendar.date(2026, 9, 11, 0))
        #expect(HomeScreen.initialWindowDays == 30)
        #expect(HomeScreen.windowStep == 30)
    }

    @Test func earlierGroupsKeepExactDayTotals() {
        let a = Expense(title: "a", amount: 100, transactionDate: TestCalendar.date(2026, 11, 9, 23, 59))
        let b = Expense(title: "b", amount: -40, transactionDate: TestCalendar.date(2026, 11, 9, 0, 0))
        let c = Expense(title: "c", amount: 10, transactionDate: TestCalendar.date(2026, 11, 8, 8))
        let groups = Spending.groupByDay([c, b, a], calendar: cal)
        #expect(groups.map(\.total) == [60, 10])
    }

    // MARK: BudgetSummary figures

    func analysis(budget: Double, spent: Double, bills: Double = 0) -> BudgetAnalysis {
        BudgetAnalysis.calculate(monthlyBudget: budget, totalSpent: spent, billsSpent: bills,
                                 date: TestCalendar.date(2026, 11, 10), calendar: cal)
    }

    @Test func remainingModeShowsWhatIsLeft() {
        let figures = BudgetSummary.Figures(analysis: analysis(budget: 30000, spent: 9000), mode: .remaining)
        #expect(figures.headline == "₱21,000")
        #expect(figures.caption == "left of ₱30,000")
        #expect(figures.spent == "₱9,000")
        #expect(figures.daysLeft == "20")
        #expect(figures.status == "On track")
    }

    @Test func spentModeShowsWhatWasSpent() {
        let figures = BudgetSummary.Figures(analysis: analysis(budget: 30000, spent: 11550), mode: .spent)
        #expect(figures.headline == "₱11,550")
        #expect(figures.caption == "spent of ₱30,000")
    }

    @Test func dailyLeftNeverGoesNegative() {
        let figures = BudgetSummary.Figures(analysis: analysis(budget: 1000, spent: 5000), mode: .remaining)
        #expect(figures.dailyLeft == "₱0")
        #expect(figures.status == "Over budget")
        #expect(figures.progress == 1)
    }

    @Test func statusColourFollowsBudgetStatus() {
        #expect(BudgetSummary.color(for: .healthy) == Theme.Colors.success)
        #expect(BudgetSummary.color(for: .warning) == Theme.Colors.warning)
        #expect(BudgetSummary.color(for: .danger) == Theme.Colors.danger)
    }

    @Test func homeAnalysisUsesBillsAndTotalOfTheMonth() {
        let billsCategory = ExpenseCategory(id: "ctg-bills", name: "Bills")
        let expenses = [Expense(title: "Net", amount: 1500, transactionDate: TestCalendar.date(2026, 11, 2), categoryID: billsCategory.id),
                        Expense(title: "Food", amount: 500, transactionDate: TestCalendar.date(2026, 11, 3))]
        let budget = Budget(amount: 30000)
        let result = BudgetSummary.analysis(budget: budget, expenses: expenses, categories: [billsCategory],
                                            now: TestCalendar.date(2026, 11, 10), calendar: cal)
        #expect(result == analysis(budget: 30000, spent: 2000, bills: 1500))
        #expect(BudgetSummary.analysis(budget: nil, expenses: expenses, categories: [], now: .now, calendar: cal) == nil)
    }

    // MARK: BudgetSheet

    @Test func budgetSheetPrefillsAndLabelsWhenEditing() {
        #expect(BudgetSheet.saveTitle(isEditing: false) == "Set budget")
        #expect(BudgetSheet.saveTitle(isEditing: true) == "Update budget")
    }

    @Test func budgetSheetSubmitSavesOnlyValidAmounts() throws {
        let store = TestStore()
        #expect(try BudgetSheet.submit("", context: store.context) == "Amount is required")
        #expect(try BudgetSheet.submit("₱ 0", context: store.context) == "Amount must be greater than 0")
        #expect(try store.fetch(Budget.self).isEmpty)
        #expect(try BudgetSheet.submit("₱ 30,000", context: store.context) == nil)
        #expect(try store.fetch(Budget.self).map(\.amount) == [30000])
    }
}
