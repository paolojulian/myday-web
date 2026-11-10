import SwiftUI

/// A peso amount with tabular digits. `signedAsExpense` renders refunds (negative) as "+₱500" in green.
struct AmountText: View {
    let amount: Double
    let signedAsExpense: Bool
    let font: Font

    init(_ amount: Double, signedAsExpense: Bool = false, font: Font = Theme.Fonts.bodyStrong) {
        self.amount = amount
        self.signedAsExpense = signedAsExpense
        self.font = font
    }

    var body: some View {
        Text(signedAsExpense ? Money.formatSigned(expenseAmount: amount) : Money.format(amount))
            .font(font)
            .monospacedDigit()
            .foregroundStyle(signedAsExpense && amount < 0 ? Theme.Colors.success : Theme.Colors.text)
    }
}

#Preview {
    VStack(alignment: .trailing) {
        AmountText(18450, font: Theme.Fonts.display)
        AmountText(650, signedAsExpense: true, font: Theme.Fonts.amount)
        AmountText(-500, signedAsExpense: true, font: Theme.Fonts.amount)
    }
}
