import Foundation
import Testing
@testable import PokuExpenses

/// Display rules of the expense form's pieces (design §8, mockup 5–8).
@MainActor
struct ExpenseFormViewsTests {
    let cal = TestCalendar.calendar
    let now = TestCalendar.date(2026, 11, 10, 9, 30)

    // MARK: DateChoice

    @Test func todayAndYesterdayCellsShowTheirShortDates() {
        let cells = DateChoice.Cells(date: now, now: now, calendar: cal)
        #expect(cells.todaySubtitle == "Nov 10")
        #expect(cells.yesterdaySubtitle == "Nov 9")
        #expect(cells.selected == .today)
    }

    @Test func customReadsPickADateUntilAnotherDayIsChosen() {
        let today = DateChoice.Cells(date: now, now: now, calendar: cal)
        #expect(today.customTitle == "Custom" && today.customSubtitle == "Pick a date")
        let yesterday = DateChoice.Cells(date: TestCalendar.date(2026, 11, 9, 8), now: now, calendar: cal)
        #expect(yesterday.selected == .yesterday)
        #expect(yesterday.customTitle == "Custom")

        let custom = DateChoice.Cells(date: TestCalendar.date(2026, 11, 3, 8), now: now, calendar: cal)
        #expect(custom.selected == .custom)
        #expect(custom.customTitle == "Nov 3")
        #expect(custom.customSubtitle == "Custom")
    }

    @Test func aCustomDateInAnotherYearStillReadsMonthAndDay() {
        let cells = DateChoice.Cells(date: TestCalendar.date(2025, 12, 31), now: now, calendar: cal)
        #expect(cells.customTitle == "Dec 31")
        #expect(cells.selected == .custom)
    }

    @Test func choosingADayKeepsTheTimeOfDay() {
        let chosen = DateChoice.day(TestCalendar.date(2026, 11, 3, 0), keepingTimeOf: TestCalendar.date(2026, 11, 10, 14, 25, 7),
                                    calendar: cal)
        #expect(chosen == TestCalendar.date(2026, 11, 3, 14, 25, 7))
    }

    // MARK: CustomDateSheet

    @Test func confirmNamesTheDate() {
        #expect(CustomDateSheet.confirmTitle(TestCalendar.date(2026, 11, 3), calendar: cal) == "Use Nov 3, 2026")
    }

    // MARK: CategoryGrid

    func categories(_ names: String...) -> [ExpenseCategory] { names.map { ExpenseCategory(name: $0) } }

    @Test func othersCellNamesAChosenCategoryOutsideTheTopFive() {
        let all = categories("Food", "Groceries", "Bills", "Shopping", "Health", "Pets")
        let top = Array(all.prefix(5))
        let pets = all[5]
        let othersSelected = CategoryGrid.othersCell(selectedID: pets.id, top: top, all: all)
        #expect(othersSelected.title == "Pets" && othersSelected.isSelected)

        let topSelected = CategoryGrid.othersCell(selectedID: all[0].id, top: top, all: all)
        #expect(topSelected.title == "Others" && !topSelected.isSelected)
        let none = CategoryGrid.othersCell(selectedID: nil, top: top, all: all)
        #expect(none.title == "Others" && !none.isSelected)
    }

    @Test func othersCellIgnoresADanglingCategoryID() {
        let all = categories("Food")
        let cell = CategoryGrid.othersCell(selectedID: "ctg-gone", top: all, all: all)
        #expect(cell.title == "Others" && !cell.isSelected)
    }

    // MARK: CategoryPickerSheet

    @Test func searchFiltersCaseInsensitivelyAndSortsAToZ() {
        let all = categories("pet supplies", "Food", "Petrol", "Bills")
        #expect(CategoryPickerSheet.filtered(all, query: "").map(\.name) == ["Bills", "Food", "pet supplies", "Petrol"])
        #expect(CategoryPickerSheet.filtered(all, query: " PET ").map(\.name) == ["pet supplies", "Petrol"])
    }

    @Test func createIsOfferedOnlyWithoutAnExactMatch() {
        let all = categories("Pet supplies", "Food")
        #expect(CategoryPickerSheet.createName(all, query: " Pet ") == "Pet")
        #expect(CategoryPickerSheet.createName(all, query: "food") == nil)
        #expect(CategoryPickerSheet.createName(all, query: "   ") == nil)
    }

    // MARK: ReceiptField / form

    @Test func expiryTextReadsTheDateOrNoExpiry() {
        #expect(ExpenseFormScreen.expiryText(TestCalendar.date(2028, 11, 3), calendar: cal) == "Expires Nov 3, 2028")
        #expect(ExpenseFormScreen.expiryText(nil, calendar: cal) == "No expiry date")
    }

    @Test func receiptImageFollowsTheReceiptChange() {
        let old = Data([1]), new = Data([2])
        #expect(ExpenseFormScreen.receiptImage(change: .none, existing: old) == old)
        #expect(ExpenseFormScreen.receiptImage(change: .replaced(new), existing: old) == new)
        #expect(ExpenseFormScreen.receiptImage(change: .removed, existing: old) == nil)
    }
}
