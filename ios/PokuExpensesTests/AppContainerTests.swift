import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

@MainActor
struct AppContainerTests {
    @Test func inMemoryContainerOpensAndStores() throws {
        let (container, mode) = AppContainer.make(.inMemory)
        #expect(mode == .inMemory)
        let context = container.mainContext
        context.insert(ExpenseCategory(name: "Food"))
        try context.save()
        #expect(try context.fetchCount(FetchDescriptor<ExpenseCategory>()) == 1)
    }

    @Test func inMemoryContainersAreIsolated() throws {
        let a = TestStore()
        let b = TestStore()
        a.context.insert(Budget(amount: 100))
        try a.context.save()
        #expect(try b.fetch(Budget.self).isEmpty)
    }

    @Test func schemaHasTheFourModels() {
        let names = Set(AppContainer.schema.entities.map(\.name))
        #expect(names == ["Expense", "ExpenseCategory", "Budget", "Warranty"])
        #expect(AppContainer.cloudContainerID == "iCloud.day.poku.myday")
    }

    @Test func requestedModeIsInMemoryUnderXCTest() {
        // The test host process has XCTestConfigurationFilePath set.
        #expect(AppContainer.requestedMode() == .inMemory)
    }

    @Test func requestedModeFromEnvironmentAndArguments() {
        #expect(AppContainer.requestedMode(environment: ["XCTestConfigurationFilePath": "/x"], arguments: []) == .inMemory)
        #expect(AppContainer.requestedMode(environment: [:], arguments: ["App", "-uiTesting"]) == .inMemory)
        #expect(AppContainer.requestedMode(environment: [:], arguments: ["App"]) == .cloud)
    }

    @Test func syncStatusCoversAllOutcomes() {
        #expect(SyncStatus.current(mode: .cloud, hasICloudAccount: true) == .on)
        #expect(SyncStatus.current(mode: .cloud, hasICloudAccount: false) == .signedOut)
        #expect(SyncStatus.current(mode: .localOnly, hasICloudAccount: true) == .off)
        #expect(SyncStatus.current(mode: .inMemory, hasICloudAccount: false) == .off)
        #expect(SyncStatus.on.title == "On")
        #expect(SyncStatus.signedOut.title == "Off. Sign in to iCloud in the Settings app")
        #expect(SyncStatus.off.title == "Off. Stored on this iPhone only")
    }
}
