import Foundation
import Testing
@testable import PokuExpenses

struct RootViewTests {
    @Test func tabsAreHomeExpensesWarrantiesSettingsInOrder() {
        #expect(RootView.Tab.allCases.map(\.title) == ["Home", "Expenses", "Warranties", "Settings"])
        #expect(RootView.Tab.allCases.map(\.systemImage) ==
                ["house", "list.bullet.rectangle", "doc.text.image", "gearshape"])
    }

    @Test func formTargetIDsDistinguishAddFromEdit() {
        let day = TestCalendar.date(2026, 11, 10)
        let add = FormTarget.add(defaultDate: day)
        let edit = FormTarget.edit(expenseID: "exp-1")
        #expect(add.id != edit.id)
        #expect(edit.id == FormTarget.edit(expenseID: "exp-1").id)
        #expect(edit.id != FormTarget.edit(expenseID: "exp-2").id)
        #expect(add.id != FormTarget.add(defaultDate: TestCalendar.date(2026, 11, 9)).id)
    }
}
