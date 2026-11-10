import Foundation
import Observation
import SwiftData

/// All field state and saving for the expense form, so the save rules are unit-tested without UI
/// (port of expense-add-form.tsx / expense-edit-form.tsx).
@Observable @MainActor final class ExpenseFormModel {
    enum Kind: Hashable { case expense, refund }
    enum ReceiptChange: Equatable { case none, replaced(Data), removed }

    static let titleMaxLength = 100

    var kind: Kind
    var categoryID: String?
    var amountText: String
    var title: String
    var note: String
    var date: Date
    var isRecurring: Bool
    var receiptChange: ReceiptChange
    var warrantyExpiration: Date?
    private(set) var amountError: String?
    private(set) var categoryError: String?
    private(set) var titleError: String?
    let isEditing: Bool
    let isRecurringInstance: Bool
    let existingWarranty: Warranty?

    @ObservationIgnored private let context: ModelContext
    @ObservationIgnored private let editing: Expense?
    /// The template's id when editing an instance.
    @ObservationIgnored private let initialRecurrenceID: String?
    @ObservationIgnored private let initialWarrantyID: String?

    init(adding defaultDate: Date, context: ModelContext) {
        self.context = context
        editing = nil
        kind = .expense
        categoryID = nil
        amountText = ""
        title = ""
        note = ""
        date = defaultDate
        isRecurring = false
        receiptChange = .none
        warrantyExpiration = nil
        isEditing = false
        isRecurringInstance = false
        existingWarranty = nil
        initialRecurrenceID = nil
        initialWarrantyID = nil
    }

    init(editing expense: Expense, context: ModelContext) {
        self.context = context
        editing = expense
        kind = expense.isRefund ? .refund : .expense
        categoryID = expense.categoryID
        amountText = Money.formatInput(Self.plainNumber(abs(expense.amount)))
        title = expense.title
        note = expense.note ?? ""
        date = expense.transactionDate
        let recurrenceID = expense.recurrenceID.flatMap { $0.isEmpty ? nil : $0 }
        isRecurring = expense.recurrence != nil || recurrenceID != nil
        isRecurringInstance = recurrenceID != nil
        initialRecurrenceID = recurrenceID
        receiptChange = .none
        isEditing = true
        initialWarrantyID = expense.warrantyID
        let warranty = expense.warrantyID.flatMap { try? WarrantyService(context: context).warranty(id: $0) }
        existingWarranty = warranty
        warrantyExpiration = warranty?.expirationDate
    }

    /// The existing receipt (not removed) or a newly picked one.
    var hasReceipt: Bool {
        switch receiptChange {
        case .replaced: true
        case .removed: false
        case .none: existingWarranty != nil
        }
    }

    /// Validates, then saves. Returns false (with errors set) when invalid.
    func save(now: Date = .now) throws -> Bool {
        guard validate(), let value = Money.parseInput(amountText) else { return false }

        let trimmedTitle = title.trimmingCharacters(in: .whitespacesAndNewlines)
        let storedTitle = trimmedTitle.isEmpty ? (try categoryName() ?? "") : trimmedTitle
        let trimmedNote = note.trimmingCharacters(in: .whitespacesAndNewlines)
        let fields = Recurrence.resolveFields(isRecurring: isRecurring, recurrenceID: initialRecurrenceID)
        // The warranty is saved before the expense so the link is never dangling.
        let warrantyID = try resolveWarranty(title: storedTitle, now: now)

        let draft = ExpenseDraft(
            title: storedTitle,
            amount: kind == .refund ? -abs(value) : abs(value),
            transactionDate: date,
            note: trimmedNote.isEmpty ? nil : trimmedNote,
            categoryID: categoryID,
            recurrence: fields.recurrence,
            recurrenceID: fields.recurrenceID,
            warrantyID: warrantyID
        )
        let service = ExpenseService(context: context)
        if let editing {
            try service.update(editing, with: draft, now: now)
        } else {
            try service.add(draft, now: now)
        }
        // Turning recurring off on an instance also stops its template.
        if isRecurringInstance, !isRecurring, let templateID = initialRecurrenceID {
            try RecurringService(context: context).cancelRecurrence(templateID: templateID, now: now)
        }
        return true
    }

    /// Removes the expense only; a linked warranty stays (web parity).
    func delete() throws {
        guard let editing else { return }
        try ExpenseService(context: context).delete(editing)
    }

    private func validate() -> Bool {
        categoryError = categoryID == nil ? "Category is required" : nil
        amountError = Money.expenseAmountError(amountText)
        titleError = title.count > Self.titleMaxLength
            ? "Title must not exceed \(Self.titleMaxLength) characters" : nil
        return categoryError == nil && amountError == nil && titleError == nil
    }

    private func categoryName() throws -> String? {
        guard let id = categoryID else { return nil }
        var descriptor = FetchDescriptor<ExpenseCategory>(predicate: #Predicate { $0.id == id })
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first?.name
    }

    /// New image → replace (delete old, add new); removed → delete and unlink; otherwise update in place.
    private func resolveWarranty(title: String, now: Date) throws -> String? {
        let service = WarrantyService(context: context)
        switch receiptChange {
        case .replaced(let data):
            if let existingWarranty { try service.delete(existingWarranty) }
            return try service.add(title: title, expirationDate: warrantyExpiration, imageData: data, now: now).id
        case .removed:
            if let existingWarranty { try service.delete(existingWarranty) }
            return nil
        case .none:
            guard let existingWarranty else { return initialWarrantyID }
            try service.update(existingWarranty, title: title, expirationDate: warrantyExpiration, now: now)
            return existingWarranty.id
        }
    }

    /// "1250" / "1250.5" — what a user would have typed, before `Money.formatInput`.
    nonisolated static func plainNumber(_ value: Double) -> String {
        if value == value.rounded() { return String(Int(value)) }
        return String(format: "%.2f", value)
            .replacingOccurrences(of: #"0+$"#, with: "", options: .regularExpression)
    }
}
