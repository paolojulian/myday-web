import SwiftUI

/// A 48pt bordered square with an SF Symbol. `label` is required for VoiceOver.
struct IconButton: View {
    let systemImage: String
    let label: String
    let role: ButtonRole?
    let action: () -> Void

    init(systemImage: String, label: String, role: ButtonRole? = nil, action: @escaping () -> Void) {
        self.systemImage = systemImage
        self.label = label
        self.role = role
        self.action = action
    }

    private var tint: Color { role == .destructive ? Theme.Colors.danger : Theme.Colors.text }

    var body: some View {
        Button(role: role, action: action) {
            Image(systemName: systemImage)
                .font(Theme.Fonts.bodyStrong)
                .foregroundStyle(tint)
                .frame(width: Theme.controlHeight, height: Theme.controlHeight)
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.control)
                    .strokeBorder(role == .destructive ? Theme.Colors.danger : Theme.Colors.borderStrong,
                                  lineWidth: Theme.hairline))
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityLabel(label)
    }
}

#Preview {
    HStack {
        IconButton(systemImage: "xmark", label: "Cancel") {}
        IconButton(systemImage: "trash", label: "Delete", role: .destructive) {}
    }
}
