import Foundation
import SwiftData

@Model final class Warranty {
    var id: String = ""
    var uid: String = ""
    var title: String = ""
    var expirationDate: Date?
    /// JPEG; syncs as an iCloud asset.
    @Attribute(.externalStorage) var imageData: Data?
    /// Only set by the web import when no image bytes came with it.
    var imageURL: String?
    var createdAt: Date = Date.distantPast
    var updatedAt: Date = Date.distantPast

    init(
        id: String? = nil,
        uid: String? = nil,
        title: String,
        expirationDate: Date? = nil,
        imageData: Data? = nil,
        imageURL: String? = nil,
        createdAt: Date? = nil,
        updatedAt: Date? = nil,
        now: Date = .now
    ) {
        self.id = id ?? IDFactory.make(.warranty)
        self.uid = uid ?? IDFactory.uid()
        self.title = title
        self.expirationDate = expirationDate
        self.imageData = imageData
        self.imageURL = imageURL
        self.createdAt = createdAt ?? now
        self.updatedAt = updatedAt ?? now
    }
}
