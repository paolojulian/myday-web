import Foundation
import SwiftData
@testable import PokuExpenses

/// A fresh in-memory store per test. Keep the container alive for the test's duration.
@MainActor
struct TestStore {
    let container: ModelContainer
    var context: ModelContext { container.mainContext }

    init() {
        container = AppContainer.make(.inMemory).container
    }

    func fetch<T: PersistentModel>(_ type: T.Type) throws -> [T] {
        try context.fetch(FetchDescriptor<T>())
    }
}
