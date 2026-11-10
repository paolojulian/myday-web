import SwiftUI

/// The month's budget at a glance. `.remaining` on Home (with metrics), `.spent` on Expenses.
struct BudgetSummary: View {
    enum Mode { case remaining, spent }

    /// Display strings, kept out of the view so they are unit-tested.
    struct Figures: Equatable {
        let headline, caption, spent, dailyLeft, daysLeft, status: String
        let statusKind: BudgetStatus
        /// 0...1, fill of the progress bar.
        let progress: Double

        init(analysis: BudgetAnalysis, mode: Mode) {
            switch mode {
            case .remaining:
                headline = Money.format(analysis.remainingBudget)
                caption = "left of \(Money.format(analysis.monthlyBudget))"
            case .spent:
                headline = Money.format(analysis.totalSpent)
                caption = "spent of \(Money.format(analysis.monthlyBudget))"
            }
            spent = Money.format(analysis.totalSpent)
            dailyLeft = Money.format(max(0, analysis.remainingDailyBudget))
            daysLeft = "\(analysis.daysRemaining)"
            status = analysis.statusLabel
            statusKind = analysis.status
            progress = analysis.percentageUsed / 100
        }
    }

    static func color(for status: BudgetStatus) -> Color {
        switch status {
        case .healthy: Theme.Colors.success
        case .warning: Theme.Colors.warning
        case .danger: Theme.Colors.danger
        }
    }

    /// nil without a budget. Bills are split out by name, refunds subtract (web parity).
    static func analysis(budget: Budget?, expenses: [Expense], categories: [ExpenseCategory],
                         now: Date = .now, calendar: Calendar = .current) -> BudgetAnalysis? {
        guard let budget else { return nil }
        let spent = Spending.breakdown(expenses: expenses, categories: categories)
        return BudgetAnalysis.calculate(monthlyBudget: budget.amount, totalSpent: spent.total,
                                        billsSpent: spent.bills, date: now, calendar: calendar)
    }

    let analysis: BudgetAnalysis?
    let mode: Mode
    let onEdit: () -> Void

    var body: some View {
        if let analysis {
            withBudget(Figures(analysis: analysis, mode: mode))
        } else {
            withoutBudget
        }
    }

    private func withBudget(_ figures: Figures) -> some View {
        let statusColor = Self.color(for: figures.statusKind)
        return VStack(alignment: .leading, spacing: 0) {
            Button(action: onEdit) {
                Text(figures.headline)
                    .font(Theme.Fonts.display)
                    .monospacedDigit()
                    .foregroundStyle(Theme.Colors.text)
                    .frame(maxWidth: .infinity, minHeight: Theme.controlHeight, alignment: .leading)
                    .contentShape(Rectangle())
            }
            .buttonStyle(.plain)
            .accessibilityLabel("\(figures.headline) \(figures.caption)")
            .accessibilityHint("Edit monthly budget")
            .accessibilityIdentifier("budget-figure")

            HStack(alignment: .firstTextBaseline, spacing: Theme.Spacing.block) {
                Text(figures.caption).font(Theme.Fonts.small).foregroundStyle(Theme.Colors.textMuted)
                Spacer(minLength: 0)
                StatusText(figures.status, color: statusColor)
            }
            .padding(.top, Theme.Spacing.tight)

            ProgressLine(progress: figures.progress,
                         color: figures.statusKind == .healthy ? Theme.Colors.text : statusColor)
                .padding(.top, Theme.Spacing.block)

            if mode == .remaining {
                LazyVGrid(columns: Theme.Grid.threeColumns, alignment: .leading, spacing: Theme.Spacing.gutter) {
                    Metric(label: "Spent", value: figures.spent, color: Theme.Colors.text)
                    Metric(label: "Daily left", value: figures.dailyLeft,
                           color: figures.statusKind == .healthy ? Theme.Colors.text : statusColor)
                    Metric(label: "Days left", value: figures.daysLeft, color: Theme.Colors.text)
                }
                .padding(.top, Theme.Spacing.block)
            }
        }
    }

    private var withoutBudget: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("No budget set").font(Theme.Fonts.title).foregroundStyle(Theme.Colors.text)
            Text("Set a monthly limit to track your spending.")
                .font(Theme.Fonts.small).foregroundStyle(Theme.Colors.textMuted)
                .padding(.top, Theme.Spacing.tight)
            OutlineButton("Set budget", action: onEdit)
                .accessibilityIdentifier("budget-set-button")
                .padding(.top, Theme.Spacing.block)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

/// A 2pt bar: border-coloured track, `color` fill.
struct ProgressLine: View {
    let progress: Double
    let color: Color
    var track: Color = Theme.Colors.border

    var body: some View {
        Rectangle().fill(track)
            .frame(height: Theme.barHeight)
            .overlay(alignment: .leading) {
                GeometryReader { proxy in
                    Rectangle().fill(color)
                        .frame(width: proxy.size.width * min(1, max(0, progress)))
                }
            }
            .accessibilityHidden(true)
    }
}

private struct Metric: View {
    let label: String
    let value: String
    let color: Color

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(label).themeLabel()
            Text(value)
                .font(Theme.Fonts.amount)
                .monospacedDigit()
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.7)
                .padding(.top, Theme.Spacing.tight)
        }
        .padding(.top, Theme.Spacing.gutter)
        .frame(maxWidth: .infinity, alignment: .leading)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.Colors.borderSubtle).frame(height: Theme.hairline)
        }
        .accessibilityElement(children: .combine)
    }
}

#Preview("Budget set") {
    BudgetSummary(analysis: .calculate(monthlyBudget: 30000, totalSpent: 11550), mode: .remaining, onEdit: {})
        .screenMargins()
}

#Preview("Almost spent") {
    BudgetSummary(analysis: .calculate(monthlyBudget: 30000, totalSpent: 27820), mode: .remaining, onEdit: {})
        .screenMargins()
        .preferredColorScheme(.dark)
}

#Preview("No budget") {
    BudgetSummary(analysis: nil, mode: .remaining, onEdit: {}).screenMargins()
}
