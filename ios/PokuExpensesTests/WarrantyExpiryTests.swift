import Foundation
import Testing
@testable import PokuExpenses

/// Ported from src/lib/warranty.utils.test.ts.
struct WarrantyExpiryTests {
    let cal = TestCalendar.calendar
    let now = TestCalendar.date(2026, 6, 14)

    func status(_ date: Date?) -> WarrantyExpiry {
        WarrantyExpiry.status(expirationDate: date, now: now, calendar: cal)
    }

    @Test func noDate() {
        #expect(status(nil) == WarrantyExpiry(label: "No expiry date", tone: .none))
    }

    @Test func expiredForAPastDate() {
        #expect(status(TestCalendar.date(2026, 6, 1, 0)) == WarrantyExpiry(label: "Expired", tone: .expired))
        #expect(status(TestCalendar.date(2026, 6, 13, 23, 59)).tone == .expired)
    }

    @Test func expiresToday() {
        #expect(status(TestCalendar.date(2026, 6, 14, 0)) == WarrantyExpiry(label: "Expires today", tone: .soon))
    }

    @Test func daysLeftWithinThreshold() {
        #expect(status(TestCalendar.date(2026, 6, 20, 0)) == WarrantyExpiry(label: "Expires in 6 days", tone: .soon))
        #expect(status(TestCalendar.date(2026, 7, 14, 0)) == WarrantyExpiry(label: "Expires in 30 days", tone: .soon))
    }

    @Test func singularizesOneDay() {
        #expect(status(TestCalendar.date(2026, 6, 15, 0)).label == "Expires in 1 day")
    }

    @Test func farOffDateIsFormatted() {
        #expect(status(TestCalendar.date(2027, 1, 1, 0)) == WarrantyExpiry(label: "Expires Jan 1, 2027", tone: .ok))
        #expect(status(TestCalendar.date(2026, 7, 15, 0)).tone == .ok)
    }
}
