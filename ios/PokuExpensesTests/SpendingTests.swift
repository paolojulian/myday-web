import Foundation
import Testing
@testable import PokuExpenses

@MainActor
struct SpendingTests {
    let bills = ExpenseCategory(id: "ctg-bills", name: "Bills")
    let food = ExpenseCategory(id: "ctg-food", name: "Food")
    let apps = ExpenseCategory(id: "ctg-apps", name: "apps")
    var categories: [ExpenseCategory] { [bills, food, apps] }

    func expense(_ amount: Double, _ categoryID: String?, at date: Date = TestCalendar.date(2026, 11, 10),
                 createdAt: Date? = nil, title: String = "") -> Expense {
        Expense(title: title, amount: amount, transactionDate: date, categoryID: categoryID, createdAt: createdAt)
    }

    @Test func namesByIDMapsIDToNameKeepingTheFirstDuplicate() {
        let duplicate = ExpenseCategory(id: "ctg-food", name: "Snacks")
        let names = Spending.namesByID([food, bills, duplicate])
        #expect(names == ["ctg-food": "Food", "ctg-bills": "Bills"])
    }

    // MARK: breakdown

    @Test func breakdownSplitsBillsByExactName() {
        let notBills = ExpenseCategory(id: "ctg-lower", name: "bills")
        let result = Spending.breakdown(
            expenses: [expense(1000, bills.id), expense(200, food.id), expense(50, nil),
                       expense(30, "ctg-missing"), expense(5, notBills.id)],
            categories: categories + [notBills])
        #expect(result == SpentBreakdown(bills: 1000, nonBills: 285, total: 1285))
    }

    @Test func breakdownCountsRefundsAsSubtractions() {
        let result = Spending.breakdown(expenses: [expense(1000, bills.id), expense(-100, bills.id), expense(300, food.id), expense(-50, food.id)],
                                        categories: categories)
        #expect(result == SpentBreakdown(bills: 900, nonBills: 250, total: 1150))
    }

    @Test func breakdownOfNothingIsZero() {
        #expect(Spending.breakdown(expenses: [], categories: categories) == SpentBreakdown(bills: 0, nonBills: 0, total: 0))
    }

    // MARK: byCategory

    @Test func byCategoryUsesPositiveAmountsSortedDescending() {
        let result = Spending.byCategory(
            expenses: [expense(100, food.id), expense(300, bills.id), expense(100, food.id), expense(-500, food.id), expense(0, apps.id)],
            categories: categories)
        #expect(result.map(\.categoryName) == ["Bills", "Food"])
        #expect(result.map(\.total) == [300, 200])
        #expect(result.map(\.percentage) == [60, 40])
        #expect(result.map(\.categoryID) == ["ctg-bills", "ctg-food"])
    }

    @Test func byCategoryNamesUnknownAndUncategorized() {
        let result = Spending.byCategory(expenses: [expense(75, "ctg-gone"), expense(25, nil)], categories: categories)
        #expect(result.count == 2)
        #expect(result[0].categoryName == "Unknown" && result[0].categoryID == "ctg-gone" && result[0].percentage == 75)
        #expect(result[1].categoryName == "Uncategorized" && result[1].categoryID == nil)
        #expect(result[1].id == "__uncategorized__")
    }

    @Test func byCategoryOfOnlyRefundsIsEmpty() {
        #expect(Spending.byCategory(expenses: [expense(-10, food.id)], categories: categories).isEmpty)
    }

    // MARK: topCategories

    @Test func topCategoriesByUsageThenName() {
        let others = (1...4).map { ExpenseCategory(id: "ctg-\($0)", name: "Z\($0)") }
        let all = categories + others
        let expenses = [expense(1, food.id), expense(1, food.id), expense(1, food.id),
                        expense(1, "ctg-3"), expense(1, "ctg-3"),
                        expense(1, bills.id), expense(1, nil)]
        let top = Spending.topCategories(expenses: expenses, categories: all)
        #expect(top.map(\.name) == ["Food", "Z3", "Bills", "apps", "Z1"])
        #expect(Spending.topCategories(expenses: expenses, categories: all, limit: 2).map(\.name) == ["Food", "Z3"])
    }

    @Test func topCategoriesWithNoExpensesIsAlphabetical() {
        #expect(Spending.topCategories(expenses: [], categories: categories).map(\.name) == ["apps", "Bills", "Food"])
    }

    // MARK: groupByDay

    @Test func groupByDayNewestDayFirstWithTotals() {
        let cal = TestCalendar.calendar
        let items = [
            expense(100, nil, at: TestCalendar.date(2026, 11, 9, 8), title: "9-morning"),
            expense(50, nil, at: TestCalendar.date(2026, 11, 10, 0, 0), title: "10-midnight"),
            expense(-20, nil, at: TestCalendar.date(2026, 11, 10, 23, 59), title: "10-late"),
            expense(10, nil, at: TestCalendar.date(2026, 11, 9, 20), title: "9-evening"),
        ]
        let groups = Spending.groupByDay(items, calendar: cal)
        #expect(groups.map(\.day) == [TestCalendar.date(2026, 11, 10, 0), TestCalendar.date(2026, 11, 9, 0)])
        #expect(groups.map { $0.expenses.map(\.title) } == [["10-late", "10-midnight"], ["9-evening", "9-morning"]])
        #expect(groups.map(\.total) == [30, 110])
    }

    @Test func groupByDayBreaksTimeTiesByNewestCreatedAt() {
        let at = TestCalendar.date(2026, 11, 10, 9)
        let items = [
            expense(1, nil, at: at, createdAt: TestCalendar.date(2026, 11, 10, 9, 1), title: "first"),
            expense(1, nil, at: at, createdAt: TestCalendar.date(2026, 11, 10, 9, 5), title: "second"),
        ]
        let groups = Spending.groupByDay(items, calendar: TestCalendar.calendar)
        #expect(groups.count == 1)
        #expect(groups[0].expenses.map(\.title) == ["second", "first"])
    }

    @Test func groupByDayOfNothingIsEmpty() {
        #expect(Spending.groupByDay([], calendar: TestCalendar.calendar).isEmpty)
    }
}
