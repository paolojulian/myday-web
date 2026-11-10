import SwiftData
import SwiftUI

/// Home (mockup 1–3): this month's budget, the selected day, and whole-day windows before it.
struct HomeScreen: View {
    static let initialWindowDays = 30
    static let windowStep = 30

    /// `[start of selectedDay − windowDays, start of selectedDay)`. Whole days keep every day total exact.
    static func earlierInterval(selectedDay: Date, windowDays: Int, calendar: Calendar = .current) -> DateInterval {
        let end = calendar.startOfDay(for: selectedDay)
        return DateInterval(start: DateMath.addingDays(-windowDays, to: end, calendar: calendar), end: end)
    }

    @State private var selectedDay = Date.now
    @State private var windowDays = HomeScreen.initialWindowDays
    @State private var isEditingBudget = false
    @Environment(\.presentExpenseForm) private var presentExpenseForm
    @Query private var categories: [ExpenseCategory]

    private var categoryNames: [String: String] { Spending.namesByID(categories) }

    var body: some View {
        let now = Date.now
        let dayLabel = DateMath.dayLabel(selectedDay, now: now)
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Poku Expenses").themeLabel()
                    Spacer(minLength: 0)
                    Text(DateMath.monthYearLabel(now)).themeLabel()
                }
                HomeBudget(month: DateMath.monthInterval(now), now: now, categories: categories,
                           isEditingBudget: $isEditingBudget)
                    .padding(.top, Theme.Spacing.block)
                SelectedDayList(interval: DateMath.dayInterval(selectedDay), title: dayLabel, categoryNames: categoryNames)
                EarlierList(interval: Self.earlierInterval(selectedDay: selectedDay, windowDays: windowDays),
                            now: now, categoryNames: categoryNames) {
                    windowDays += Self.windowStep
                }
            }
            .screenMargins()
            .padding(.top, Theme.Spacing.block)
            .padding(.bottom, Theme.Spacing.field)
        }
        .background(Theme.Colors.background)
        .toolbar(.hidden, for: .navigationBar)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            ActionBar(addLabel: "Add expense", addIdentifier: "add-expense-button",
                      onAdd: { presentExpenseForm(.add(defaultDate: selectedDay)) }) {
                StepperBar(label: dayLabel, canGoNext: !DateMath.isToday(selectedDay, now: now),
                           onPrevious: { step(-1) }, onNext: { step(1) })
            }
        }
    }

    private func step(_ days: Int) {
        selectedDay = DateMath.addingDays(days, to: selectedDay)
        windowDays = Self.initialWindowDays
    }
}

/// This month's expenses + the budget in effect for it → `BudgetSummary`, and the budget sheet.
private struct HomeBudget: View {
    let now: Date
    let categories: [ExpenseCategory]
    @Binding var isEditingBudget: Bool
    @Query private var expenses: [Expense]
    @Query private var budgets: [Budget]

    init(month: DateInterval, now: Date, categories: [ExpenseCategory], isEditingBudget: Binding<Bool>) {
        self.now = now
        self.categories = categories
        _isEditingBudget = isEditingBudget
        let start = month.start, end = month.end
        _expenses = Query(filter: #Predicate<Expense> { $0.transactionDate >= start && $0.transactionDate < end })
        // Same rule as BudgetService.budget(forMonthOf:): latest created before the month ends.
        var latest = FetchDescriptor<Budget>(predicate: #Predicate { $0.createdAt < end },
                                             sortBy: [SortDescriptor(\.createdAt, order: .reverse)])
        latest.fetchLimit = 1
        _budgets = Query(latest)
    }

    var body: some View {
        let budget = budgets.first
        BudgetSummary(analysis: BudgetSummary.analysis(budget: budget, expenses: expenses,
                                                       categories: categories, now: now),
                      mode: .remaining, onEdit: { isEditingBudget = true })
            .sheet(isPresented: $isEditingBudget) {
                BudgetSheet(currentAmount: budget?.amount)
            }
    }
}

private func newestFirst() -> [SortDescriptor<Expense>] {
    [SortDescriptor(\.transactionDate, order: .reverse), SortDescriptor(\.createdAt, order: .reverse)]
}

/// The selected day's rule and rows.
private struct SelectedDayList: View {
    let title: String
    let categoryNames: [String: String]
    @Query private var expenses: [Expense]

    init(interval: DateInterval, title: String, categoryNames: [String: String]) {
        self.title = title
        self.categoryNames = categoryNames
        let start = interval.start, end = interval.end
        _expenses = Query(filter: #Predicate<Expense> { $0.transactionDate >= start && $0.transactionDate < end },
                          sort: newestFirst())
    }

    var body: some View {
        DaySection(title: title, expenses: expenses, categoryNames: categoryNames,
                   emptyText: "No expenses for this day.")
    }
}

/// Whole days before the selected one, newest first, plus "Show earlier" when older expenses exist.
private struct EarlierList: View {
    let now: Date
    let categoryNames: [String: String]
    let onShowEarlier: () -> Void
    @Query private var expenses: [Expense]
    @Query private var older: [Expense]

    init(interval: DateInterval, now: Date, categoryNames: [String: String], onShowEarlier: @escaping () -> Void) {
        self.now = now
        self.categoryNames = categoryNames
        self.onShowEarlier = onShowEarlier
        let start = interval.start, end = interval.end
        _expenses = Query(filter: #Predicate<Expense> { $0.transactionDate >= start && $0.transactionDate < end },
                          sort: newestFirst())
        var before = FetchDescriptor<Expense>(predicate: #Predicate { $0.transactionDate < start })
        before.fetchLimit = 1
        _older = Query(before)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            if expenses.isEmpty {
                SectionRule("Earlier").padding(.top, Theme.Spacing.section)
                EmptyLine("No recent expenses.")
            } else {
                ForEach(Spending.groupByDay(expenses)) { group in
                    DaySection(title: DateMath.dayLabel(group.day, now: now), expenses: group.expenses,
                               categoryNames: categoryNames)
                }
            }
            if !older.isEmpty {
                OutlineButton("Show earlier", action: onShowEarlier)
                    .accessibilityIdentifier("show-earlier-button")
                    .padding(.top, Theme.Spacing.field)
            }
        }
    }
}

#Preview("Empty") {
    NavigationStack { HomeScreen() }
        .modelContainer(AppContainer.make(.inMemory).container)
}

#Preview("With data") {
    let container = AppContainer.make(.inMemory).container
    let context = container.mainContext
    let food = ExpenseCategory(name: "Food")
    context.insert(food)
    context.insert(Budget(amount: 30000))
    context.insert(Expense(title: "Lunch with team", amount: 650, transactionDate: .now, categoryID: food.id))
    context.insert(Expense(title: "Shoe return", amount: -500, transactionDate: DateMath.addingDays(-1, to: .now)))
    return NavigationStack { HomeScreen() }.modelContainer(container)
}
