import Foundation
import Testing
@testable import PokuExpenses

/// Ported from src/lib/dates.utils.test.ts. "Now" is pinned instead of read from the clock.
struct DateMathTests {
    let cal = TestCalendar.calendar
    let fixed = TestCalendar.date(2024, 3, 15) // March 15, 2024, noon
    func d(_ y: Int, _ m: Int, _ day: Int, _ h: Int = 12, _ min: Int = 0, _ s: Int = 0) -> Date {
        TestCalendar.date(y, m, day, h, min, s)
    }
    func parts(_ date: Date) -> DateComponents { TestCalendar.parts(date) }

    // getStartAndEndOfMonth
    @Test func monthIntervalCoversFirstToLastDay() {
        let interval = DateMath.monthInterval(fixed, calendar: cal)
        #expect(interval.start == d(2024, 3, 1, 0))
        #expect(interval.end == d(2024, 4, 1, 0)) // half-open
        let last = parts(interval.end.addingTimeInterval(-1))
        #expect(last.day == 31 && last.month == 3 && last.hour == 23)
    }

    @Test func monthIntervalHandlesLeapFebruary() {
        let interval = DateMath.monthInterval(d(2024, 2, 10), calendar: cal)
        #expect(parts(interval.start).day == 1)
        #expect(parts(interval.end.addingTimeInterval(-1)).day == 29)
    }

    // getStartAndEndOfDay
    @Test func dayIntervalIsMidnightToMidnight() {
        let interval = DateMath.dayInterval(d(2024, 3, 15, 13, 45), calendar: cal)
        #expect(interval.start == d(2024, 3, 15, 0))
        #expect(interval.end == d(2024, 3, 16, 0))
        let lastSecond = parts(interval.end.addingTimeInterval(-1))
        #expect(lastSecond.day == 15 && lastSecond.hour == 23 && lastSecond.minute == 59 && lastSecond.second == 59)
        #expect(interval.contains(d(2024, 3, 15, 0)))
    }

    // getNumberOfDaysInMonth / getTotalDaysInMonth
    @Test(arguments: [((2024, 3), 31), ((2023, 2), 28), ((2024, 2), 29), ((2024, 4), 30)])
    func totalDaysInMonth(month: (Int, Int), expected: Int) {
        #expect(DateMath.totalDaysInMonth(d(month.0, month.1, 1), calendar: cal) == expected)
    }

    // getDaysElapsedInMonth
    @Test func daysElapsedIsDayOfMonth() {
        #expect(DateMath.daysElapsedInMonth(d(2024, 3, 15), calendar: cal) == 15)
        #expect(DateMath.daysElapsedInMonth(d(2024, 3, 1), calendar: cal) == 1)
        #expect(DateMath.daysElapsedInMonth(d(2024, 3, 31), calendar: cal) == 31)
    }

    // getDaysRemainingInMonth
    @Test func daysRemaining() {
        #expect(DateMath.daysRemainingInMonth(d(2024, 3, 15), calendar: cal) == 16)
        #expect(DateMath.daysRemainingInMonth(d(2024, 3, 31), calendar: cal) == 0)
    }

    // getPreviousMonth / getNextMonth
    @Test func addingMonths() {
        let prev = parts(DateMath.addingMonths(-1, to: fixed, calendar: cal))
        #expect(prev.month == 2 && prev.year == 2024)
        let next = parts(DateMath.addingMonths(1, to: fixed, calendar: cal))
        #expect(next.month == 4 && next.year == 2024)
        let wrapBack = parts(DateMath.addingMonths(-1, to: d(2024, 1, 15), calendar: cal))
        #expect(wrapBack.month == 12 && wrapBack.year == 2023)
        let wrapForward = parts(DateMath.addingMonths(1, to: d(2023, 12, 15), calendar: cal))
        #expect(wrapForward.month == 1 && wrapForward.year == 2024)
        let clamped = parts(DateMath.addingMonths(1, to: d(2024, 1, 31), calendar: cal))
        #expect(clamped.month == 2 && clamped.day == 29)
    }

    // getPreviousDay / getNextDay
    @Test func addingDays() {
        let prev = parts(DateMath.addingDays(-1, to: fixed, calendar: cal))
        #expect(prev.day == 14 && prev.month == 3)
        #expect(parts(DateMath.addingDays(1, to: fixed, calendar: cal)).day == 16)
        let wrapped = parts(DateMath.addingDays(-1, to: d(2024, 3, 1), calendar: cal))
        #expect(wrapped.day == 29 && wrapped.month == 2)
    }

    // isSameDay
    @Test func isSameDay() {
        #expect(DateMath.isSameDay(d(2024, 3, 15, 8), d(2024, 3, 15, 23, 59, 59), calendar: cal))
        #expect(!DateMath.isSameDay(d(2024, 3, 15), d(2024, 3, 16), calendar: cal))
    }

    // isToday / isYesterday
    @Test func todayAndYesterday() {
        let now = d(2026, 11, 10, 9)
        let yesterday = d(2026, 11, 9, 22)
        let twoDaysAgo = d(2026, 11, 8, 12)
        #expect(DateMath.isToday(d(2026, 11, 10, 23), now: now, calendar: cal))
        #expect(!DateMath.isToday(yesterday, now: now, calendar: cal))
        #expect(DateMath.isYesterday(yesterday, now: now, calendar: cal))
        #expect(!DateMath.isYesterday(now, now: now, calendar: cal))
        #expect(!DateMath.isYesterday(twoDaysAgo, now: now, calendar: cal))
        // Yesterday across a month boundary.
        #expect(DateMath.isYesterday(d(2026, 10, 31), now: d(2026, 11, 1, 0, 30), calendar: cal))
    }

    // Labels (getHumanReadableDate, formatMonthYear, getMonthName, getDateFormat year rule)
    @Test func dayLabel() {
        let now = d(2026, 11, 10)
        #expect(DateMath.dayLabel(d(2026, 11, 10, 7), now: now, calendar: cal) == "Today")
        #expect(DateMath.dayLabel(d(2026, 11, 9), now: now, calendar: cal) == "Yesterday")
        #expect(DateMath.dayLabel(d(2026, 11, 8), now: now, calendar: cal) == "November 8")
        #expect(DateMath.dayLabel(d(2025, 11, 8), now: now, calendar: cal) == "November 8, 2025")
    }

    @Test func monthLabels() {
        let now = d(2026, 11, 10)
        #expect(DateMath.monthLabel(d(2026, 3, 15), now: now, calendar: cal) == "March")
        #expect(DateMath.monthLabel(d(2024, 1, 1), now: now, calendar: cal) == "January 2024")
        #expect(DateMath.monthYearLabel(fixed, calendar: cal) == "March 2024")
        #expect(DateMath.monthYearLabel(d(2026, 11, 1), calendar: cal) == "November 2026")
    }

    @Test func shortDateOmitsYearOnlyThisYear() {
        let now = d(2026, 11, 10)
        #expect(DateMath.shortDate(d(2026, 11, 8), now: now, calendar: cal) == "Nov 08")
        #expect(DateMath.shortDate(d(2020, 6, 15), now: now, calendar: cal) == "Jun 15, 2020")
        #expect(DateMath.shortDate(d(2025, 11, 8), now: now, calendar: cal) == "Nov 08, 2025")
    }

    @Test func mediumDate() {
        #expect(DateMath.mediumDate(d(2026, 11, 3), calendar: cal) == "Nov 3, 2026")
    }

    @Test func formattingUsesTheCalendarTimeZone() {
        // 23:30 in Manila on Nov 3 is still Nov 3 there, even though it is Nov 3 15:30 UTC.
        #expect(DateMath.mediumDate(d(2026, 11, 3, 23, 30), calendar: cal) == "Nov 3, 2026")
        #expect(DateMath.mediumDate(d(2026, 11, 4, 0, 30), calendar: cal) == "Nov 4, 2026")
    }
}
