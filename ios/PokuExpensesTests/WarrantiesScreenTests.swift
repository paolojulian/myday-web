import Foundation
import Testing
@testable import PokuExpenses

/// Warranties (mockup 10, 13): header count, status colours, ordering and the form's expiry row.
@MainActor
struct WarrantiesScreenTests {
    @Test func headerCountsReceipts() {
        #expect(WarrantiesScreen.countLabel(0) == "0 receipts")
        #expect(WarrantiesScreen.countLabel(1) == "1 receipt")
        #expect(WarrantiesScreen.countLabel(4) == "4 receipts")
    }

    @Test func statusColourFollowsTheTone() {
        #expect(WarrantiesScreen.color(for: .expired) == Theme.Colors.danger)
        #expect(WarrantiesScreen.color(for: .soon) == Theme.Colors.warning)
        #expect(WarrantiesScreen.color(for: .ok) == Theme.Colors.success)
        #expect(WarrantiesScreen.color(for: .none) == Theme.Colors.textSubtle)
    }

    @Test func rowsAreSoonestExpiryFirstWithUndatedLast() {
        let undated = Warranty(title: "Chair", now: TestCalendar.date(2026, 1, 1))
        let late = Warranty(title: "Vacuum", expirationDate: TestCalendar.date(2028, 11, 3))
        let soon = Warranty(title: "Earbuds", expirationDate: TestCalendar.date(2026, 11, 22))
        let sorted = WarrantiesScreen.sorted([undated, late, soon])
        #expect(sorted.map(\.title) == ["Earbuds", "Vacuum", "Chair"])
    }

    @Test func deleteConfirmationNamesTheWarranty() {
        #expect(DeleteConfirmation.title("Blender") == "Delete “Blender”?")
    }

    @Test func formExpiryRowTextAndLinks() {
        let day = TestCalendar.date(2028, 3, 14)
        #expect(WarrantyFormScreen.expiryText(nil, calendar: TestCalendar.calendar) == "No expiry date")
        #expect(WarrantyFormScreen.expiryText(day, calendar: TestCalendar.calendar) == "Mar 14, 2028")
        #expect(WarrantyFormScreen.dateLinkTitle(nil) == "Set date")
        #expect(WarrantyFormScreen.dateLinkTitle(day) == "Change date")
    }
}
