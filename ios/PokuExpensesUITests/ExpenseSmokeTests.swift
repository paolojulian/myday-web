import XCTest

/// Requirement 11: add with Today, add with Yesterday and find it after stepping back, filter on Expenses.
/// `-uiTesting` gives a fresh in-memory store seeded with the nine default categories.
@MainActor
final class ExpenseSmokeTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() async throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uiTesting"]
        app.launch()
    }

    private func row(_ title: String) -> XCUIElement {
        app.buttons.matching(NSPredicate(format: "identifier BEGINSWITH 'expense-row-' AND label CONTAINS %@", title))
            .firstMatch
    }

    /// Opens the form, fills it and saves. `date` is a DateChoice identifier.
    private func addExpense(category: String, amount: String, title: String, date: String = "date-today") {
        let add = app.buttons["add-expense-button"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        add.tap()

        let cell = app.buttons["category-cell-\(category)"]
        XCTAssertTrue(cell.waitForExistence(timeout: 5))
        cell.tap()

        let amountField = app.textFields["amount-field"]
        XCTAssertTrue(amountField.waitForExistence(timeout: 5))
        if !(amountField.value(forKey: "hasKeyboardFocus") as? Bool ?? false) { amountField.tap() }
        amountField.typeAmount(amount)

        // The decimal pad has no return key; the keyboard toolbar moves on to the title.
        app.buttons["keyboard-next"].tap()
        let titleField = app.textFields["title-field"]
        XCTAssertTrue(titleField.value(forKey: "hasKeyboardFocus") as? Bool ?? false)
        titleField.typeText(title)
        app.buttons["keyboard-done"].tap()

        let dateCell = app.buttons[date]
        if !dateCell.isHittable { app.swipeUp() }
        dateCell.tap()

        app.buttons["form-save-button"].tap()
        XCTAssertTrue(add.waitForExistence(timeout: 5), "the form closes after saving")
    }

    func testAddingWithTodayShowsOnHome() {
        addExpense(category: "Food", amount: "650", title: "Lunch")
        let lunch = row("Lunch")
        XCTAssertTrue(lunch.waitForExistence(timeout: 5))
        XCTAssertTrue(lunch.label.contains("₱650"), lunch.label)
        XCTAssertEqual(app.staticTexts["stepper-label"].label, "Today")
    }

    func testAddingWithYesterdayShowsAfterSteppingBack() {
        addExpense(category: "Food", amount: "120", title: "Taxi", date: "date-yesterday")
        // On Today it is listed once, among earlier days.
        XCTAssertTrue(row("Taxi").waitForExistence(timeout: 5))

        app.buttons["stepper-previous"].tap()
        XCTAssertEqual(app.staticTexts["stepper-label"].label, "Yesterday")
        XCTAssertTrue(app.buttons["stepper-next"].isEnabled)
        XCTAssertTrue(row("Taxi").waitForExistence(timeout: 5))
        XCTAssertFalse(app.staticTexts["No expenses for this day."].exists)
    }

    func testExpensesFiltersByCategory() {
        addExpense(category: "Food", amount: "650", title: "Lunch")
        addExpense(category: "Bills", amount: "2310", title: "Electricity")

        app.tabBars.buttons["Expenses"].tap()
        XCTAssertTrue(row("Lunch").waitForExistence(timeout: 5))
        XCTAssertTrue(row("Electricity").exists)

        let food = app.buttons["category-chip-Food"]
        XCTAssertTrue(food.waitForExistence(timeout: 5))
        food.tap()
        XCTAssertTrue(row("Lunch").waitForExistence(timeout: 5))
        XCTAssertFalse(row("Electricity").exists)

        food.tap()
        XCTAssertTrue(row("Electricity").waitForExistence(timeout: 5))
    }
}
