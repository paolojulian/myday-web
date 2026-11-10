import Foundation
import Testing
@testable import PokuExpenses

/// Categories (mockup 11) and Settings (mockup 12).
@MainActor
struct CategoriesSettingsTests {
    // MARK: Categories

    @Test func addIsDisabledWhenTheNameIsBlank() {
        #expect(CategoriesScreen.canAdd("") == false)
        #expect(CategoriesScreen.canAdd("   ") == false)
        #expect(CategoriesScreen.canAdd(" Pets "))
    }

    @Test func categoriesAreListedAToZIgnoringCase() {
        let names = ["food", "Bills", "education", "Entertainment"].map { ExpenseCategory(name: $0) }
        #expect(CategoriesScreen.sorted(names).map(\.name) == ["Bills", "education", "Entertainment", "food"])
    }

    @Test func deleteConfirmationNamesTheCategory() {
        #expect(CategoriesScreen.deleteTitle("Food") == "Delete “Food”?")
    }

    @Test func addingFromTheScreenTrimsAndDoesNotDuplicate() throws {
        let store = TestStore()
        try CategoriesScreen.add(name: " Pets ", context: store.context)
        try CategoriesScreen.add(name: "pets", context: store.context)
        let all = try store.fetch(ExpenseCategory.self)
        #expect(all.map(\.name) == ["Pets"])
    }

    // MARK: Settings

    @Test func versionComesFromTheBundleInfo() {
        #expect(SettingsScreen.versionText(info: ["CFBundleShortVersionString": "1.0.0"]) == "Version 1.0.0")
        #expect(SettingsScreen.versionText(info: nil) == "Version –")
    }

    @Test func syncStatusIsGreenOnlyWhenOn() {
        #expect(SettingsScreen.syncColor(.on) == Theme.Colors.success)
        #expect(SettingsScreen.syncColor(.signedOut) == Theme.Colors.textSubtle)
        #expect(SettingsScreen.syncColor(.off) == Theme.Colors.textSubtle)
    }
}
