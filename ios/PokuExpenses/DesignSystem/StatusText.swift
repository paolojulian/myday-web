import SwiftUI

/// A small square plus a word, both in the status colour. Colour never appears without the word.
struct StatusText: View {
    let text: String
    let color: Color

    init(_ text: String, color: Color) {
        self.text = text
        self.color = color
    }

    var body: some View {
        HStack(spacing: Theme.Spacing.gutter) {
            Rectangle().fill(color).frame(width: Theme.statusMark, height: Theme.statusMark)
                .accessibilityHidden(true)
            Text(text).font(Theme.Fonts.caption.weight(.medium)).foregroundStyle(color)
        }
    }
}

#Preview {
    VStack(alignment: .leading) {
        StatusText("On track", color: Theme.Colors.success)
        StatusText("Over pace", color: Theme.Colors.warning)
        StatusText("Almost spent", color: Theme.Colors.danger)
        StatusText("No expiry date", color: Theme.Colors.textSubtle)
    }
}
