import SwiftUI

/// One quiet line where a list would be.
struct EmptyLine: View {
    let text: String

    init(_ text: String) { self.text = text }

    var body: some View {
        Text(text)
            .font(Theme.Fonts.small)
            .foregroundStyle(Theme.Colors.textSubtle)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, Theme.Spacing.field)
    }
}

#Preview {
    EmptyLine("No expenses for this day.").screenMargins()
}
