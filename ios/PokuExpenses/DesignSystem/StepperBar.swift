import SwiftUI

/// ‹ label › in one bordered 48pt bar (day stepper on Home, month stepper on Expenses).
struct StepperBar: View {
    let label: String
    let canGoNext: Bool
    let onPrevious: () -> Void
    let onNext: () -> Void
    @State private var steps = 0

    init(label: String, canGoNext: Bool = true, onPrevious: @escaping () -> Void, onNext: @escaping () -> Void) {
        self.label = label
        self.canGoNext = canGoNext
        self.onPrevious = onPrevious
        self.onNext = onNext
    }

    var body: some View {
        HStack(spacing: 0) {
            arrow("chevron.left", label: "Previous", identifier: "stepper-previous", enabled: true) {
                steps -= 1
                onPrevious()
            }
            Rectangle().fill(Theme.Colors.border).frame(width: Theme.hairline)
            Text(label)
                .font(Theme.Fonts.small.weight(.medium))
                .foregroundStyle(Theme.Colors.text)
                .lineLimit(1)
                .padding(.horizontal, Theme.Spacing.gutter)
                .frame(minWidth: Theme.stepperLabelWidth)
                .accessibilityIdentifier("stepper-label")
            Rectangle().fill(Theme.Colors.border).frame(width: Theme.hairline)
            arrow("chevron.right", label: "Next", identifier: "stepper-next", enabled: canGoNext) {
                steps += 1
                onNext()
            }
        }
        .frame(height: Theme.controlHeight)
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.control)
            .strokeBorder(Theme.Colors.borderStrong, lineWidth: Theme.hairline))
        .sensoryFeedback(.selection, trigger: steps)
    }

    private func arrow(_ systemImage: String, label: String, identifier: String, enabled: Bool,
                       action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Image(systemName: systemImage)
                .font(Theme.Fonts.bodyStrong)
                .foregroundStyle(enabled ? Theme.Colors.text : Theme.Colors.border)
                .frame(width: Theme.controlHeight, height: Theme.controlHeight)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .disabled(!enabled)
        .accessibilityLabel(label)
        .accessibilityIdentifier(identifier)
    }
}

#Preview {
    VStack {
        StepperBar(label: "Today", canGoNext: false, onPrevious: {}, onNext: {})
        StepperBar(label: "November", onPrevious: {}, onNext: {})
    }
}
