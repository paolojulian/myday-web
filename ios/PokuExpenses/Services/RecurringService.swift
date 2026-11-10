import Foundation
import SwiftData

@MainActor struct RecurringService {
    let context: ModelContext

    /// Port of populateCurrentPeriod: for each template (recurrence set, no recurrenceID) whose own date is
    /// outside the current month and which has no copy in the current month, add a copy dated the 1st.
    func populateCurrentPeriod(now: Date = .now, calendar: Calendar = .current) throws {
        let month = DateMath.monthInterval(now, calendar: calendar)
        let start = month.start, end = month.end
        let templates = try context.fetch(FetchDescriptor<Expense>(
            predicate: #Predicate { $0.recurrenceRaw != nil && $0.recurrenceID == nil }
        )).filter { $0.recurrence == .monthly }
        let copiesThisMonth = try context.fetch(FetchDescriptor<Expense>(
            predicate: #Predicate { $0.recurrenceID != nil && $0.transactionDate >= start && $0.transactionDate < end }
        ))
        var covered = Set(copiesThisMonth.compactMap(\.recurrenceID))
        var inserted = false
        for template in templates where !template.id.isEmpty {
            let date = template.transactionDate
            if date >= start && date < end { continue }    // the template is this month's instance
            if covered.contains(template.id) { continue }
            context.insert(Expense(title: template.title, amount: template.amount, transactionDate: start,
                                   note: template.note, categoryID: template.categoryID,
                                   recurrence: nil, recurrenceID: template.id, now: now))
            covered.insert(template.id)
            inserted = true
        }
        if inserted { try context.save() }
    }

    /// Stops the series: clears the template's recurrence. The template and existing copies stay.
    func cancelRecurrence(templateID: String, now: Date = .now) throws {
        let templates = try context.fetch(FetchDescriptor<Expense>(predicate: #Predicate { $0.id == templateID }))
        guard !templates.isEmpty else { return }
        for template in templates {
            template.recurrence = nil
            template.updatedAt = now
        }
        try context.save()
    }
}
