import Foundation

nonisolated enum WarrantyTone: Sendable { case expired, soon, ok, none }

/// Port of getWarrantyExpiryStatus (src/lib/warranty.utils.ts).
nonisolated struct WarrantyExpiry: Equatable, Sendable {
    static let soonThresholdDays = 30

    let label: String
    let tone: WarrantyTone

    static func status(expirationDate: Date?, now: Date = .now, calendar: Calendar = .current) -> WarrantyExpiry {
        guard let expirationDate else { return WarrantyExpiry(label: "No expiry date", tone: .none) }

        let today = calendar.startOfDay(for: now)
        let expiry = calendar.startOfDay(for: expirationDate)
        let daysLeft = calendar.dateComponents([.day], from: today, to: expiry).day ?? 0

        if daysLeft < 0 { return WarrantyExpiry(label: "Expired", tone: .expired) }
        if daysLeft == 0 { return WarrantyExpiry(label: "Expires today", tone: .soon) }
        if daysLeft <= soonThresholdDays {
            return WarrantyExpiry(label: "Expires in \(daysLeft) day\(daysLeft == 1 ? "" : "s")", tone: .soon)
        }
        return WarrantyExpiry(label: "Expires \(DateMath.mediumDate(expiry, calendar: calendar))", tone: .ok)
    }
}
