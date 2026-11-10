import Foundation
import SwiftData

@MainActor struct WarrantyService {
    let context: ModelContext

    @discardableResult
    func add(title: String, expirationDate: Date?, imageData: Data, now: Date = .now) throws -> Warranty {
        let warranty = Warranty(title: Self.trim(title), expirationDate: expirationDate, imageData: imageData, now: now)
        context.insert(warranty)
        try context.save()
        return warranty
    }

    /// imageData nil = keep the current image; non-nil = replace it.
    func update(_ warranty: Warranty, title: String, expirationDate: Date?, imageData: Data? = nil, now: Date = .now) throws {
        warranty.title = Self.trim(title)
        warranty.expirationDate = expirationDate
        if let imageData {
            warranty.imageData = imageData
            warranty.imageURL = nil
        }
        warranty.updatedAt = now
        try context.save()
    }

    /// Also clears `warrantyID` on every expense that points at it.
    func delete(_ warranty: Warranty) throws {
        let target: String? = warranty.id
        let linked = try context.fetch(FetchDescriptor<Expense>(predicate: #Predicate { $0.warrantyID == target }))
        for expense in linked { expense.warrantyID = nil }
        context.delete(warranty)
        try context.save()
    }

    func warranty(id: String) throws -> Warranty? {
        var descriptor = FetchDescriptor<Warranty>(predicate: #Predicate { $0.id == id })
        descriptor.fetchLimit = 1
        return try context.fetch(descriptor).first
    }

    /// Soonest expiry first, undated last.
    func all() throws -> [Warranty] {
        try context.fetch(FetchDescriptor<Warranty>()).sorted(by: Self.soonestExpiryFirst)
    }

    nonisolated static func soonestExpiryFirst(_ a: Warranty, _ b: Warranty) -> Bool {
        switch (a.expirationDate, b.expirationDate) {
        case let (x?, y?) where x != y: x < y
        case (_?, nil): true
        case (nil, _?): false
        default: a.createdAt < b.createdAt
        }
    }

    private static func trim(_ title: String) -> String {
        title.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
