import SwiftData
import SwiftUI

/// Add or edit one expense (mockup 5–8). Presented by RootView for every `FormTarget`.
struct ExpenseFormScreen: View {
    let target: FormTarget
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var model: ExpenseFormModel?
    /// Shown instead of the form when the expense is gone or could not be loaded.
    @State private var unavailableText: String?
    @State private var errorMessage: String?

    static func expiryText(_ date: Date?, calendar: Calendar = .current) -> String {
        date.map { "Expires \(DateMath.mediumDate($0, calendar: calendar))" } ?? "No expiry date"
    }

    /// The image the receipt field shows for a pending change.
    static func receiptImage(change: ExpenseFormModel.ReceiptChange, existing: Data?) -> Data? {
        switch change {
        case .none: existing
        case .replaced(let data): data
        case .removed: nil
        }
    }

    var body: some View {
        Group {
            if let model {
                ExpenseFormContent(model: model)
            } else if let unavailableText {
                VStack(alignment: .leading, spacing: 0) {
                    EmptyLine(unavailableText)
                    Spacer(minLength: 0)
                    IconButton(systemImage: "xmark", label: "Cancel") { dismiss() }
                        .accessibilityIdentifier("form-cancel-button")
                }
                .padding(.vertical, Theme.Spacing.field)
                .screenMargins()
                .frame(maxWidth: .infinity, alignment: .leading)
            } else {
                Color.clear
            }
        }
        .background(Theme.Colors.surface)
        .presentationCornerRadius(Theme.Radius.sheet)
        .errorAlert($errorMessage)
        .onAppear(perform: load)
    }

    private func load() {
        guard model == nil else { return }
        do {
            model = try Self.loadModel(for: target, context: context)
            if model == nil { unavailableText = "This expense no longer exists." }
        } catch {
            unavailableText = "This expense could not be loaded."
            errorMessage = error.localizedDescription
        }
    }

    /// nil only when the edited expense no longer exists; fetch failures throw.
    static func loadModel(for target: FormTarget, context: ModelContext) throws -> ExpenseFormModel? {
        switch target {
        case .add(let defaultDate):
            return ExpenseFormModel(adding: defaultDate, context: context)
        case .edit(let expenseID):
            return try ExpenseService(context: context).expense(id: expenseID)
                .map { try ExpenseFormModel(editing: $0, context: context) }
        }
    }
}

private struct ExpenseFormContent: View {
    enum Field: Hashable { case amount, title, note }
    enum Sheet: String, Identifiable {
        case category, date, expiry
        var id: String { rawValue }
    }

    @Bindable var model: ExpenseFormModel
    @Environment(\.dismiss) private var dismiss
    @Query private var categories: [ExpenseCategory]
    @Query private var expenses: [Expense]
    @FocusState private var focus: Field?
    @State private var sheet: Sheet?
    @State private var focusAmountAfterSheet = false
    @State private var isConfirmingDelete = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                Text(model.isEditing ? "Edit expense" : "Add expense")
                    .font(Theme.Fonts.title)
                    .foregroundStyle(Theme.Colors.text)
                SegmentedChoice(options: [(ExpenseFormModel.Kind.expense, "Expense"), (.refund, "Refund")],
                                selection: $model.kind)
                    .accessibilityIdentifier("form-kind")
                    .padding(.top, Theme.Spacing.block)
                category.padding(.top, Theme.Spacing.field)
                UnderlineField(label: "Amount", text: $model.amountText, placeholder: "₱ 0.00",
                               error: model.amountError, large: true, keyboard: .decimalPad,
                               moneyInput: true)
                    .focused($focus, equals: .amount)
                    .accessibilityIdentifier("amount-field")
                    .padding(.top, Theme.Spacing.field)
                UnderlineField(label: "Title · optional", text: $model.title, placeholder: "Lunch",
                               error: model.titleError)
                    .focused($focus, equals: .title)
                    .submitLabel(.next)
                    .onSubmit { focus = .note }
                    .accessibilityIdentifier("title-field")
                    .padding(.top, Theme.Spacing.field)
                note.padding(.top, Theme.Spacing.field)
                VStack(alignment: .leading, spacing: Theme.Spacing.gutter) {
                    Text("Date").themeLabel()
                    DateChoice(date: $model.date) { sheet = .date }
                }
                .padding(.top, Theme.Spacing.field)
                recurring.padding(.top, Theme.Spacing.block)
                receipt.padding(.top, Theme.Spacing.block)
            }
            .screenMargins()
            .padding(.vertical, Theme.Spacing.field)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Theme.Colors.surface)
        .safeAreaInset(edge: .bottom, spacing: 0) { footer }
        .onAppear { if !model.isEditing { focus = .amount } }
        .toolbar {
            // The decimal pad has no return key: Next moves on to the title (web parity), Done closes it.
            ToolbarItemGroup(placement: .keyboard) {
                Spacer()
                if focus == .amount {
                    Button("Next") { focus = .title }.accessibilityIdentifier("keyboard-next")
                } else {
                    Button("Done") { focus = nil }.accessibilityIdentifier("keyboard-done")
                }
            }
        }
        .sheet(item: $sheet, onDismiss: {
            if focusAmountAfterSheet {
                focusAmountAfterSheet = false
                focus = .amount
            }
        }) { sheet in
            switch sheet {
            case .category:
                CategoryPickerSheet(categories: categories, selectedID: model.categoryID) { chosen in
                    model.categoryID = chosen.id
                    focusAmountAfterSheet = true
                }
            case .date:
                CustomDateSheet(date: model.date) { picked in
                    model.date = DateChoice.day(picked, keepingTimeOf: .now)
                }
            case .expiry:
                CustomDateSheet(date: model.warrantyExpiration ?? .now) { model.warrantyExpiration = $0 }
            }
        }
        .confirmationDialog("Delete this expense?", isPresented: $isConfirmingDelete, titleVisibility: .visible) {
            Button("Delete", role: .destructive, action: delete)
        }
        .errorAlert($errorMessage)
    }

    private var category: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.gutter) {
            Text("Category").themeLabel()
            CategoryGrid(top: Spending.topCategories(expenses: expenses, categories: categories),
                         all: categories, selectedID: model.categoryID,
                         onSelect: { id in
                             model.categoryID = id
                             focus = .amount
                         },
                         onOthers: { sheet = .category })
            Text(model.categoryError ?? " ")
                .font(Theme.Fonts.caption)
                .foregroundStyle(Theme.Colors.danger)
                .opacity(model.categoryError == nil ? 0 : 1)
                .accessibilityHidden(model.categoryError == nil)
        }
    }

    private var note: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Note · optional").themeLabel().accessibilityHidden(true)
            TextField("Add a note", text: $model.note, axis: .vertical)
                .font(Theme.Fonts.body)
                .foregroundStyle(Theme.Colors.text)
                .lineLimit(1...4)
                .focused($focus, equals: .note)
                .accessibilityLabel("Note")
                .accessibilityIdentifier("note-field")
                .padding(.vertical, Theme.Spacing.gutter)
                .frame(minHeight: Theme.controlHeight)
                .rowDivider(Theme.Colors.borderStrong)
        }
    }

    private var recurring: some View {
        Toggle(isOn: $model.isRecurring) {
            VStack(alignment: .leading, spacing: Theme.Spacing.tight) {
                Text("Monthly recurring").font(Theme.Fonts.small.weight(.medium)).foregroundStyle(Theme.Colors.text)
                if model.isRecurringInstance {
                    Text("Part of a monthly series. Turn off to stop it.")
                        .font(Theme.Fonts.caption)
                        .foregroundStyle(Theme.Colors.textSubtle)
                }
            }
        }
        .tint(Theme.Colors.inverse)
        .frame(minHeight: Theme.controlHeight)
        .accessibilityIdentifier("recurring-toggle")
    }

    private var receipt: some View {
        let removed = model.receiptChange == .removed
        let replaced = if case .replaced = model.receiptChange { true } else { false }
        return ReceiptField(
            image: ExpenseFormScreen.receiptImage(change: model.receiptChange,
                                                  existing: model.existingWarranty?.imageData),
            remoteURL: removed || replaced ? nil : model.existingWarranty?.imageURL,
            expiryText: ExpenseFormScreen.expiryText(model.warrantyExpiration),
            title: model.hasReceipt ? "Warranty receipt" : "Warranty receipt · optional",
            allowsRemove: true,
            onPick: { model.receiptChange = .replaced($0) },
            onRemove: {
                model.receiptChange = model.existingWarranty == nil ? .none : .removed
                model.warrantyExpiration = nil
            },
            onChangeDate: { sheet = .expiry }
        )
    }

    private var footer: some View {
        HStack(spacing: Theme.Spacing.gutter) {
            IconButton(systemImage: "xmark", label: "Cancel") { dismiss() }
                .accessibilityIdentifier("form-cancel-button")
            if model.isEditing {
                IconButton(systemImage: "trash", label: "Delete", role: .destructive) { isConfirmingDelete = true }
                    .accessibilityIdentifier("form-delete-button")
            }
            PrimaryButton(model.isEditing ? "Update expense" : "Add expense", action: save)
                .accessibilityIdentifier("form-save-button")
        }
        .padding(.vertical, Theme.Spacing.row)
        .screenMargins()
        .background(Theme.Colors.surface)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.Colors.borderSubtle).frame(height: Theme.hairline)
        }
    }

    private func save() {
        do {
            if try model.save() { dismiss() }
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func delete() {
        do {
            try model.delete()
            dismiss()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview("Add") {
    let container = AppContainer.make(.inMemory).container
    try? CategoryService(context: container.mainContext).seedDefaultsIfEmpty()
    return Text("Home").sheet(isPresented: .constant(true)) {
        ExpenseFormScreen(target: .add(defaultDate: .now))
    }
    .modelContainer(container)
}
