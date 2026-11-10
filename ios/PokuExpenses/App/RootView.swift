import SwiftUI

/// What the shared expense form sheet is showing.
enum FormTarget: Identifiable, Hashable {
    case add(defaultDate: Date)
    case edit(expenseID: String)

    var id: String {
        switch self {
        case .add(let date): "add-\(date.timeIntervalSinceReferenceDate)"
        case .edit(let expenseID): "edit-\(expenseID)"
        }
    }
}

extension EnvironmentValues {
    /// Home, Expenses and row taps all open the expense form through this one path.
    @Entry var presentExpenseForm: @MainActor (FormTarget) -> Void = { _ in }
}

/// Four tabs, each with its own NavigationStack; the expense form is one sheet owned here.
struct RootView: View {
    enum Tab: Hashable, CaseIterable {
        case home, expenses, warranties, settings

        var title: String {
            switch self {
            case .home: "Home"
            case .expenses: "Expenses"
            case .warranties: "Warranties"
            case .settings: "Settings"
            }
        }

        var systemImage: String {
            switch self {
            case .home: "house"
            case .expenses: "list.bullet.rectangle"
            case .warranties: "doc.text.image"
            case .settings: "gearshape"
            }
        }
    }

    @State private var tab: Tab = .home
    @State private var formTarget: FormTarget?

    var body: some View {
        TabView(selection: $tab) {
            ForEach(Tab.allCases, id: \.self) { tab in
                NavigationStack { screen(for: tab) }
                    .tabItem { Label(tab.title, systemImage: tab.systemImage) }
                    .tag(tab)
            }
        }
        .tint(Theme.Colors.text)
        .sensoryFeedback(.selection, trigger: tab)
        .environment(\.presentExpenseForm) { formTarget = $0 }
        .sheet(item: $formTarget) { target in
            ExpenseFormScreen(target: target)
        }
    }

    @ViewBuilder private func screen(for tab: Tab) -> some View {
        switch tab {
        case .home: HomeScreen()
        case .expenses: ExpensesScreen()
        case .warranties: WarrantiesScreen()
        case .settings: PlaceholderScreen(title: "Settings")
        }
    }
}

/// Stands in for screens built in later phases.
private struct PlaceholderScreen: View {
    let title: String

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title).themeLabel()
            EmptyLine("Coming soon.")
            Spacer(minLength: 0)
        }
        .screenMargins()
        .padding(.top, Theme.Spacing.block)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Colors.background)
        .toolbar(.hidden, for: .navigationBar)
    }
}

#Preview {
    RootView().modelContainer(AppContainer.make(.inMemory).container)
}
