import Foundation
import SwiftData

@Model final class Budget {
    var id: String = ""
    var uid: String = ""
    var amount: Double = 0
    var createdAt: Date = Date.distantPast

    init(id: String? = nil, uid: String? = nil, amount: Double, createdAt: Date? = nil, now: Date = .now) {
        self.id = id ?? IDFactory.make(.budget)
        self.uid = uid ?? IDFactory.uid()
        self.amount = amount
        self.createdAt = createdAt ?? now
    }
}
