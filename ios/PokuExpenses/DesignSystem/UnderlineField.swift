import SwiftUI
import UIKit

/// Label, text field and a 1pt underline (danger when invalid), with the error line below.
/// The error line always takes its space so the layout does not jump.
/// `moneyInput` formats the text as you type ("1234" → "₱ 1,234") with `Money.formatInput`.
struct UnderlineField: View {
    let label: String
    @Binding var text: String
    let placeholder: String
    let error: String?
    let large: Bool
    let keyboard: UIKeyboardType
    let moneyInput: Bool

    init(label: String, text: Binding<String>, placeholder: String = "", error: String? = nil,
         large: Bool = false, keyboard: UIKeyboardType = .default, moneyInput: Bool = false) {
        self.label = label
        self._text = text
        self.placeholder = placeholder
        self.error = error
        self.large = large
        self.keyboard = keyboard
        self.moneyInput = moneyInput
    }

    /// The text to write back after an edit, or nil to leave it as typed.
    nonisolated static func reformatted(_ text: String, moneyInput: Bool) -> String? {
        guard moneyInput else { return nil }
        let formatted = Money.formatInput(text)
        return formatted == text ? nil : formatted
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(label).themeLabel().accessibilityHidden(true)
            TextField(placeholder, text: $text)
                .font(large ? Theme.Fonts.input : Theme.Fonts.body)
                .monospacedDigit()
                .foregroundStyle(Theme.Colors.text)
                .keyboardType(keyboard)
                .accessibilityLabel(label)
                .padding(.top, Theme.Spacing.gutter)
                .padding(.bottom, Theme.Spacing.gutter)
                .frame(minHeight: Theme.controlHeight)
                .rowDivider(error == nil ? Theme.Colors.borderStrong : Theme.Colors.danger)
                .onChange(of: text) { _, newValue in
                    if let formatted = Self.reformatted(newValue, moneyInput: moneyInput) { text = formatted }
                }
            Text(error ?? " ")
                .font(Theme.Fonts.caption)
                .foregroundStyle(Theme.Colors.danger)
                .padding(.top, Theme.Spacing.tight)
                .opacity(error == nil ? 0 : 1)
                .accessibilityHidden(error == nil)
        }
    }
}

#Preview {
    @Previewable @State var amount = "₱ 30,000"
    @Previewable @State var title = ""
    VStack(spacing: Theme.Spacing.field) {
        UnderlineField(label: "Monthly budget", text: $amount, large: true, keyboard: .decimalPad, moneyInput: true)
        UnderlineField(label: "Title · optional", text: $title, placeholder: "Lunch")
        UnderlineField(label: "Amount", text: $title, error: "Amount is required", large: true)
    }
    .screenMargins()
}
