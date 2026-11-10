import Foundation
import Observation
import SwiftData

/// All field state and saving for a warranty with no expense (mockup 13). It never creates,
/// links or edits an expense.
@Observable @MainActor final class WarrantyFormModel {
    static let titleMaxLength = 100

    var title: String
    var expirationDate: Date?
    var pickedImageData: Data?
    private(set) var titleError: String?
    private(set) var imageError: String?
    let isEditing: Bool
    let existing: Warranty?

    @ObservationIgnored private let context: ModelContext

    init(addingIn context: ModelContext) {
        self.context = context
        title = ""
        expirationDate = nil
        pickedImageData = nil
        isEditing = false
        existing = nil
    }

    init(editing warranty: Warranty, context: ModelContext) {
        self.context = context
        title = warranty.title
        expirationDate = warranty.expirationDate
        pickedImageData = nil
        isEditing = true
        existing = warranty
    }

    /// Picked, or the existing record has one (bytes or a remote URL from the web import).
    var hasImage: Bool {
        pickedImageData != nil || existing?.imageData != nil || existing?.imageURL != nil
    }

    /// Validates, then adds or updates through WarrantyService. Returns false (with errors set) when invalid.
    func save(now: Date = .now) throws -> Bool {
        guard validate() else { return false }
        let service = WarrantyService(context: context)
        if let existing {
            try service.update(existing, title: title, expirationDate: expirationDate,
                               imageData: pickedImageData, now: now)
        } else if let pickedImageData {
            try service.add(title: title, expirationDate: expirationDate, imageData: pickedImageData, now: now)
        }
        return true
    }

    private func validate() -> Bool {
        let trimmed = title.trimmingCharacters(in: .whitespacesAndNewlines)
        titleError = if trimmed.isEmpty {
            "Name is required"
        } else if trimmed.count > Self.titleMaxLength {
            "Name must not exceed \(Self.titleMaxLength) characters"
        } else {
            nil
        }
        imageError = hasImage ? nil : "Add a receipt photo"
        return titleError == nil && imageError == nil
    }
}
