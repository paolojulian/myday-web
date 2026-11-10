import Foundation

nonisolated enum Recurrence {
    /// Port of resolveRecurrenceFields. An instance (has a recurrenceID) is never promoted to a
    /// template; turning recurring off detaches the record either way.
    static func resolveFields(isRecurring: Bool, recurrenceID: String?)
        -> (recurrence: ExpenseRecurrence?, recurrenceID: String?) {
        guard isRecurring else { return (nil, nil) }
        if let recurrenceID, !recurrenceID.isEmpty { return (nil, recurrenceID) }
        return (.monthly, nil)
    }
}
