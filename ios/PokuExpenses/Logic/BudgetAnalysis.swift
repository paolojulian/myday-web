import Foundation

nonisolated enum BudgetStatus: String, Sendable { case healthy, warning, danger }

/// Port of calculateBudgetAnalysis (src/lib/budget.utils.ts).
nonisolated struct BudgetAnalysis: Equatable, Sendable {
    let monthlyBudget, totalSpent, remainingBudget: Double
    let daysElapsed, daysRemaining, totalDays: Int
    let budgetedDailyRate, actualDailyRate, projectedTotalSpend: Double
    let projectedDaysLeft, remainingDailyBudget: Double
    let status: BudgetStatus
    /// Clamped 0...100.
    let percentageUsed: Double
    let isOverBudget, isOnTrack: Bool

    /// "On track" (healthy) · "Over pace" (warning) · "Over budget" (isOverBudget) · "Almost spent" (other danger).
    var statusLabel: String {
        if isOverBudget { return "Over budget" }
        switch status {
        case .healthy: return "On track"
        case .warning: return "Over pace"
        case .danger: return "Almost spent"
        }
    }

    static func calculate(monthlyBudget: Double, totalSpent: Double, billsSpent: Double = 0,
                          date: Date = .now, calendar: Calendar = .current) -> BudgetAnalysis {
        let daysElapsed = DateMath.daysElapsedInMonth(date, calendar: calendar)
        let daysRemaining = DateMath.daysRemainingInMonth(date, calendar: calendar)
        let totalDays = DateMath.totalDaysInMonth(date, calendar: calendar)

        // Spendable per day for the rest of the month, today included, with bills out of the budget.
        let daysLeftIncludingToday = daysRemaining + 1
        let nonBillsSpent = totalSpent - billsSpent
        let remainingDailyBudget = daysLeftIncludingToday <= 0
            ? 0
            : ((monthlyBudget - billsSpent) - nonBillsSpent) / Double(daysLeftIncludingToday)

        let budgetedDailyRate = monthlyBudget / Double(totalDays)
        // Bills are spread across the whole month; everything else over the days elapsed.
        let billsDailyRate = billsSpent / Double(totalDays)
        let nonBillsDailyRate = daysElapsed > 0 ? nonBillsSpent / Double(daysElapsed) : 0
        let actualDailyRate = billsDailyRate + nonBillsDailyRate

        let projectedTotalSpend = actualDailyRate * Double(totalDays)
        let remainingBudget = monthlyBudget - totalSpent
        let projectedDaysLeft = actualDailyRate > 0 ? remainingBudget / actualDailyRate : Double(daysRemaining)

        // A zero budget would divide to NaN/∞ on the web; treat any spend as fully used.
        let percentageUsed = monthlyBudget > 0
            ? totalSpent / monthlyBudget * 100
            : (totalSpent > 0 ? 100 : 0)
        let expectedPercentage = Double(daysElapsed) / Double(totalDays) * 100
        let isOverBudget = totalSpent > monthlyBudget
        let isOnTrack = !isOverBudget && percentageUsed <= expectedPercentage * 1.1

        let status: BudgetStatus
        if isOverBudget || percentageUsed > 90 {
            status = .danger
        } else if percentageUsed > expectedPercentage * 1.1 || percentageUsed > 75 {
            status = .warning
        } else {
            status = .healthy
        }

        return BudgetAnalysis(
            monthlyBudget: monthlyBudget,
            totalSpent: totalSpent,
            remainingBudget: remainingBudget,
            daysElapsed: daysElapsed,
            daysRemaining: daysRemaining,
            totalDays: totalDays,
            budgetedDailyRate: budgetedDailyRate,
            actualDailyRate: actualDailyRate,
            projectedTotalSpend: projectedTotalSpend,
            projectedDaysLeft: max(0, projectedDaysLeft),
            remainingDailyBudget: remainingDailyBudget,
            status: status,
            percentageUsed: min(100, max(0, percentageUsed)),
            isOverBudget: isOverBudget,
            isOnTrack: isOnTrack
        )
    }
}
