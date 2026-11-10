import Foundation
import Testing
@testable import PokuExpenses

/// Ported from src/lib/budget.utils.test.ts. Jan 15, 2024: 31-day month, 15 elapsed, 16 remaining.
struct BudgetAnalysisTests {
    let cal = TestCalendar.calendar
    let jan15 = TestCalendar.date(2024, 1, 15)

    func analyze(_ budget: Double, _ spent: Double, bills: Double = 0) -> BudgetAnalysis {
        BudgetAnalysis.calculate(monthlyBudget: budget, totalSpent: spent, billsSpent: bills, date: jan15, calendar: cal)
    }

    func close(_ a: Double, _ b: Double) -> Bool { abs(a - b) < 0.005 }

    // raw data fields
    @Test func passesThroughBudgetAndSpent() {
        let r = analyze(3000, 1000)
        #expect(r.monthlyBudget == 3000 && r.totalSpent == 1000)
    }

    @Test func remainingBudget() { #expect(analyze(3000, 1200).remainingBudget == 1800) }

    @Test func dayCounts() {
        let r = analyze(3000, 1000)
        #expect(r.totalDays == 31 && r.daysElapsed == 15 && r.daysRemaining == 16)
    }

    // calculated metrics
    @Test func budgetedDailyRate() { #expect(close(analyze(3100, 0).budgetedDailyRate, 100)) }

    @Test func actualDailyRateZeroWhenNothingSpent() { #expect(analyze(3000, 0).actualDailyRate == 0) }

    @Test func actualDailyRateSpreadsBillsOverTheMonth() {
        // nonBills 1500 / 15 = 100, bills 310 / 31 = 10
        #expect(close(analyze(4000, 1810, bills: 310).actualDailyRate, 110))
    }

    @Test func projectedTotalSpend() {
        let r = analyze(3100, 1550)
        #expect(close(r.projectedTotalSpend, r.actualDailyRate * 31))
    }

    @Test func remainingDailyBudgetCountsToday() {
        #expect(close(analyze(3100, 1500).remainingDailyBudget, 1600.0 / 17))
    }

    @Test func remainingDailyBudgetExcludesBills() {
        #expect(close(analyze(3100, 1500, bills: 400).remainingDailyBudget, 1600.0 / 17))
    }

    @Test func projectedDaysLeftClampsToZero() { #expect(analyze(1000, 1200).projectedDaysLeft == 0) }

    @Test func projectedDaysLeftIsDaysRemainingWhenNothingSpent() {
        #expect(analyze(1000, 0).projectedDaysLeft == 16)
    }

    // status indicators
    @Test func healthyWhenOnPace() {
        let r = analyze(3100, 1500)
        #expect(r.status == .healthy && r.isOnTrack)
    }

    @Test func dangerWhenOverBudget() {
        let r = analyze(1000, 1100)
        #expect(r.status == .danger && r.isOverBudget && !r.isOnTrack)
    }

    @Test func dangerAbove90Percent() { #expect(analyze(1000, 920).status == .danger) }

    @Test func warningAbove75Percent() { #expect(analyze(1000, 780).status == .warning) }

    @Test func notOverBudgetWhenUnder() { #expect(!analyze(1000, 500).isOverBudget) }

    @Test func percentageCappedAt100() { #expect(analyze(1000, 2000).percentageUsed == 100) }

    @Test func percentageClampedAtZeroForRefundHeavyMonths() {
        #expect(analyze(1000, -300).percentageUsed == 0)
    }

    @Test func zeroBudgetDoesNotProduceNaN() {
        #expect(analyze(0, 0).percentageUsed == 0)
        #expect(analyze(0, 50).percentageUsed == 100)
    }

    // statusLabel
    @Test func statusLabels() {
        #expect(analyze(3100, 1500).statusLabel == "On track")
        #expect(analyze(1000, 780).statusLabel == "Over pace")
        #expect(analyze(1000, 920).statusLabel == "Almost spent")
        #expect(analyze(1000, 1100).statusLabel == "Over budget")
    }
}
