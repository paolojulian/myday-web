import Foundation
import Testing
@testable import PokuExpenses

/// Expenses (mockup 4): category strip figures, filtering and the list rule.
@MainActor
struct ExpensesScreenTests {
    let day = TestCalendar.date(2026, 11, 10)

    func spending(_ id: String?, _ name: String, _ total: Double, _ percentage: Double) -> CategorySpending {
        CategorySpending(categoryID: id, categoryName: name, total: total, percentage: percentage)
    }

    @Test func stripCellShowsAmountBarRelativeToTheLargestAndWholePercent() {
        let food = CategoryStrip.Cell(spending("a", "Food", 4620, 40), maxTotal: 4620)
        #expect(food.amount == "₱4,620")
        #expect(food.barFraction == 1)
        #expect(food.percent == "40%")
        let bills = CategoryStrip.Cell(spending("b", "Bills", 2310, 19.6), maxTotal: 4620)
        #expect(bills.barFraction == 0.5)
        #expect(bills.percent == "20%")
        #expect(CategoryStrip.Cell(spending(nil, "Uncategorized", 0, 0), maxTotal: 0).barFraction == 0)
    }

    @Test func noFilterListsEverything() {
        let expenses = [Expense(title: "a", amount: 1, transactionDate: day, categoryID: "a"),
                        Expense(title: "b", amount: 2, transactionDate: day)]
        #expect(ExpensesScreen.filtered(expenses, selectedID: nil).count == 2)
    }

    @Test func filterKeepsOnlyThatCategoryIncludingRefunds() {
        let food = Expense(title: "a", amount: 100, transactionDate: day, categoryID: "a")
        let refund = Expense(title: "r", amount: -40, transactionDate: day, categoryID: "a")
        let other = Expense(title: "b", amount: 2, transactionDate: day, categoryID: "b")
        let none = Expense(title: "c", amount: 3, transactionDate: day)
        let all = [food, refund, other, none]
        #expect(ExpensesScreen.filtered(all, selectedID: "a").map(\.title) == ["a", "r"])
        // The strip's id for "no category" filters to expenses without one.
        let uncategorized = CategorySpending(categoryID: nil, categoryName: "Uncategorized", total: 3, percentage: 1).id
        #expect(ExpensesScreen.filtered(all, selectedID: uncategorized).map(\.title) == ["c"])
    }

    @Test func spendingIDIsTheSharedKey() {
        #expect(CategorySpending.key(categoryID: "a") == "a")
        #expect(CategorySpending(categoryID: nil, categoryName: "", total: 0, percentage: 0).id == CategorySpending.key(categoryID: nil))
        #expect(CategorySpending.key(categoryID: nil) != CategorySpending.key(categoryID: ""))
    }

    @Test func ruleNamesTheFilterAndCount() {
        #expect(ExpensesScreen.ruleTitle(categoryName: nil, count: 12) == "All · 12 expenses")
        #expect(ExpensesScreen.ruleTitle(categoryName: "Food", count: 9) == "Food · 9 expenses")
        #expect(ExpensesScreen.ruleTitle(categoryName: "Food", count: 1) == "Food · 1 expense")
    }
}
