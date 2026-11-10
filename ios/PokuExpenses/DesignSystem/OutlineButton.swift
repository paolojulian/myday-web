import SwiftUI

/// A bordered secondary action sized to its title. Destructive role uses the danger colour.
struct OutlineButton: View {
    let title: String
    let role: ButtonRole?
    let action: () -> Void
    @Environment(\.isEnabled) private var isEnabled

    init(_ title: String, role: ButtonRole? = nil, action: @escaping () -> Void) {
        self.title = title
        self.role = role
        self.action = action
    }

    private var tint: Color { role == .destructive ? Theme.Colors.danger : Theme.Colors.text }
    private var outline: Color { role == .destructive ? Theme.Colors.danger : Theme.Colors.borderStrong }

    var body: some View {
        Button(role: role, action: action) {
            Text(title)
                .font(Theme.Fonts.bodyStrong)
                .foregroundStyle(isEnabled ? tint : Theme.Colors.textSubtle)
                .padding(.horizontal, Theme.Spacing.block)
                .frame(minHeight: Theme.controlHeight)
                .overlay(RoundedRectangle(cornerRadius: Theme.Radius.control)
                    .strokeBorder(isEnabled ? outline : Theme.Colors.border, lineWidth: Theme.hairline))
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    VStack(alignment: .leading) {
        OutlineButton("Set budget") {}
        OutlineButton("Delete", role: .destructive) {}
        OutlineButton("Add") {}.disabled(true)
    }
}
