import XCTest

/// Smoke tests for Warranties, Settings and Categories. `-uiTesting` gives a fresh in-memory store.
@MainActor
final class SettingsWarrantySmokeTests: XCTestCase {
    private var app: XCUIApplication!

    override func setUp() async throws {
        continueAfterFailure = false
        app = XCUIApplication()
        app.launchArguments = ["-uiTesting"]
        app.launch()
    }

    func testAddingACategoryFromSettings() {
        app.tabBars.buttons["Settings"].tap()
        let categories = app.buttons["settings-categories"]
        XCTAssertTrue(categories.waitForExistence(timeout: 10))
        categories.tap()

        let field = app.textFields["new-category-field"]
        XCTAssertTrue(field.waitForExistence(timeout: 5))
        XCTAssertFalse(app.buttons["new-category-add"].isEnabled)
        field.tap()
        field.typeText("Pets")
        app.buttons["new-category-add"].tap()
        XCTAssertTrue(app.staticTexts["Pets"].waitForExistence(timeout: 5))
        XCTAssertEqual(field.value as? String, "New category name")
    }

    func testStandaloneWarrantyNeedsANameAndAPhoto() {
        app.tabBars.buttons["Warranties"].tap()
        let add = app.buttons["add-warranty-button"]
        XCTAssertTrue(add.waitForExistence(timeout: 10))
        XCTAssertTrue(app.staticTexts["No warranties yet. Add one here, or attach a receipt when logging an expense."].exists)
        add.tap()

        let save = app.buttons["warranty-save-button"]
        XCTAssertTrue(save.waitForExistence(timeout: 5))
        save.tap()
        XCTAssertTrue(app.staticTexts["Name is required"].waitForExistence(timeout: 5))
        XCTAssertTrue(app.staticTexts["Add a receipt photo"].exists)
    }
}
