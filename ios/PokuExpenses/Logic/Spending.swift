import Foundation
import SwiftData

struct SpentBreakdown: Equatable, Sendable { let bills, nonBills, total: Double }

struct CategorySpending: Identifiable, Equatable, Sendable {
    let categoryID: String?
    let categoryName: String
    let total: Double
    let percentage: Double
    var id: String { Self.key(categoryID: categoryID) }

    /// The strip/filter key for a category id; nil ("no category") gets its own key.
    static func key(categoryID: String?) -> String { categoryID ?? "__uncategorized__" }
}

struct DayGroup: Identifiable {
    let day: Date
    let expenses: [Expense]
    let total: Double
    var id: Date { day }
}

@MainActor enum Spending {
    static let billsCategoryName = "Bills"

    /// A category is "bills" when its name is exactly "Bills". Refunds count (they subtract).
    static func breakdown(expenses: [Expense], categories: [ExpenseCategory]) -> SpentBreakdown {
        let names = namesByID(categories)
        var bills = 0.0, nonBills = 0.0
        for expense in expenses {
            if let id = expense.categoryID, names[id] == billsCategoryName {
                bills += expense.amount
            } else {
                nonBills += expense.amount
            }
        }
        return SpentBreakdown(bills: bills, nonBills: nonBills, total: bills + nonBills)
    }

    /// Positive amounts only; names "Unknown" (missing category) / "Uncategorized" (no id); sorted by total desc.
    static func byCategory(expenses: [Expense], categories: [ExpenseCategory]) -> [CategorySpending] {
        let names = namesByID(categories)
        var totals: [String?: Double] = [:]
        var grandTotal = 0.0
        for expense in expenses where expense.amount > 0 {
            grandTotal += expense.amount
            totals[expense.categoryID, default: 0] += expense.amount
        }
        return totals.map { categoryID, total in
            let name = categoryID.map { names[$0] ?? "Unknown" } ?? "Uncategorized"
            return CategorySpending(categoryID: categoryID, categoryName: name, total: total,
                                    percentage: grandTotal > 0 ? total / grandTotal * 100 : 0)
        }
        .sorted { $0.total != $1.total ? $0.total > $1.total : CategoryService.nameAscending($0.categoryName, $1.categoryName) }
    }

    /// Most-used first (count of expenses), ties by name A–Z.
    static func topCategories(expenses: [Expense], categories: [ExpenseCategory], limit: Int = 5) -> [ExpenseCategory] {
        var counts: [String: Int] = [:]
        for expense in expenses {
            if let id = expense.categoryID { counts[id, default: 0] += 1 }
        }
        let sorted = categories.sorted {
            let a = counts[$0.id, default: 0], b = counts[$1.id, default: 0]
            return a != b ? a > b : CategoryService.nameAscending($0.name, $1.name)
        }
        return Array(sorted.prefix(max(0, limit)))
    }

    /// Newest day first; inside a day newest transactionDate, then newest createdAt. total = sum of amounts.
    static func groupByDay(_ expenses: [Expense], calendar: Calendar = .current) -> [DayGroup] {
        let grouped = Dictionary(grouping: expenses) { calendar.startOfDay(for: $0.transactionDate) }
        return grouped.keys.sorted(by: >).map { day in
            let items = grouped[day, default: []].sorted {
                $0.transactionDate != $1.transactionDate ? $0.transactionDate > $1.transactionDate : $0.createdAt > $1.createdAt
            }
            return DayGroup(day: day, expenses: items, total: items.reduce(0) { $0 + $1.amount })
        }
    }

    /// Category id → name. A duplicated id keeps the first name.
    static func namesByID(_ categories: [ExpenseCategory]) -> [String: String] {
        Dictionary(categories.map { ($0.id, $0.name) }, uniquingKeysWith: { first, _ in first })
    }
}
