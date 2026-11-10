import SwiftData
import SwiftUI

/// Set or update the monthly budget (mockup 9). Each save inserts a new Budget record.
struct BudgetSheet: View {
    let currentAmount: Double?
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var text: String
    @State private var amountError: String?
    @State private var errorMessage: String?
    @FocusState private var focused: Bool

    init(currentAmount: Double?) {
        self.currentAmount = currentAmount
        _text = State(initialValue: currentAmount.map(Money.inputText) ?? "")
    }

    static func saveTitle(isEditing: Bool) -> String { isEditing ? "Update budget" : "Set budget" }

    /// Validates and saves. Returns the validation message, or nil when saved.
    @MainActor static func submit(_ text: String, context: ModelContext, now: Date = .now) throws -> String? {
        if let error = Money.budgetAmountError(text) { return error }
        guard let amount = Money.parseInput(text) else { return "Please enter a valid number" }
        try BudgetService(context: context).set(amount: amount, now: now)
        return nil
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(currentAmount == nil ? "Set monthly budget" : "Edit monthly budget")
                .font(Theme.Fonts.title)
                .foregroundStyle(Theme.Colors.text)
            Text("Your total budget for the month.")
                .font(Theme.Fonts.small)
                .foregroundStyle(Theme.Colors.textMuted)
                .padding(.top, Theme.Spacing.tight)
            UnderlineField(label: "Monthly budget", text: $text, placeholder: "₱ 0", error: amountError,
                           large: true, keyboard: .decimalPad, moneyInput: true)
                .focused($focused)
                .accessibilityIdentifier("budget-amount-field")
                .padding(.top, Theme.Spacing.field)
            HStack(spacing: Theme.Spacing.gutter) {
                IconButton(systemImage: "xmark", label: "Cancel") { dismiss() }
                PrimaryButton(Self.saveTitle(isEditing: currentAmount != nil), action: save)
                    .accessibilityIdentifier("budget-save-button")
            }
            .padding(.top, Theme.Spacing.field)
            Spacer(minLength: 0)
        }
        .padding(.vertical, Theme.Spacing.field)
        .screenMargins()
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Colors.surface)
        .presentationDetents([.medium])
        .presentationCornerRadius(Theme.Radius.sheet)
        .onChange(of: text) { amountError = nil }
        .onAppear { focused = true }
        .errorAlert($errorMessage)
    }

    private func save() {
        do {
            amountError = try Self.submit(text, context: context)
            if amountError == nil { dismiss() }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    Text("Home").sheet(isPresented: .constant(true)) {
        BudgetSheet(currentAmount: 30000)
    }
    .modelContainer(AppContainer.make(.inMemory).container)
}
