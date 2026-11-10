import Foundation

/// Port of src/lib/dates.utils.ts. Intervals are half-open (`start <= d < end`); note that
/// `DateInterval.contains` is end-inclusive, so compare against `start`/`end` directly.
/// Labels use the en_US locale and the passed calendar's time zone.
nonisolated enum DateMath {
    static func dayInterval(_ date: Date, calendar: Calendar = .current) -> DateInterval {
        calendar.dateInterval(of: .day, for: date) ?? DateInterval(start: date, duration: 0)
    }

    static func monthInterval(_ date: Date, calendar: Calendar = .current) -> DateInterval {
        calendar.dateInterval(of: .month, for: date) ?? DateInterval(start: date, duration: 0)
    }

    /// Day of the month (1...31).
    static func daysElapsedInMonth(_ date: Date, calendar: Calendar = .current) -> Int {
        calendar.component(.day, from: date)
    }

    static func totalDaysInMonth(_ date: Date, calendar: Calendar = .current) -> Int {
        calendar.range(of: .day, in: .month, for: date)?.count ?? 30
    }

    static func daysRemainingInMonth(_ date: Date, calendar: Calendar = .current) -> Int {
        totalDaysInMonth(date, calendar: calendar) - daysElapsedInMonth(date, calendar: calendar)
    }

    static func addingDays(_ n: Int, to date: Date, calendar: Calendar = .current) -> Date {
        calendar.date(byAdding: .day, value: n, to: date) ?? date
    }

    /// Clamps the day like dayjs (Jan 31 + 1 month = Feb 28/29).
    static func addingMonths(_ n: Int, to date: Date, calendar: Calendar = .current) -> Date {
        calendar.date(byAdding: .month, value: n, to: date) ?? date
    }

    static func isSameDay(_ a: Date, _ b: Date, calendar: Calendar = .current) -> Bool {
        calendar.isDate(a, inSameDayAs: b)
    }

    static func isToday(_ date: Date, now: Date = .now, calendar: Calendar = .current) -> Bool {
        isSameDay(date, now, calendar: calendar)
    }

    static func isYesterday(_ date: Date, now: Date = .now, calendar: Calendar = .current) -> Bool {
        isSameDay(date, addingDays(-1, to: now, calendar: calendar), calendar: calendar)
    }

    /// "Today" / "Yesterday" / "November 8" / "November 8, 2025" (year only when not this year).
    static func dayLabel(_ date: Date, now: Date = .now, calendar: Calendar = .current) -> String {
        if isToday(date, now: now, calendar: calendar) { return "Today" }
        if isYesterday(date, now: now, calendar: calendar) { return "Yesterday" }
        let format = isSameYear(date, now, calendar: calendar) ? "MMMM d" : "MMMM d, yyyy"
        return string(date, format: format, calendar: calendar)
    }

    /// "November" / "November 2025".
    static func monthLabel(_ date: Date, now: Date = .now, calendar: Calendar = .current) -> String {
        let format = isSameYear(date, now, calendar: calendar) ? "MMMM" : "MMMM yyyy"
        return string(date, format: format, calendar: calendar)
    }

    /// "November 2026" always.
    static func monthYearLabel(_ date: Date, calendar: Calendar = .current) -> String {
        string(date, format: "MMMM yyyy", calendar: calendar)
    }

    /// "Nov 08" / "Nov 08, 2025" (web getHumanReadableDate).
    static func shortDate(_ date: Date, now: Date = .now, calendar: Calendar = .current) -> String {
        let format = isSameYear(date, now, calendar: calendar) ? "MMM dd" : "MMM dd, yyyy"
        return string(date, format: format, calendar: calendar)
    }

    /// "Nov 3, 2026".
    static func mediumDate(_ date: Date, calendar: Calendar = .current) -> String {
        string(date, format: "MMM d, yyyy", calendar: calendar)
    }

    private static func isSameYear(_ a: Date, _ b: Date, calendar: Calendar) -> Bool {
        calendar.component(.year, from: a) == calendar.component(.year, from: b)
    }

    private static func string(_ date: Date, format: String, calendar: Calendar) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US")
        formatter.calendar = calendar
        formatter.timeZone = calendar.timeZone
        formatter.dateFormat = format
        return formatter.string(from: date)
    }
}
