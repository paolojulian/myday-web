import Foundation
import SwiftData

@MainActor struct BudgetService {
    let context: ModelContext

    /// Latest budget whose createdAt is before the END of `date`'s month (web getBudgetByMonth).
    func budget(forMonthOf date: Date, calendar: Calendar = .current) throws -> Budget? {
        let end = DateMath.monthInterval(date, calendar: calendar).end
        return try context.fetch(Self.latestDescriptor(before: end)).first
    }

    /// The single newest budget created before `end`; shared with the screens' `@Query`s.
    nonisolated static func latestDescriptor(before end: Date) -> FetchDescriptor<Budget> {
        var descriptor = FetchDescriptor<Budget>(
            predicate: #Predicate { $0.createdAt < end },
            sortBy: [SortDescriptor(\.createdAt, order: .reverse)]
        )
        descriptor.fetchLimit = 1
        return descriptor
    }

    /// Always inserts a new record (history is how past months keep their budget).
    @discardableResult func set(amount: Double, now: Date = .now) throws -> Budget {
        let budget = Budget(amount: amount, now: now)
        context.insert(budget)
        try context.save()
        return budget
    }
}
