import Foundation
import SwiftData

@MainActor struct AppMaintenance {
    let context: ModelContext

    /// seedDefaultsIfEmpty → Deduplicator.run → RecurringService.populateCurrentPeriod → Deduplicator.run
    func run(now: Date = .now) throws {
        try CategoryService(context: context).seedDefaultsIfEmpty(now: now)
        try Deduplicator(context: context).run()
        try RecurringService(context: context).populateCurrentPeriod(now: now)
        try Deduplicator(context: context).run()
    }
}
