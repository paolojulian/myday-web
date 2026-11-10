import Foundation
import SwiftData

enum CategoryServiceError: LocalizedError, Equatable {
    case emptyName

    var errorDescription: String? {
        switch self {
        case .emptyName: "Category name is required"
        }
    }
}

@MainActor struct CategoryService {
    static let defaults = ["Food", "Groceries", "Shopping", "Bills", "Transportation",
                           "Entertainment", "Health", "Education", "Other"]

    let context: ModelContext

    /// Name A–Z, case-insensitive.
    func all() throws -> [ExpenseCategory] {
        try context.fetch(FetchDescriptor<ExpenseCategory>()).sorted {
            $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending
        }
    }

    /// Trims. Empty name throws. An existing name (case-insensitive) is returned instead of duplicated.
    @discardableResult func add(name: String, now: Date = .now) throws -> ExpenseCategory {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw CategoryServiceError.emptyName }
        let key = Self.nameKey(trimmed)
        if let existing = try context.fetch(FetchDescriptor<ExpenseCategory>()).first(where: { Self.nameKey($0.name) == key }) {
            return existing
        }
        let category = ExpenseCategory(name: trimmed, now: now)
        context.insert(category)
        try context.save()
        return category
    }

    /// Expenses keep their (now dangling) categoryID, web parity.
    func delete(_ category: ExpenseCategory) throws {
        context.delete(category)
        try context.save()
    }

    func seedDefaultsIfEmpty(now: Date = .now) throws {
        guard try context.fetchCount(FetchDescriptor<ExpenseCategory>()) == 0 else { return }
        for name in Self.defaults {
            context.insert(ExpenseCategory(name: name, now: now))
        }
        try context.save()
    }

    /// The identity used to compare category names: trimmed and case-folded.
    nonisolated static func nameKey(_ name: String) -> String {
        name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }
}
