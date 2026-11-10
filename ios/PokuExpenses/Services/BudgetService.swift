import Foundation
import SwiftData

@MainActor struct BudgetService {
    let context: ModelContext

    /// Latest budget whose createdAt is before the END of `date`'s month (web getBudgetByMonth).
    func budget(forMonthOf date: Date, calendar: Calendar = .current) throws -> Budget? {
        let end = DateMath.monthInterval(date, calendar: calendar).end
        var descriptor = FetchDescriptor<Budget>(
            predicate: #Predicate { $0.createdAt < end },
            sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
        )
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first
    }

    /// Always inserts a new record (history is how past months keep their budget).
    @discardableResult func set(amount: Double, now: Date = .now) throws -> Budget {
        let budget = Budget(amount: amount, now: now)
        context.insert(budget)
        try context.save()
        return budget
    }
}
