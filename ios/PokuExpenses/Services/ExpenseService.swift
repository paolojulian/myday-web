import Foundation
import SwiftData

struct ExpenseDraft: Equatable, Sendable {
    var title: String
    var amount: Double
    var transactionDate: Date
    var note: String?
    var categoryID: String?
    var recurrence: ExpenseRecurrence?
    var recurrenceID: String?
    var warrantyID: String?
}

@MainActor struct ExpenseService {
    let context: ModelContext

    @discardableResult func add(_ draft: ExpenseDraft, now: Date = .now) throws -> Expense {
        let expense = Expense(title: draft.title, amount: draft.amount, transactionDate: draft.transactionDate, now: now)
        apply(draft, to: expense)
        context.insert(expense)
        try context.save()
        return expense
    }

    func update(_ expense: Expense, with draft: ExpenseDraft, now: Date = .now) throws {
        apply(draft, to: expense)
        expense.updatedAt = now
        try context.save()
    }

    /// Leaves any linked warranty in place (web parity).
    func delete(_ expense: Expense) throws {
        context.delete(expense)
        try context.save()
    }

    /// Half-open interval; newest transactionDate first, then newest createdAt.
    func expenses(in interval: DateInterval) throws -> [Expense] {
        let start = interval.start, end = interval.end
        let descriptor = FetchDescriptor<Expense>(
            predicate: #Predicate { $0.transactionDate >= start && $0.transactionDate < end },
            sortBy: Self.newestFirst
        )
        return try context.fetch(descriptor)
    }

    /// Newest transactionDate first, then newest createdAt; shared with the screens' `@Query`s.
    nonisolated static var newestFirst: [SortDescriptor<Expense>] {
        [SortDescriptor(\.transactionDate, order: .reverse), SortDescriptor(\.createdAt, order: .reverse)]
    }

    func expense(id: String) throws -> Expense? {
        var descriptor = FetchDescriptor<Expense>(predicate: #Predicate { $0.id == id })
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first
    }

    private func apply(_ draft: ExpenseDraft, to expense: Expense) {
        expense.title = draft.title
        expense.amount = draft.amount
        expense.transactionDate = draft.transactionDate
        expense.note = draft.note
        expense.categoryID = draft.categoryID
        expense.recurrence = draft.recurrence
        expense.recurrenceID = draft.recurrenceID
        expense.warrantyID = draft.warrantyID
    }
}
