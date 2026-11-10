import Foundation
import SwiftData
import SwiftUI

enum StoreMode: Sendable { case cloud, localOnly, inMemory }

@MainActor enum AppContainer {
    static let schema = Schema([Expense.self, ExpenseCategory.self, Budget.self, Warranty.self])
    static let cloudContainerID = "iCloud.day.poku.myday"
    static let storeName = "PokuExpenses"

    /// Tries the requested mode, then falls back cloud → localOnly → inMemory. Never crashes.
    static func make(_ requested: StoreMode) -> (container: ModelContainer, mode: StoreMode) {
        let order: [StoreMode] = switch requested {
        case .cloud: [.cloud, .localOnly, .inMemory]
        case .localOnly: [.localOnly, .inMemory]
        case .inMemory: [.inMemory]
        }
        for mode in order {
            if let container = try? ModelContainer(for: schema, configurations: configuration(for: mode)) {
                return (container, mode)
            }
        }
        // An in-memory store with a valid schema only fails on programmer error; retry without a
        // configuration as the last resort rather than crashing at launch.
        do {
            return (try ModelContainer(for: schema, configurations: ModelConfiguration(isStoredInMemoryOnly: true)), .inMemory)
        } catch {
            preconditionFailure("Unable to open even an in-memory store: \(error)")
        }
    }

    static func configuration(for mode: StoreMode) -> ModelConfiguration {
        switch mode {
        case .cloud:
            ModelConfiguration(storeName, schema: schema, cloudKitDatabase: .private(cloudContainerID))
        case .localOnly:
            ModelConfiguration(storeName, schema: schema, cloudKitDatabase: .none)
        case .inMemory:
            ModelConfiguration(schema: schema, isStoredInMemoryOnly: true, cloudKitDatabase: .none)
        }
    }

    /// .inMemory under XCTest (env XCTestConfigurationFilePath) or launch argument "-uiTesting"; else .cloud
    static func requestedMode(processInfo: ProcessInfo = .processInfo) -> StoreMode {
        requestedMode(environment: processInfo.environment, arguments: processInfo.arguments)
    }

    static func requestedMode(environment: [String: String], arguments: [String]) -> StoreMode {
        if environment["XCTestConfigurationFilePath"] != nil || arguments.contains("-uiTesting") {
            return .inMemory
        }
        return .cloud
    }
}

enum SyncStatus: Equatable, Sendable {
    case on, signedOut, off

    /// cloud + iCloud account → .on; cloud without one → .signedOut; anything else → .off
    static func current(mode: StoreMode, hasICloudAccount: Bool) -> SyncStatus {
        guard mode == .cloud else { return .off }
        return hasICloudAccount ? .on : .signedOut
    }

    var title: String {
        switch self {
        case .on: "On"
        case .signedOut: "Off. Sign in to iCloud in the Settings app"
        case .off: "Off. Stored on this iPhone only"
        }
    }
}

extension EnvironmentValues {
    @Entry var storeMode: StoreMode = .inMemory
}
