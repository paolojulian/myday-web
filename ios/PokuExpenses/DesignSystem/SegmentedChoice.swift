import SwiftUI

/// Equal-width segments in a bordered 40pt bar; the selected one uses the inverse fill.
struct SegmentedChoice<T: Hashable>: View {
    let options: [(T, String)]
    @Binding var selection: T

    init(options: [(T, String)], selection: Binding<T>) {
        self.options = options
        self._selection = selection
    }

    var body: some View {
        HStack(spacing: 0) {
            ForEach(options, id: \.0) { value, title in
                let isOn = value == selection
                Button { selection = value } label: {
                    Text(title)
                        .font(Theme.Fonts.small.weight(.medium))
                        .foregroundStyle(isOn ? Theme.Colors.onInverse : Theme.Colors.textMuted)
                        .frame(maxWidth: .infinity, minHeight: Theme.segmentedHeight)
                        .background(isOn ? Theme.Colors.inverse : Color.clear)
                        .contentShape(Rectangle())
                }
                .buttonStyle(.plain)
                .accessibilityAddTraits(isOn ? .isSelected : [])
            }
        }
        .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.control))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.control)
            .strokeBorder(Theme.Colors.borderStrong, lineWidth: Theme.hairline))
        .sensoryFeedback(.selection, trigger: selection)
    }
}

#Preview {
    @Previewable @State var kind = 0
    SegmentedChoice(options: [(0, "Expense"), (1, "Refund")], selection: $kind).screenMargins()
}
