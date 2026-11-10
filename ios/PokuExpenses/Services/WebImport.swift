import Foundation
import SwiftData
import UIKit

/// The web app's "Export my data" file, version 1 (src/lib/export.utils.ts). Dates are ISO-8601 UTC.
nonisolated struct WebExportFile: Decodable, Sendable {
    struct Category: Decodable, Sendable {
        let id: String
        let name: String
        let createdAt: Date
        enum CodingKeys: String, CodingKey { case id, name, createdAt = "created_at" }
    }

    struct BudgetRecord: Decodable, Sendable {
        let id: String
        let amount: Double
        let createdAt: Date
        enum CodingKeys: String, CodingKey { case id, amount, createdAt = "created_at" }
    }

    struct ExpenseRecord: Decodable, Sendable {
        let id: String
        let title: String
        let amount: Double
        let transactionDate: Date
        let description: String?
        let categoryID: String?
        let recurrence: String?
        let recurrenceID: String?
        let warrantyID: String?
        let createdAt: Date
        let updatedAt: Date
        enum CodingKeys: String, CodingKey {
            case id, title, amount, description, recurrence
            case transactionDate = "transaction_date", categoryID = "category_id"
            case recurrenceID = "recurrence_id", warrantyID = "warranty_id"
            case createdAt = "created_at", updatedAt = "updated_at"
        }
    }

    struct WarrantyRecord: Decodable, Sendable {
        let id: String
        let title: String
        let expirationDate: Date?
        let imageBase64: String?
        let imageContentType: String?
        let imageURL: String?
        let createdAt: Date
        let updatedAt: Date
        enum CodingKeys: String, CodingKey {
            case id, title
            case expirationDate = "expiration_date", imageBase64 = "image_base64"
            case imageContentType = "image_content_type", imageURL = "image_url"
            case createdAt = "created_at", updatedAt = "updated_at"
        }
    }

    let format: String
    let version: Int
    let exportedAt: Date
    let categories: [Category]
    let budget: [BudgetRecord]
    let expenses: [ExpenseRecord]
    let warranties: [WarrantyRecord]

    enum CodingKeys: String, CodingKey {
        case format, version, categories, budget, expenses, warranties
        case exportedAt = "exported_at"
    }
}

nonisolated enum WebImportError: LocalizedError, Equatable {
    case tooLarge
    case notAnExport
    case unsupportedVersion(Int)

    var errorDescription: String? {
        switch self {
        case .tooLarge: "That file is too large to import."
        case .notAnExport: "That file is not a Poku Expenses export."
        case .unsupportedVersion: "This export is from a newer version of the web app."
        }
    }
}

nonisolated struct ImportSummary: Equatable, Sendable, Codable {
    var expensesAdded = 0, categoriesAdded = 0, budgetsAdded = 0, warrantiesAdded = 0, skipped = 0

    /// "412 expenses, 11 categories, 3 budgets, 4 warranties added. 0 skipped."
    var text: String {
        func count(_ n: Int, _ one: String, _ many: String) -> String { "\(n) \(n == 1 ? one : many)" }
        return [count(expensesAdded, "expense", "expenses"),
                count(categoriesAdded, "category", "categories"),
                count(budgetsAdded, "budget", "budgets"),
                count(warrantiesAdded, "warranty", "warranties")].joined(separator: ", ")
            + " added. \(skipped) skipped."
    }
}

nonisolated enum WebImport {
    static let format = "poku-expenses-export"
    static let version = 1
    static let maxBytes = 100 * 1024 * 1024

    private struct Header: Decodable {
        let format: String?
        let version: Int?
    }

    /// Checks size, JSON shape, `format` and `version`. Dates accept ISO-8601 with or without fractional seconds.
    static func decode(_ data: Data) throws -> WebExportFile {
        guard data.count <= maxBytes else { throw WebImportError.tooLarge }
        guard let header = try? JSONDecoder().decode(Header.self, from: data),
              header.format == format, let fileVersion = header.version, fileVersion >= 1 else {
            throw WebImportError.notAnExport
        }
        guard fileVersion == version else { throw WebImportError.unsupportedVersion(fileVersion) }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .custom { decoder in
            let container = try decoder.singleValueContainer()
            let text = try container.decode(String.self)
            if let date = try? Date.ISO8601FormatStyle(includingFractionalSeconds: true).parse(text) { return date }
            if let date = try? Date.ISO8601FormatStyle().parse(text) { return date }
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Not an ISO-8601 date: \(text)")
        }
        do {
            return try decoder.decode(WebExportFile.self, from: data)
        } catch {
            throw WebImportError.notAnExport
        }
    }
}

/// Adds what the store does not have yet. Importing the same file twice adds nothing the second time.
@MainActor struct WebImporter {
    let context: ModelContext
    /// Test seam: runs after every record is inserted, before the single save.
    var beforeSave: (() throws -> Void)?

    init(context: ModelContext) {
        self.context = context
    }

    /// All-or-nothing: one save at the end; on any throw, `context.rollback()` then rethrow.
    func run(_ file: WebExportFile) throws -> ImportSummary {
        do {
            let summary = try insert(file)
            try beforeSave?()
            try context.save()
            return summary
        } catch {
            context.rollback()
            throw error
        }
    }

    private func insert(_ file: WebExportFile) throws -> ImportSummary {
        var summary = ImportSummary()

        // Categories: same id → skip; same name → map the web id onto the existing one; otherwise add.
        let existingCategories = try context.fetch(FetchDescriptor<ExpenseCategory>())
        var categoryIDs = Set(existingCategories.map(\.id))
        var idByName: [String: String] = [:]
        for category in existingCategories where idByName[Self.nameKey(category.name)] == nil {
            idByName[Self.nameKey(category.name)] = category.id
        }
        var categoryMap: [String: String] = [:]
        for record in file.categories {
            if categoryIDs.contains(record.id) {
                summary.skipped += 1
            } else if let existingID = idByName[Self.nameKey(record.name)] {
                categoryMap[record.id] = existingID
                summary.skipped += 1
            } else {
                context.insert(ExpenseCategory(id: record.id, name: record.name, createdAt: record.createdAt))
                categoryIDs.insert(record.id)
                idByName[Self.nameKey(record.name)] = record.id
                summary.categoriesAdded += 1
            }
        }

        var budgetIDs = Set(try context.fetch(FetchDescriptor<Budget>()).map(\.id))
        for record in file.budget {
            guard budgetIDs.insert(record.id).inserted else { summary.skipped += 1; continue }
            context.insert(Budget(id: record.id, amount: record.amount, createdAt: record.createdAt))
            summary.budgetsAdded += 1
        }

        var warrantyIDs = Set(try context.fetch(FetchDescriptor<Warranty>()).map(\.id))
        for record in file.warranties {
            guard warrantyIDs.insert(record.id).inserted else { summary.skipped += 1; continue }
            let imageData = Self.receiptData(base64: record.imageBase64)
            context.insert(Warranty(id: record.id, title: record.title, expirationDate: record.expirationDate,
                                    imageData: imageData, imageURL: imageData == nil ? record.imageURL : nil,
                                    createdAt: record.createdAt, updatedAt: record.updatedAt))
            summary.warrantiesAdded += 1
        }

        var expenseIDs = Set(try context.fetch(FetchDescriptor<Expense>()).map(\.id))
        for record in file.expenses {
            guard expenseIDs.insert(record.id).inserted else { summary.skipped += 1; continue }
            context.insert(Expense(
                id: record.id,
                title: record.title,
                amount: record.amount,
                transactionDate: record.transactionDate,
                note: record.description,
                categoryID: record.categoryID.map { categoryMap[$0] ?? $0 },
                recurrence: record.recurrence.flatMap(ExpenseRecurrence.init(rawValue:)),
                recurrenceID: record.recurrenceID,
                warrantyID: record.warrantyID,
                createdAt: record.createdAt,
                updatedAt: record.updatedAt
            ))
            summary.expensesAdded += 1
        }
        return summary
    }

    private static func nameKey(_ name: String) -> String {
        name.trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
    }

    /// Base64 → image → JPEG through ReceiptImage. nil when the bytes are not an image.
    private static func receiptData(base64: String?) -> Data? {
        guard let base64, let bytes = Data(base64Encoded: base64), let image = UIImage(data: bytes) else { return nil }
        return ReceiptImage.prepare(image)
    }
}
