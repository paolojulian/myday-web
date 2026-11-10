import SwiftUI

/// Title and amount on one line, "date · category · note/refund/monthly" caption below, 1pt divider.
struct ExpenseRow: View {
    let expense: Expense
    let categoryName: String?
    let showDate: Bool

    init(expense: Expense, categoryName: String?, showDate: Bool) {
        self.expense = expense
        self.categoryName = categoryName
        self.showDate = showDate
    }

    /// "Nov 08 · Food · SM Hypermarket" — parts that are empty are skipped.
    static func caption(expense: Expense, categoryName: String?, showDate: Bool, now: Date = .now) -> String {
        var parts: [String] = []
        if showDate { parts.append(DateMath.shortDate(expense.transactionDate, now: now)) }
        parts.append(categoryName ?? "Uncategorized")
        if expense.isRefund { parts.append("Refund") }
        if expense.recurrence != nil || expense.recurrenceID != nil { parts.append("Monthly") }
        if let note = expense.note?.trimmingCharacters(in: .whitespacesAndNewlines), !note.isEmpty {
            parts.append(note)
        }
        return parts.joined(separator: " · ")
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            HStack(alignment: .firstTextBaseline, spacing: Theme.Spacing.block) {
                Text(expense.title)
                    .font(Theme.Fonts.bodyStrong)
                    .foregroundStyle(Theme.Colors.text)
                    .multilineTextAlignment(.leading)
                Spacer(minLength: 0)
                AmountText(expense.amount, signedAsExpense: true, font: Theme.Fonts.amount)
            }
            Text(Self.caption(expense: expense, categoryName: categoryName, showDate: showDate))
                .font(Theme.Fonts.caption)
                .foregroundStyle(Theme.Colors.textSubtle)
                .lineLimit(1)
        }
        .padding(.vertical, Theme.Spacing.row)
        .frame(maxWidth: .infinity, minHeight: Theme.controlHeight, alignment: .leading)
        .rowDivider()
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    VStack(spacing: 0) {
        ExpenseRow(expense: Expense(title: "Lunch with team", amount: 650, transactionDate: .now),
                   categoryName: "Food", showDate: false)
        ExpenseRow(expense: Expense(title: "Shoe return", amount: -500, transactionDate: .now),
                   categoryName: "Shopping", showDate: true)
    }
    .screenMargins()
}
