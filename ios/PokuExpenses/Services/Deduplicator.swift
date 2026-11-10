import Foundation
import SwiftData

@MainActor struct Deduplicator {
    struct Result: Equatable {
        var categoriesMerged = 0
        var recurringRemoved = 0
        var identicalRemoved = 0
    }

    let context: ModelContext

    /// Idempotent. Safe to run on every device: the survivor is always the record with the
    /// earliest createdAt, ties broken by smallest uid, so all devices pick the same one.
    @discardableResult func run(calendar: Calendar = .current) throws -> Result {
        var result = Result()

        // 1. Same id in any model (an import ran on two devices).
        result.identicalRemoved += try removeLosers(Expense.self, groupedBy: { $0.id.isEmpty ? nil : $0.id })
        result.identicalRemoved += try removeLosers(ExpenseCategory.self, groupedBy: { $0.id.isEmpty ? nil : $0.id })
        result.identicalRemoved += try removeLosers(Budget.self, groupedBy: { $0.id.isEmpty ? nil : $0.id })
        result.identicalRemoved += try removeLosers(Warranty.self, groupedBy: { $0.id.isEmpty ? nil : $0.id })

        // 2. Categories with the same trimmed, case-insensitive name.
        result.categoriesMerged = try mergeCategoriesByName()

        // 3. Recurring copies: one per recurrenceID per calendar month.
        result.recurringRemoved = try removeLosers(Expense.self) { expense in
            guard let recurrenceID = expense.recurrenceID else { return nil }
            let month = calendar.dateComponents([.year, .month], from: expense.transactionDate)
            return "\(recurrenceID)|\(month.year ?? 0)-\(month.month ?? 0)"
        }

        if context.hasChanges { try context.save() }
        return result
    }

    private func mergeCategoriesByName() throws -> Int {
        let categories = try context.fetch(FetchDescriptor<ExpenseCategory>())
        var repoint: [String: String] = [:]     // loser id → survivor id
        var losers: [ExpenseCategory] = []
        for group in Dictionary(grouping: categories, by: { CategoryService.nameKey($0.name) }).values where group.count > 1 {
            let survivor = Self.survivor(of: group)
            for loser in group where loser !== survivor {
                if loser.id != survivor.id { repoint[loser.id] = survivor.id }
                losers.append(loser)
            }
        }
        guard !losers.isEmpty else { return 0 }
        if !repoint.isEmpty {
            for expense in try context.fetch(FetchDescriptor<Expense>()) {
                if let id = expense.categoryID, let target = repoint[id] { expense.categoryID = target }
            }
        }
        for loser in losers { context.delete(loser) }
        try context.save()
        return losers.count
    }

    /// Groups records by `key` (nil = never a duplicate), keeps each group's survivor and deletes the rest.
    private func removeLosers<T: PersistentModel & DedupRecord>(_ type: T.Type, groupedBy key: (T) -> String?) throws -> Int {
        let records = try context.fetch(FetchDescriptor<T>())
        var groups: [String: [T]] = [:]
        for record in records {
            if let k = key(record) { groups[k, default: []].append(record) }
        }
        var removed = 0
        for group in groups.values where group.count > 1 {
            let survivor = Self.survivor(of: group)
            for record in group where record !== survivor {
                context.delete(record)
                removed += 1
            }
        }
        if removed > 0 { try context.save() }
        return removed
    }

    /// Earliest createdAt, ties broken by smallest uid.
    static func survivor<T: DedupRecord>(of group: [T]) -> T {
        group.min { a, b in a.createdAt != b.createdAt ? a.createdAt < b.createdAt : a.uid < b.uid }!
    }
}

/// The fields every model shares that de-duplication relies on.
protocol DedupRecord: AnyObject {
    var uid: String { get }
    var createdAt: Date { get }
}

extension Expense: DedupRecord {}
extension ExpenseCategory: DedupRecord {}
extension Budget: DedupRecord {}
extension Warranty: DedupRecord {}
