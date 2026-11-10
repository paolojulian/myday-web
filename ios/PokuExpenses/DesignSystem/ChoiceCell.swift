import SwiftUI

/// One cell of the three-column grid (categories, dates). Selected = inverse fill.
struct ChoiceCell: View {
    let title: String
    let subtitle: String?
    let isSelected: Bool
    let action: () -> Void

    init(title: String, subtitle: String? = nil, isSelected: Bool, action: @escaping () -> Void) {
        self.title = title
        self.subtitle = subtitle
        self.isSelected = isSelected
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            VStack(spacing: 0) {
                Text(title).font(Theme.Fonts.small.weight(.medium))
                if let subtitle {
                    Text(subtitle).font(Theme.Fonts.label).opacity(0.75)
                }
            }
            .lineLimit(1)
            .foregroundStyle(isSelected ? Theme.Colors.onInverse : Theme.Colors.textMuted)
            .padding(.horizontal, Theme.Spacing.tight)
            .frame(maxWidth: .infinity, minHeight: Theme.controlHeight)
            .background(isSelected ? Theme.Colors.inverse : Color.clear,
                        in: RoundedRectangle(cornerRadius: Theme.Radius.control))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.control)
                .strokeBorder(isSelected ? Theme.Colors.inverse : Theme.Colors.border, lineWidth: Theme.hairline))
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
        .sensoryFeedback(.selection, trigger: isSelected)
    }
}

#Preview {
    LazyVGrid(columns: Theme.Grid.threeColumns, spacing: Theme.Spacing.gutter) {
        ChoiceCell(title: "Today", subtitle: "Nov 10", isSelected: true) {}
        ChoiceCell(title: "Yesterday", subtitle: "Nov 9", isSelected: false) {}
        ChoiceCell(title: "Custom", subtitle: "Pick a date", isSelected: false) {}
    }
    .screenMargins()
}
