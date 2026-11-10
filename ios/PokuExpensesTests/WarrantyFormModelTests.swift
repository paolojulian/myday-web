import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

/// Requirement 9: WarrantyFormModel validation, add creates one warranty and no expense, edit updates in place.
@MainActor
struct WarrantyFormModelTests {
    let store = TestStore()
    let now = TestCalendar.date(2026, 11, 10, 9)
    let image = Data([0xFF, 0xD8, 0x01])
    let otherImage = Data([0xFF, 0xD8, 0x02])

    var context: ModelContext { store.context }

    func existing(imageData: Data? = nil, imageURL: String? = nil,
                  expiry: Date? = TestCalendar.date(2028, 3, 14)) throws -> Warranty {
        let warranty = Warranty(title: "Air conditioner", expirationDate: expiry, imageData: imageData,
                                imageURL: imageURL, now: TestCalendar.date(2026, 1, 1))
        context.insert(warranty)
        try context.save()
        return warranty
    }

    // MARK: initial state

    @Test func addingStartsEmpty() {
        let model = WarrantyFormModel(addingIn: context)
        #expect(model.title == "")
        #expect(model.expirationDate == nil)
        #expect(model.pickedImageData == nil)
        #expect(model.isEditing == false)
        #expect(model.existing == nil)
        #expect(model.hasImage == false)
        #expect(model.titleError == nil && model.imageError == nil)
    }

    @Test func editingStartsFromTheRecord() throws {
        let warranty = try existing(imageData: image)
        let model = WarrantyFormModel(editing: warranty, context: context)
        #expect(model.isEditing)
        #expect(model.existing === warranty)
        #expect(model.title == "Air conditioner")
        #expect(model.expirationDate == TestCalendar.date(2028, 3, 14))
        #expect(model.pickedImageData == nil)
        #expect(model.hasImage)
    }

    @Test func hasImageIsTrueForAPickedImageOrARemoteURL() throws {
        let adding = WarrantyFormModel(addingIn: context)
        adding.pickedImageData = image
        #expect(adding.hasImage)
        let remote = WarrantyFormModel(editing: try existing(imageURL: "https://example.com/r.jpg"), context: context)
        #expect(remote.hasImage)
    }

    // MARK: validation

    @Test func nameIsRequiredAfterTrimming() throws {
        let model = WarrantyFormModel(addingIn: context)
        model.title = "   "
        model.pickedImageData = image
        #expect(try model.save(now: now) == false)
        #expect(model.titleError == "Name is required")
        #expect(try store.fetch(Warranty.self).isEmpty)
    }

    @Test func nameMustNotExceed100Characters() throws {
        let model = WarrantyFormModel(addingIn: context)
        model.title = String(repeating: "a", count: 101)
        model.pickedImageData = image
        #expect(try model.save(now: now) == false)
        #expect(model.titleError == "Name must not exceed 100 characters")

        model.title = String(repeating: "a", count: 100)
        #expect(try model.save(now: now))
        #expect(model.titleError == nil)
    }

    @Test func aPhotoIsRequiredWhenAdding() throws {
        let model = WarrantyFormModel(addingIn: context)
        model.title = "Air conditioner"
        #expect(try model.save(now: now) == false)
        #expect(model.imageError == "Add a receipt photo")
        #expect(model.titleError == nil)
        #expect(try store.fetch(Warranty.self).isEmpty)
    }

    @Test func bothErrorsShowTogether() throws {
        let model = WarrantyFormModel(addingIn: context)
        #expect(try model.save(now: now) == false)
        #expect(model.titleError == "Name is required")
        #expect(model.imageError == "Add a receipt photo")
    }

    @Test func errorsClearOnAValidSave() throws {
        let model = WarrantyFormModel(addingIn: context)
        _ = try model.save(now: now)
        model.title = "Fan"
        model.pickedImageData = image
        #expect(try model.save(now: now))
        #expect(model.titleError == nil && model.imageError == nil)
    }

    // MARK: add

    @Test func addCreatesExactlyOneWarrantyAndNoExpense() throws {
        let model = WarrantyFormModel(addingIn: context)
        model.title = "  Air conditioner "
        model.pickedImageData = image
        model.expirationDate = TestCalendar.date(2028, 3, 14)
        #expect(try model.save(now: now))

        let warranties = try store.fetch(Warranty.self)
        #expect(warranties.count == 1)
        #expect(warranties[0].title == "Air conditioner")
        #expect(warranties[0].imageData == image)
        #expect(warranties[0].expirationDate == TestCalendar.date(2028, 3, 14))
        #expect(warranties[0].createdAt == now)
        #expect(try store.fetch(Expense.self).isEmpty)
    }

    @Test func addAllowsNoExpiryDate() throws {
        let model = WarrantyFormModel(addingIn: context)
        model.title = "Fan"
        model.pickedImageData = image
        #expect(try model.save(now: now))
        #expect(try store.fetch(Warranty.self)[0].expirationDate == nil)
    }

    // MARK: edit

    @Test func editUpdatesInPlaceAndKeepsTheImageWhenNoneWasPicked() throws {
        let warranty = try existing(imageData: image)
        let id = warranty.id
        let model = WarrantyFormModel(editing: warranty, context: context)
        model.title = "Aircon "
        model.expirationDate = TestCalendar.date(2029, 1, 1)
        #expect(try model.save(now: now))

        let all = try store.fetch(Warranty.self)
        #expect(all.count == 1)
        #expect(all[0].id == id)
        #expect(all[0].title == "Aircon")
        #expect(all[0].imageData == image)
        #expect(all[0].expirationDate == TestCalendar.date(2029, 1, 1))
        #expect(all[0].updatedAt == now)
    }

    @Test func editReplacesTheImageOnlyWhenANewOneWasPicked() throws {
        let warranty = try existing(imageURL: "https://example.com/r.jpg")
        let model = WarrantyFormModel(editing: warranty, context: context)
        model.pickedImageData = otherImage
        #expect(try model.save(now: now))
        #expect(warranty.imageData == otherImage)
        #expect(warranty.imageURL == nil)
        #expect(try store.fetch(Warranty.self).count == 1)
    }

    @Test func editWithOnlyARemoteURLNeedsNoNewPhoto() throws {
        let warranty = try existing(imageURL: "https://example.com/r.jpg")
        let model = WarrantyFormModel(editing: warranty, context: context)
        #expect(try model.save(now: now))
        #expect(model.imageError == nil)
        #expect(warranty.imageURL == "https://example.com/r.jpg")
    }

    @Test func editWithNoImageAtAllStillNeedsAPhoto() throws {
        let warranty = try existing()
        let model = WarrantyFormModel(editing: warranty, context: context)
        #expect(try model.save(now: now) == false)
        #expect(model.imageError == "Add a receipt photo")
    }

    @Test func editCanClearTheExpiryDate() throws {
        let warranty = try existing(imageData: image)
        let model = WarrantyFormModel(editing: warranty, context: context)
        model.expirationDate = nil
        #expect(try model.save(now: now))
        #expect(warranty.expirationDate == nil)
    }

    @Test func editNeverTouchesALinkedExpense() throws {
        let warranty = try existing(imageData: image)
        let expense = try ExpenseService(context: context).add(
            ExpenseDraft(title: "Aircon", amount: 30000, transactionDate: now, warrantyID: warranty.id), now: now)
        let model = WarrantyFormModel(editing: warranty, context: context)
        model.title = "Aircon 2"
        #expect(try model.save(now: TestCalendar.date(2026, 12, 1)))
        #expect(expense.title == "Aircon")
        #expect(expense.warrantyID == warranty.id)
        #expect(expense.updatedAt == now)
        #expect(try store.fetch(Expense.self).count == 1)
    }
}
