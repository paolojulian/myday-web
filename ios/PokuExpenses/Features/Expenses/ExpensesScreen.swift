import SwiftData
import SwiftUI

/// One month (mockup 4): spent against budget, the category strip (tap to filter), every expense.
struct ExpensesScreen: View {
    /// `selectedID` is a `CategorySpending.id`, so "no category" can be filtered too.
    static func filtered(_ expenses: [Expense], selectedID: String?) -> [Expense] {
        guard let selectedID else { return expenses }
        return expenses.filter { CategorySpending.key(categoryID: $0.categoryID) == selectedID }
    }

    static func ruleTitle(categoryName: String?, count: Int) -> String {
        "\(categoryName ?? "All") · \(count) \(count == 1 ? "expense" : "expenses")"
    }

    @State private var month = Date.now
    @State private var selectedCategoryID: String?
    @State private var isEditingBudget = false
    @Environment(\.presentExpenseForm) private var presentExpenseForm

    var body: some View {
        let now = Date.now
        MonthExpenses(month: month, selectedCategoryID: $selectedCategoryID, isEditingBudget: $isEditingBudget)
            .background(Theme.Colors.background)
            .toolbar(.hidden, for: .navigationBar)
            .safeAreaInset(edge: .bottom, spacing: 0) {
                ActionBar(addLabel: "Add expense", addIdentifier: "add-expense-button",
                          onAdd: { presentExpenseForm(.add(defaultDate: now)) }) {
                    StepperBar(label: DateMath.monthLabel(month, now: now),
                               onPrevious: { step(-1) }, onNext: { step(1) })
                }
            }
    }

    private func step(_ months: Int) {
        month = DateMath.addingMonths(months, to: month)
        selectedCategoryID = nil
    }
}

/// Reads the month's expenses, categories and budget with `@Query`.
private struct MonthExpenses: View {
    let month: Date
    @Binding var selectedCategoryID: String?
    @Binding var isEditingBudget: Bool
    @Query private var expenses: [Expense]
    @Query private var categories: [ExpenseCategory]
    @Query private var budgets: [Budget]

    init(month: Date, selectedCategoryID: Binding<String?>, isEditingBudget: Binding<Bool>) {
        self.month = month
        _selectedCategoryID = selectedCategoryID
        _isEditingBudget = isEditingBudget
        let interval = DateMath.monthInterval(month)
        let start = interval.start, end = interval.end
        _expenses = Query(filter: #Predicate<Expense> { $0.transactionDate >= start && $0.transactionDate < end },
                          sort: [SortDescriptor(\.transactionDate, order: .reverse),
                                 SortDescriptor(\.createdAt, order: .reverse)])
        // Same rule as BudgetService.budget(forMonthOf:): latest created before the month ends.
        var latest = FetchDescriptor<Budget>(predicate: #Predicate { $0.createdAt < end },
                                             sortBy: [SortDescriptor(\.createdAt, order: .reverse)])
        latest.fetchLimit = 1
        _budgets = Query(latest)
    }

    var body: some View {
        let budget = budgets.first
        let spending = Spending.byCategory(expenses: expenses, categories: categories)
        let listed = ExpensesScreen.filtered(expenses, selectedID: selectedCategoryID)
        let selectedName = selectedCategoryID.flatMap { id in spending.first { $0.id == id }?.categoryName }
        let names = Spending.namesByID(categories)
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: 0) {
                    HStack(alignment: .firstTextBaseline) {
                        Text("Expenses").themeLabel()
                        Spacer(minLength: 0)
                        Text(DateMath.monthYearLabel(month)).themeLabel()
                    }
                    BudgetSummary(analysis: BudgetSummary.analysis(budget: budget, expenses: expenses,
                                                                   categories: categories, now: month),
                                  mode: .spent, onEdit: { isEditingBudget = true })
                        .padding(.top, Theme.Spacing.block)
                }
                .screenMargins()

                if !spending.isEmpty {
                    CategoryStrip(items: spending, selectedID: selectedCategoryID) { id in
                        selectedCategoryID = selectedCategoryID == id ? nil : id
                    }
                    .padding(.top, Theme.Spacing.block)
                }

                VStack(alignment: .leading, spacing: 0) {
                    SectionRule(ExpensesScreen.ruleTitle(categoryName: selectedName, count: listed.count),
                                trailing: Money.format(listed.reduce(0) { $0 + $1.amount }))
                        .accessibilityIdentifier("expenses-rule")
                    if listed.isEmpty {
                        EmptyLine("No expenses this month.")
                    } else {
                        LazyVStack(spacing: 0) {
                            ForEach(listed) { expense in
                                ExpenseListRow(expense: expense,
                                               categoryName: expense.categoryID.flatMap { names[$0] })
                            }
                        }
                        .padding(.top, Theme.Spacing.tight)
                    }
                }
                .padding(.top, Theme.Spacing.section)
                .screenMargins()
            }
            .padding(.top, Theme.Spacing.block)
            .padding(.bottom, Theme.Spacing.field)
        }
        .sheet(isPresented: $isEditingBudget) {
            BudgetSheet(currentAmount: budget?.amount)
        }
    }
}

/// A row with its date; tap opens the shared expense form.
private struct ExpenseListRow: View {
    let expense: Expense
    let categoryName: String?
    @Environment(\.presentExpenseForm) private var presentExpenseForm

    var body: some View {
        Button { presentExpenseForm(.edit(expenseID: expense.id)) } label: {
            ExpenseRow(expense: expense, categoryName: categoryName, showDate: true)
        }
        .buttonStyle(.plain)
        .accessibilityIdentifier("expense-row-\(expense.id)")
    }
}

#Preview {
    let container = AppContainer.make(.inMemory).container
    let context = container.mainContext
    let food = ExpenseCategory(name: "Food")
    let bills = ExpenseCategory(name: "Bills")
    context.insert(food)
    context.insert(bills)
    context.insert(Budget(amount: 30000))
    context.insert(Expense(title: "Lunch with team", amount: 650, transactionDate: .now, categoryID: food.id))
    context.insert(Expense(title: "Electricity", amount: 2310, transactionDate: .now, categoryID: bills.id))
    return NavigationStack { ExpensesScreen() }.modelContainer(container)
}
