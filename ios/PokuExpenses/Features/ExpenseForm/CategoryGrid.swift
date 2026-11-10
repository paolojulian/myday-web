import SwiftUI

/// The five most-used categories and a sixth "Others" cell, three columns (mockup 5).
struct CategoryGrid: View {
    let top: [ExpenseCategory]
    let all: [ExpenseCategory]
    let selectedID: String?
    let onSelect: (String) -> Void
    let onOthers: () -> Void

    /// The sixth cell names the chosen category (and is selected) when it is not in the top five.
    static func othersCell(selectedID: String?, top: [ExpenseCategory], all: [ExpenseCategory])
        -> (title: String, isSelected: Bool) {
        guard let selectedID, !top.contains(where: { $0.id == selectedID }),
              let chosen = all.first(where: { $0.id == selectedID }) else {
            return ("Others", false)
        }
        return (chosen.name, true)
    }

    var body: some View {
        let others = Self.othersCell(selectedID: selectedID, top: top, all: all)
        LazyVGrid(columns: Theme.Grid.threeColumns, spacing: Theme.Spacing.gutter) {
            ForEach(top) { category in
                ChoiceCell(title: category.name, isSelected: category.id == selectedID) {
                    onSelect(category.id)
                }
                .accessibilityIdentifier("category-cell-\(category.name)")
            }
            ChoiceCell(title: others.title, isSelected: others.isSelected, action: onOthers)
                .accessibilityIdentifier("category-cell-others")
        }
    }
}

#Preview {
    let names = ["Food", "Groceries", "Transportation", "Bills", "Shopping"]
    let top = names.map { ExpenseCategory(name: $0) }
    CategoryGrid(top: top, all: top, selectedID: top[0].id, onSelect: { _ in }, onOthers: {})
        .screenMargins()
}
