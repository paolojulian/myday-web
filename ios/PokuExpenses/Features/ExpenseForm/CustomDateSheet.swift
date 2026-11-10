import SwiftUI

/// Graphical calendar with a Today shortcut and a confirm button that names the date (mockup 6).
/// Future dates are allowed (web parity). Also used for warranty expiry dates.
struct CustomDateSheet: View {
    let onConfirm: (Date) -> Void
    @State private var date: Date
    @Environment(\.dismiss) private var dismiss

    init(date: Date, onConfirm: @escaping (Date) -> Void) {
        self.onConfirm = onConfirm
        _date = State(initialValue: date)
    }

    static func confirmTitle(_ date: Date, calendar: Calendar = .current) -> String {
        "Use \(DateMath.mediumDate(date, calendar: calendar))"
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            DatePicker("Date", selection: $date, displayedComponents: .date)
                .datePickerStyle(.graphical)
                .labelsHidden()
                .tint(Theme.Colors.text)
            HStack(spacing: Theme.Spacing.gutter) {
                OutlineButton("Today") { date = .now }
                PrimaryButton(Self.confirmTitle(date)) {
                    onConfirm(date)
                    dismiss()
                }
                .accessibilityIdentifier("custom-date-confirm")
            }
            .padding(.top, Theme.Spacing.field)
        }
        .padding(.vertical, Theme.Spacing.field)
        .screenMargins()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Colors.surface)
        .presentationDetents([.large])
        .presentationCornerRadius(Theme.Radius.sheet)
    }
}

#Preview {
    Text("Form").sheet(isPresented: .constant(true)) {
        CustomDateSheet(date: .now) { _ in }
    }
}
