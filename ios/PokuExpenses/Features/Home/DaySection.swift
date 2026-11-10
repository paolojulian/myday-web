import SwiftUI

/// One day: a section rule with the day total, then its expense rows (tap to edit) or an empty line.
struct DaySection: View {
    let title: String
    let expenses: [Expense]
    let categoryNames: [String: String]
    /// Shown when `expenses` is empty; nil hides the section's empty state.
    var emptyText: String? = nil
    /// Space above the rule: `section` normally, `block` when first under the header.
    var topSpacing: CGFloat = Theme.Spacing.section
    @Environment(\.presentExpenseForm) private var presentExpenseForm

    var total: Double { expenses.reduce(0) { $0 + $1.amount } }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            SectionRule(title, trailing: Money.format(total))
            if expenses.isEmpty, let emptyText {
                EmptyLine(emptyText)
            } else {
                VStack(spacing: 0) {
                    ForEach(expenses) { expense in
                        Button { presentExpenseForm(.edit(expenseID: expense.id)) } label: {
                            ExpenseRow(expense: expense,
                                       categoryName: expense.categoryID.flatMap { categoryNames[$0] },
                                       showDate: false)
                        }
                        .buttonStyle(.plain)
                        .accessibilityIdentifier("expense-row-\(expense.id)")
                    }
                }
                .padding(.top, Theme.Spacing.tight)
            }
        }
        .padding(.top, topSpacing)
    }
}

#Preview {
    DaySection(title: "Today",
               expenses: [Expense(title: "Lunch with team", amount: 650, transactionDate: .now, categoryID: "c"),
                          Expense(title: "Shoe return", amount: -500, transactionDate: .now)],
               categoryNames: ["c": "Food"])
        .screenMargins()
}
