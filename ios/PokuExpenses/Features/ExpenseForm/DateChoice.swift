import SwiftUI

/// Today · Yesterday · Custom, three cells on the shared grid (port of the web's 3-way date picker).
struct DateChoice: View {
    enum Option: Equatable { case today, yesterday, custom }

    /// What the three cells read, and which one is selected.
    struct Cells: Equatable {
        let todaySubtitle, yesterdaySubtitle, customTitle, customSubtitle: String
        let selected: Option

        init(date: Date, now: Date = .now, calendar: Calendar = .current) {
            todaySubtitle = DateChoice.monthDay(now, calendar: calendar)
            yesterdaySubtitle = DateChoice.monthDay(DateMath.addingDays(-1, to: now, calendar: calendar), calendar: calendar)
            if DateMath.isToday(date, now: now, calendar: calendar) {
                selected = .today
            } else if DateMath.isYesterday(date, now: now, calendar: calendar) {
                selected = .yesterday
            } else {
                selected = .custom
            }
            if selected == .custom {
                customTitle = DateChoice.monthDay(date, calendar: calendar)
                customSubtitle = "Custom"
            } else {
                customTitle = "Custom"
                customSubtitle = "Pick a date"
            }
        }
    }

    /// "Nov 3".
    static func monthDay(_ date: Date, calendar: Calendar = .current) -> String {
        let formatter = DateFormatter()
        formatter.locale = Locale(identifier: "en_US")
        formatter.calendar = calendar
        formatter.timeZone = calendar.timeZone
        formatter.dateFormat = "MMM d"
        return formatter.string(from: date)
    }

    /// `day`'s date with `time`'s time of day, so ordering within a day stays by entry time.
    static func day(_ day: Date, keepingTimeOf time: Date, calendar: Calendar = .current) -> Date {
        let clock = calendar.dateComponents([.hour, .minute, .second, .nanosecond], from: time)
        let start = calendar.startOfDay(for: day)
        return calendar.date(byAdding: clock, to: start) ?? start
    }

    @Binding var date: Date
    let onCustom: () -> Void

    var body: some View {
        let now = Date.now
        let cells = Cells(date: date, now: now)
        LazyVGrid(columns: Theme.Grid.threeColumns, spacing: Theme.Spacing.gutter) {
            ChoiceCell(title: "Today", subtitle: cells.todaySubtitle, isSelected: cells.selected == .today) {
                date = Self.day(now, keepingTimeOf: now)
            }
            .accessibilityIdentifier("date-today")
            ChoiceCell(title: "Yesterday", subtitle: cells.yesterdaySubtitle, isSelected: cells.selected == .yesterday) {
                date = Self.day(DateMath.addingDays(-1, to: now), keepingTimeOf: now)
            }
            .accessibilityIdentifier("date-yesterday")
            ChoiceCell(title: cells.customTitle, subtitle: cells.customSubtitle,
                       isSelected: cells.selected == .custom, action: onCustom)
                .accessibilityIdentifier("date-custom")
        }
    }
}

#Preview {
    @Previewable @State var date = DateMath.addingDays(-7, to: .now)
    DateChoice(date: $date, onCustom: {}).screenMargins()
}
