import SwiftUI

/// Bottom bar: `leading` on the left margin, the accent + square on the right.
/// Attach with `.safeAreaInset(edge: .bottom)`.
struct ActionBar<Leading: View>: View {
    let addLabel: String
    let addIdentifier: String
    let onAdd: () -> Void
    let leading: Leading
    @State private var taps = 0

    init(addLabel: String, addIdentifier: String, onAdd: @escaping () -> Void,
         @ViewBuilder leading: () -> Leading) {
        self.addLabel = addLabel
        self.addIdentifier = addIdentifier
        self.onAdd = onAdd
        self.leading = leading()
    }

    var body: some View {
        HStack(spacing: Theme.Spacing.block) {
            leading
            Spacer(minLength: 0)
            Button {
                taps += 1
                onAdd()
            } label: {
                Image(systemName: "plus")
                    .font(Theme.Fonts.title)
                    .foregroundStyle(Theme.Colors.onAccent)
                    .frame(width: Theme.controlHeight, height: Theme.controlHeight)
                    .background(Theme.Colors.accent, in: RoundedRectangle(cornerRadius: Theme.Radius.control))
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel(addLabel)
            .accessibilityIdentifier(addIdentifier)
            .sensoryFeedback(.selection, trigger: taps)
        }
        .padding(.vertical, Theme.Spacing.row)
        .screenMargins()
        .background(Theme.Colors.background)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.Colors.borderSubtle).frame(height: Theme.hairline)
        }
    }
}

#Preview {
    VStack {
        Spacer()
        ActionBar(addLabel: "Add expense", addIdentifier: "add-expense-button", onAdd: {}) {
            StepperBar(label: "Today", canGoNext: false, onPrevious: {}, onNext: {})
        }
    }
}
