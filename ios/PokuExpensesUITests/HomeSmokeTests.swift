import XCTest

/// Launch smoke tests (requirement 11). `-uiTesting` gives the app a fresh in-memory store.
@MainActor
final class HomeSmokeTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() async throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uiTesting"]
        app.launch()
    }

    func testLaunchShowsHomeWithNoBudget() {
        XCTAssertTrue(app.staticTexts["No budget set"].waitForExistence(timeout: 10))
        XCTAssertTrue(app.buttons["add-expense-button"].exists)
        XCTAssertEqual(app.staticTexts["stepper-label"].label, "Today")
        XCTAssertFalse(app.buttons["stepper-next"].isEnabled)
    }

    func testSettingABudgetShowsTheRemainingFigure() {
        let setBudget = app.buttons["budget-set-button"]
        XCTAssertTrue(setBudget.waitForExistence(timeout: 10))
        setBudget.tap()

        let field = app.textFields["budget-amount-field"]
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        // The field is focused on appear.
        XCTAssertTrue(field.value(forKey: "hasKeyboardFocus") as? Bool ?? false)
        field.typeText("30000")
        XCTAssertEqual(field.value as? String, "₱ 30,000")
        app.buttons["budget-save-button"].tap()

        let figure = app.buttons["budget-figure"]
        XCTAssertTrue(figure.waitForExistence(timeout: 5))
        XCTAssertTrue(figure.label.contains("₱30,000"), figure.label)
        XCTAssertTrue(app.staticTexts["left of ₱30,000"].exists)
        XCTAssertFalse(app.staticTexts["No budget set"].exists)
    }
}
