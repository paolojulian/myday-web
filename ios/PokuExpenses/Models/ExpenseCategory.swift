import Foundation
import SwiftData

/// Named `ExpenseCategory` because `Category` clashes with an Objective-C runtime type.
@Model final class ExpenseCategory {
    var id: String = ""
    var uid: String = ""
    var name: String = ""
    var createdAt: Date = Date.distantPast

    init(id: String? = nil, uid: String? = nil, name: String, createdAt: Date? = nil, now: Date = .now) {
        self.id = id ?? IDFactory.make(.category)
        self.uid = uid ?? IDFactory.uid()
        self.name = name
        self.createdAt = createdAt ?? now
    }
}
