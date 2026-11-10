import Foundation
import SwiftData

nonisolated enum ExpenseRecurrence: String, Sendable { case monthly }

/// CloudKit rules: every stored property optional or defaulted, no unique attributes, no relationships.
@Model final class Expense {
    var id: String = ""
    var uid: String = ""
    var title: String = ""
    /// Negative = refund.
    var amount: Double = 0
    var transactionDate: Date = Date.distantPast
    /// The web's `description`.
    var note: String?
    var categoryID: String?
    /// "monthly" on a recurring template only.
    var recurrenceRaw: String?
    /// The template's id, on generated copies.
    var recurrenceID: String?
    var warrantyID: String?
    var createdAt: Date = Date.distantPast
    var updatedAt: Date = Date.distantPast

    var recurrence: ExpenseRecurrence? {
        get { recurrenceRaw.flatMap(ExpenseRecurrence.init(rawValue:)) }
        set { recurrenceRaw = newValue?.rawValue }
    }

    var isRefund: Bool { amount < 0 }

    init(
        id: String? = nil,
        uid: String? = nil,
        title: String,
        amount: Double,
        transactionDate: Date,
        note: String? = nil,
        categoryID: String? = nil,
        recurrence: ExpenseRecurrence? = nil,
        recurrenceID: String? = nil,
        warrantyID: String? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil,
        now: Date = .now
    ) {
        self.id = id ?? IDFactory.make(.expense)
        self.uid = uid ?? IDFactory.uid()
        self.title = title
        self.amount = amount
        self.transactionDate = transactionDate
        self.note = note
        self.categoryID = categoryID
        self.recurrenceRaw = recurrence?.rawValue
        self.recurrenceID = recurrenceID
        self.warrantyID = warrantyID
        self.createdAt = createdAt ?? now
        self.updatedAt = updatedAt ?? now
    }
}
