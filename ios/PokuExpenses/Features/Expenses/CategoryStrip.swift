import SwiftUI

/// Horizontal strip of category totals on the shared three-column grid; the fourth cell peeks past
/// the right margin. Place it edge to edge (it applies the screen margins itself).
/// `onSelect` nil makes the cells plain (Categories screen).
struct CategoryStrip: View {
    struct Cell: Equatable {
        let amount: String
        /// 0...1 of the largest total.
        let barFraction: Double
        let percent: String

        init(_ item: CategorySpending, maxTotal: Double) {
            amount = Money.format(item.total)
            barFraction = maxTotal > 0 ? min(1, max(0, item.total / maxTotal)) : 0
            percent = "\(Int(item.percentage.rounded()))%"
        }
    }

    let items: [CategorySpending]
    let selectedID: String?
    let onSelect: ((String) -> Void)?

    init(items: [CategorySpending], selectedID: String? = nil, onSelect: ((String) -> Void)? = nil) {
        self.items = items
        self.selectedID = selectedID
        self.onSelect = onSelect
    }

    var body: some View {
        let maxTotal = items.map(\.total).max() ?? 0
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: Theme.Spacing.gutter) {
                ForEach(items) { item in
                    cell(item, figures: Cell(item, maxTotal: maxTotal), isSelected: item.id == selectedID)
                        .containerRelativeFrame(.horizontal, count: 3, spacing: Theme.Spacing.gutter)
                }
            }
        }
        .contentMargins(.horizontal, Theme.Spacing.margin, for: .scrollContent)
        .sensoryFeedback(.selection, trigger: selectedID)
    }

    @ViewBuilder private func cell(_ item: CategorySpending, figures: Cell, isSelected: Bool) -> some View {
        let content = CellContent(name: item.categoryName, figures: figures, isSelected: isSelected)
        if let onSelect {
            Button { onSelect(item.id) } label: { content }
                .buttonStyle(.plain)
                .accessibilityAddTraits(isSelected ? .isSelected : [])
                .accessibilityIdentifier("category-chip-\(item.categoryName)")
        } else {
            content
        }
    }
}

private struct CellContent: View {
    let name: String
    let figures: CategoryStrip.Cell
    let isSelected: Bool

    var body: some View {
        let ink = isSelected ? Theme.Colors.onInverse : Theme.Colors.text
        let quiet = isSelected ? Theme.Colors.onInverse.opacity(0.75) : Theme.Colors.textSubtle
        VStack(alignment: .leading, spacing: 0) {
            Text(name).font(Theme.Fonts.caption).foregroundStyle(quiet).lineLimit(1)
            Text(figures.amount)
                .font(Theme.Fonts.small.bold())
                .monospacedDigit()
                .foregroundStyle(ink)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .padding(.top, Theme.Spacing.tight)
            ProgressLine(progress: figures.barFraction, color: ink,
                         track: isSelected ? Theme.Colors.trackOnInverse : Theme.Colors.border)
                .padding(.top, Theme.Spacing.gutter)
            Text(figures.percent).font(Theme.Fonts.caption).monospacedDigit().foregroundStyle(quiet)
                .padding(.top, Theme.Spacing.tight)
        }
        .padding(Theme.Spacing.row)
        .frame(maxWidth: .infinity, minHeight: Theme.controlHeight, alignment: .leading)
        .background(isSelected ? Theme.Colors.inverse : Color.clear,
                    in: RoundedRectangle(cornerRadius: Theme.Radius.control))
        .overlay(RoundedRectangle(cornerRadius: Theme.Radius.control)
            .strokeBorder(isSelected ? Theme.Colors.inverse : Theme.Colors.border, lineWidth: Theme.hairline))
        .contentShape(Rectangle())
        .accessibilityElement(children: .combine)
    }
}

#Preview {
    CategoryStrip(items: [
        CategorySpending(categoryID: "a", categoryName: "Food", total: 4620, percentage: 40),
        CategorySpending(categoryID: "b", categoryName: "Groceries", total: 3465, percentage: 30),
        CategorySpending(categoryID: "c", categoryName: "Bills", total: 2310, percentage: 20),
        CategorySpending(categoryID: "d", categoryName: "Shopping", total: 1155, percentage: 10),
    ], selectedID: "a", onSelect: { _ in })
}
