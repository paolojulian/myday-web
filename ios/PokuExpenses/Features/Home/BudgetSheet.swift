import SwiftData
import SwiftUI

/// Set or update the monthly budget (mockup 9). Each save inserts a new Budget record.
struct BudgetSheet: View {
    let currentAmount: Double?
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var text: String
    @State private var error: String?
    @State private var saveError: String?
    @FocusState private var focused: Bool

    init(currentAmount: Double?) {
        self.currentAmount = currentAmount
        _text = State(initialValue: Self.initialText(for: currentAmount))
    }

    static func initialText(for amount: Double?) -> String {
        guard let amount else { return "" }
        let raw = amount == amount.rounded() ? String(Int(amount)) : String(amount)
        return Money.formatInput(raw)
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
            UnderlineField(label: "Monthly budget", text: $text, placeholder: "₱ 0", error: error,
                           large: true, keyboard: .decimalPad)
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
        .onChange(of: text) { _, newValue in
            let formatted = Money.formatInput(newValue)
            if formatted != newValue { text = formatted }
            error = nil
        }
        .onAppear { focused = true }
        .errorAlert($saveError)
    }

    private func save() {
        do {
            error = try Self.submit(text, context: context)
            if error == nil { dismiss() }
        } catch {
            saveError = error.localizedDescription
        }
    }
}

#Preview {
    Text("Home").sheet(isPresented: .constant(true)) {
        BudgetSheet(currentAmount: 30000)
    }
    .modelContainer(AppContainer.make(.inMemory).container)
}
