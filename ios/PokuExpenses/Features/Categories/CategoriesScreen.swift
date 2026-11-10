import SwiftData
import SwiftUI

/// Manage categories (mockup 11, pushed from Settings): this month's strip, every category,
/// swipe to delete, add at the bottom.
struct CategoriesScreen: View {
    static func canAdd(_ name: String) -> Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }

    static func sorted(_ categories: [ExpenseCategory]) -> [ExpenseCategory] {
        categories.sorted { $0.name.localizedCaseInsensitiveCompare($1.name) == .orderedAscending }
    }

    static func deleteTitle(_ name: String) -> String { "Delete “\(name)”?" }

    /// Trims; an existing name (any case) is reused, not duplicated.
    static func add(name: String, context: ModelContext) throws {
        try CategoryService(context: context).add(name: name)
    }

    @Query private var categories: [ExpenseCategory]
    @Query private var monthExpenses: [Expense]
    @Environment(\.modelContext) private var context
    @FocusState private var isNameFocused: Bool
    @State private var newName = ""
    @State private var pendingDelete: ExpenseCategory?
    @State private var errorMessage: String?

    init(now: Date = .now) {
        let interval = DateMath.monthInterval(now)
        let start = interval.start, end = interval.end
        _monthExpenses = Query(filter: #Predicate<Expense> { $0.transactionDate >= start && $0.transactionDate < end })
    }

    var body: some View {
        let rows = Self.sorted(categories)
        let spending = Spending.byCategory(expenses: monthExpenses, categories: categories)
        List {
            VStack(alignment: .leading, spacing: 0) {
                SectionRule("This month", trailing: Money.format(spending.reduce(0) { $0 + $1.total }))
                if spending.isEmpty {
                    EmptyLine("No expenses this month.")
                }
            }
            .padding(.top, Theme.Spacing.block)
            .plainListRow()

            if !spending.isEmpty {
                CategoryStrip(items: spending)
                    .padding(.top, Theme.Spacing.block)
                    .listRowInsets(EdgeInsets())
                    .listRowSeparator(.hidden)
                    .listRowBackground(Theme.Colors.background)
            }

            VStack(alignment: .leading, spacing: 0) {
                SectionRule("All categories", trailing: "\(rows.count)")
                if rows.isEmpty {
                    EmptyLine("No categories yet. Add one below.")
                }
            }
            .padding(.top, Theme.Spacing.section)
            .padding(.bottom, Theme.Spacing.tight)
            .plainListRow()

            ForEach(rows) { category in
                Text(category.name)
                    .font(Theme.Fonts.body)
                    .foregroundStyle(Theme.Colors.text)
                    .frame(maxWidth: .infinity, minHeight: Theme.controlHeight, alignment: .leading)
                    .padding(.vertical, Theme.Spacing.tight)
                    .rowDivider()
                    .plainListRow()
                    .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                        Button("Delete") { pendingDelete = category }
                            .tint(Theme.Colors.danger)
                    }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(Theme.Colors.background)
        .navigationTitle("Categories")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.visible, for: .navigationBar)
        .safeAreaInset(edge: .bottom, spacing: 0) { addBar }
        .confirmationDialog(Self.deleteTitle(pendingDelete?.name ?? ""),
                            isPresented: Binding(get: { pendingDelete != nil },
                                                 set: { if !$0 { pendingDelete = nil } }),
                            titleVisibility: .visible) {
            Button("Delete", role: .destructive, action: delete)
        }
        .errorAlert($errorMessage)
    }

    private var addBar: some View {
        HStack(alignment: .center, spacing: Theme.Spacing.gutter) {
            UnderlineField(label: "New category", text: $newName, placeholder: "New category name")
                .focused($isNameFocused)
                .submitLabel(.done)
                .onSubmit {
                    add()
                    isNameFocused = true
                }
                .accessibilityIdentifier("new-category-field")
            OutlineButton("Add", action: add)
                .disabled(!Self.canAdd(newName))
                .accessibilityIdentifier("new-category-add")
        }
        .padding(.vertical, Theme.Spacing.row)
        .screenMargins()
        .background(Theme.Colors.background)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.Colors.borderSubtle).frame(height: Theme.hairline)
        }
    }

    private func add() {
        guard Self.canAdd(newName) else { return }
        do {
            try Self.add(name: newName, context: context)
            newName = ""
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func delete() {
        guard let category = pendingDelete else { return }
        pendingDelete = nil
        do {
            try CategoryService(context: context).delete(category)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    let container = AppContainer.make(.inMemory).container
    let context = container.mainContext
    try? CategoryService(context: context).seedDefaultsIfEmpty()
    return NavigationStack { CategoriesScreen() }.modelContainer(container)
}
