import SwiftData
import SwiftUI

/// Searchable list of every category, with `Create "<text>"` when nothing matches exactly (mockup 7).
struct CategoryPickerSheet: View {
    let categories: [ExpenseCategory]
    let selectedID: String?
    let onChoose: (ExpenseCategory) -> Void
    @Environment(\.modelContext) private var context
    @Environment(\.dismiss) private var dismiss
    @State private var query = ""
    @State private var errorMessage: String?
    @FocusState private var searchFocused: Bool

    /// Name contains the trimmed query (case-insensitive); A–Z.
    static func filtered(_ categories: [ExpenseCategory], query: String) -> [ExpenseCategory] {
        let needle = query.trimmingCharacters(in: .whitespacesAndNewlines)
        return categories
            .filter { needle.isEmpty || $0.name.localizedCaseInsensitiveContains(needle) }
            .sorted { CategoryService.nameAscending($0.name, $1.name) }
    }

    /// The name to offer creating, or nil when the query is blank or matches a category exactly.
    static func createName(_ categories: [ExpenseCategory], query: String) -> String? {
        let name = query.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !name.isEmpty else { return nil }
        let key = CategoryService.nameKey(name)
        return categories.contains { CategoryService.nameKey($0.name) == key } ? nil : name
    }

    var body: some View {
        let matches = Self.filtered(categories, query: query)
        let createName = Self.createName(categories, query: query)
        VStack(alignment: .leading, spacing: 0) {
            UnderlineField(label: "Search categories", text: $query, placeholder: "Search")
                .focused($searchFocused)
                .accessibilityIdentifier("category-search-field")
                .padding(.top, Theme.Spacing.field)
                .screenMargins()
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 0) {
                    ForEach(matches) { category in
                        row(category.name, isSelected: category.id == selectedID) { choose(category) }
                            .accessibilityIdentifier("category-option-\(category.name)")
                    }
                    if let createName {
                        row("Create “\(createName)”", trailing: "Create") { create(createName) }
                            .accessibilityIdentifier("category-create")
                    } else if matches.isEmpty {
                        EmptyLine("No options found")
                    }
                }
                .screenMargins()
            }
            .scrollDismissesKeyboard(.interactively)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(Theme.Colors.surface)
        .presentationDetents([.fraction(0.7)])
        .presentationCornerRadius(Theme.Radius.sheet)
        .onAppear { searchFocused = true }
        .errorAlert($errorMessage)
    }

    private func row(_ title: String, isSelected: Bool = false, trailing: String? = nil,
                     action: @escaping () -> Void) -> some View {
        Button(action: action) {
            HStack(spacing: Theme.Spacing.block) {
                Text(title)
                    .font(isSelected ? Theme.Fonts.bodyStrong : Theme.Fonts.body)
                    .foregroundStyle(Theme.Colors.text)
                Spacer(minLength: 0)
                if isSelected {
                    Image(systemName: "checkmark").font(Theme.Fonts.bodyStrong).foregroundStyle(Theme.Colors.text)
                }
                if let trailing {
                    Text(trailing).font(Theme.Fonts.bodyStrong).foregroundStyle(Theme.Colors.text).underline()
                }
            }
            .padding(.vertical, Theme.Spacing.row)
            .frame(maxWidth: .infinity, minHeight: Theme.controlHeight, alignment: .leading)
            .rowDivider()
            .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
        .accessibilityAddTraits(isSelected ? .isSelected : [])
    }

    private func choose(_ category: ExpenseCategory) {
        onChoose(category)
        dismiss()
    }

    private func create(_ name: String) {
        do {
            choose(try CategoryService(context: context).add(name: name))
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    Text("Form").sheet(isPresented: .constant(true)) {
        CategoryPickerSheet(categories: ["Food", "Pet supplies", "Bills"].map { ExpenseCategory(name: $0) },
                            selectedID: nil, onChoose: { _ in })
    }
    .modelContainer(AppContainer.make(.inMemory).container)
}
