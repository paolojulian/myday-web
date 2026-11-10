import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

@MainActor
struct BudgetServiceTests {
    let store = TestStore()
    var service: BudgetService { BudgetService(context: store.context) }
    let cal = TestCalendar.calendar

    func insert(_ amount: Double, createdAt: Date) throws {
        store.context.insert(Budget(amount: amount, createdAt: createdAt))
        try store.context.save()
    }

    @Test func setCreatesAndReturnsARecord() throws {
        let now = TestCalendar.date(2026, 11, 10)
        let budget = try service.set(amount: 5000, now: now)
        #expect(budget.amount == 5000 && budget.id.hasPrefix("bdg") && budget.createdAt == now)
        let all = try store.fetch(Budget.self)
        #expect(all.count == 1 && all[0].amount == 5000)
    }

    @Test func setAlwaysInsertsANewRecord() throws {
        try service.set(amount: 1000)
        try service.set(amount: 2000)
        #expect(try store.fetch(Budget.self).count == 2)
    }

    @Test func returnsTheBudgetCreatedBeforeTheEndOfTheMonth() throws {
        try insert(3000, createdAt: TestCalendar.date(2024, 1, 10, 10))
        #expect(try service.budget(forMonthOf: TestCalendar.date(2024, 1, 31), calendar: cal)?.amount == 3000)
    }

    @Test func returnsNilForAMonthBeforeTheFirstBudget() throws {
        try insert(3000, createdAt: TestCalendar.date(2024, 1, 10))
        #expect(try service.budget(forMonthOf: TestCalendar.date(2020, 1, 31), calendar: cal) == nil)
        #expect(try service.budget(forMonthOf: TestCalendar.date(2023, 12, 31, 23, 59), calendar: cal) == nil)
    }

    @Test func returnsTheMostRecentOfSeveral() throws {
        try insert(1000, createdAt: TestCalendar.date(2024, 1, 5))
        try insert(2000, createdAt: TestCalendar.date(2024, 1, 20))
        #expect(try service.budget(forMonthOf: TestCalendar.date(2024, 1, 31), calendar: cal)?.amount == 2000)
    }

    @Test func ignoresABudgetCreatedAfterTheMonth() throws {
        try insert(9999, createdAt: TestCalendar.date(2024, 2, 1, 0, 0))
        #expect(try service.budget(forMonthOf: TestCalendar.date(2024, 1, 31), calendar: cal) == nil)
    }

    @Test func anOlderBudgetCarriesIntoLaterMonths() throws {
        try insert(4500, createdAt: TestCalendar.date(2024, 1, 5))
        #expect(try service.budget(forMonthOf: TestCalendar.date(2024, 6, 1), calendar: cal)?.amount == 4500)
    }

    @Test func worksWithTheCurrentMonthViaSet() throws {
        try service.set(amount: 4500)
        #expect(try service.budget(forMonthOf: .now)?.amount == 4500)
    }

    @Test func latestDescriptorFetchesOnlyTheNewestBudgetBeforeTheEnd() throws {
        try insert(1000, createdAt: TestCalendar.date(2024, 1, 5))
        try insert(2000, createdAt: TestCalendar.date(2024, 1, 20))
        try insert(9999, createdAt: TestCalendar.date(2024, 2, 1, 0, 0))
        let end = DateMath.monthInterval(TestCalendar.date(2024, 1, 15), calendar: cal).end
        let fetched = try store.context.fetch(BudgetService.latestDescriptor(before: end))
        #expect(fetched.map(\.amount) == [2000])
    }
}
