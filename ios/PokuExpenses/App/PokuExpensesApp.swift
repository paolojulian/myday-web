import Combine
import CoreData
import SwiftData
import SwiftUI

@main
struct PokuExpensesApp: App {
    private let container: ModelContainer
    private let storeMode: StoreMode

    init() {
        let made = AppContainer.make(AppContainer.requestedMode())
        container = made.container
        storeMode = made.mode
    }

    var body: some Scene {
        WindowGroup {
            MaintenanceHost {
                Text("Poku Expenses")
            }
        }
        .modelContainer(container)
        .environment(\.storeMode, storeMode)
    }
}

/// Runs `AppMaintenance` on launch, each time the scene becomes active, and 2 seconds
/// (debounced) after iCloud delivers changes.
private struct MaintenanceHost<Content: View>: View {
    @ViewBuilder let content: Content
    @Environment(\.modelContext) private var context
    @Environment(\.scenePhase) private var scenePhase
    @State private var debounce: Task<Void, Never>?
    @State private var errorMessage: String?

    private static var remoteChanges: AnyPublisher<Notification, Never> {
        NotificationCenter.default.publisher(for: .NSPersistentStoreRemoteChange)
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    var body: some View {
        content
            .task { runMaintenance() }
            .onChange(of: scenePhase) { _, phase in
                if phase == .active { runMaintenance() }
            }
            .onReceive(Self.remoteChanges) { _ in
                debounce?.cancel()
                debounce = Task {
                    try? await Task.sleep(for: .seconds(2))
                    guard !Task.isCancelled else { return }
                    runMaintenance()
                }
            }
            .alert("Something went wrong", isPresented: Binding(
                get: { errorMessage != nil },
                set: { if !$0 { errorMessage = nil } }
            )) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(errorMessage ?? "")
            }
    }

    private func runMaintenance() {
        do {
            try AppMaintenance(context: context).run()
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}
