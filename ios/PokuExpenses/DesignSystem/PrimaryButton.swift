import SwiftUI

/// The one accent-filled action on a screen or sheet. 48pt tall, fills the width it is given.
struct PrimaryButton: View {
    let title: String
    let action: () -> Void
    @Environment(\.isEnabled) private var isEnabled

    init(_ title: String, action: @escaping () -> Void) {
        self.title = title
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            Text(title)
                .font(Theme.Fonts.bodyStrong.bold())
                .foregroundStyle(Theme.Colors.onAccent)
                .frame(maxWidth: .infinity, minHeight: Theme.controlHeight)
                .background(Theme.Colors.accent.opacity(isEnabled ? 1 : 0.4),
                            in: RoundedRectangle(cornerRadius: Theme.Radius.control))
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    PrimaryButton("Add expense") {}.screenMargins()
}
