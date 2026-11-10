import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

/// Requirement 9: every ExpenseFormModel save rule (port of expense-add-form / expense-edit-form).
@MainActor
struct ExpenseFormModelTests {
    let store = TestStore()
    let now = TestCalendar.date(2026, 11, 10, 9)
    let image = Data([0xFF, 0xD8, 0x01])
    let otherImage = Data([0xFF, 0xD8, 0x02])

    var context: ModelContext { store.context }

    func category(_ name: String = "Food") throws -> ExpenseCategory {
        try CategoryService(context: context).add(name: name, now: now)
    }

    func addingModel(categoryID: String?, amount: String = "₱ 650") -> ExpenseFormModel {
        let model = ExpenseFormModel(adding: now, context: context)
        model.categoryID = categoryID
        model.amountText = amount
        return model
    }

    func onlyExpense() throws -> Expense {
        let all = try store.fetch(Expense.self)
        try #require(all.count == 1)
        return all[0]
    }

    // MARK: initial state

    @Test func addingStartsEmptyOnTheDefaultDate() {
        let model = ExpenseFormModel(adding: now, context: context)
        #expect(model.kind == .expense)
        #expect(model.categoryID == nil)
        #expect(model.amountText == "")
        #expect(model.title == "")
        #expect(model.note == "")
        #expect(model.date == now)
        #expect(model.isRecurring == false)
        #expect(model.receiptChange == .none)
        #expect(model.warrantyExpiration == nil)
        #expect(model.isEditing == false)
        #expect(model.isRecurringInstance == false)
        #expect(model.existingWarranty == nil)
        #expect(model.hasReceipt == false)
    }

    @Test func editingANegativeAmountOpensAsRefundWithThePositiveNumber() throws {
        let food = try category()
        let expense = try ExpenseService(context: context).add(
            ExpenseDraft(title: "Shoe return", amount: -1250.5, transactionDate: now, note: "Box",
                         categoryID: food.id), now: now)
        let model = ExpenseFormModel(editing: expense, context: context)
        #expect(model.isEditing)
        #expect(model.kind == .refund)
        #expect(model.amountText == "₱ 1,250.5")
        #expect(model.title == "Shoe return")
        #expect(model.note == "Box")
        #expect(model.categoryID == food.id)
        #expect(model.date == now)
    }

    @Test func recurringStartsOnForATemplateAndForAnInstance() throws {
        let service = ExpenseService(context: context)
        let template = try service.add(ExpenseDraft(title: "Rent", amount: 100, transactionDate: now,
                                                    recurrence: .monthly), now: now)
        let instance = try service.add(ExpenseDraft(title: "Rent", amount: 100, transactionDate: now,
                                                    recurrenceID: template.id), now: now)
        let plain = try service.add(ExpenseDraft(title: "Lunch", amount: 100, transactionDate: now), now: now)

        let templateModel = ExpenseFormModel(editing: template, context: context)
        #expect(templateModel.isRecurring)
        #expect(templateModel.isRecurringInstance == false)
        let instanceModel = ExpenseFormModel(editing: instance, context: context)
        #expect(instanceModel.isRecurring)
        #expect(instanceModel.isRecurringInstance)
        #expect(ExpenseFormModel(editing: plain, context: context).isRecurring == false)
    }

    // MARK: validation

    @Test func categoryIsRequired() throws {
        let model = addingModel(categoryID: nil)
        #expect(try model.save(now: now) == false)
        #expect(model.categoryError == "Category is required")
        #expect(try store.fetch(Expense.self).isEmpty)
    }

    @Test(arguments: [
        ("", "Amount is required"),
        ("abc", "Please enter a valid number"),
        ("₱ 0", "Amount cannot be zero"),
        ("₱ 1,000,000,000", "Amount must be less than 999,999,999"),
    ])
    func amountUsesTheExpenseRules(text: String, message: String) throws {
        let model = addingModel(categoryID: try category().id, amount: text)
        #expect(try model.save(now: now) == false)
        #expect(model.amountError == message)
        #expect(try store.fetch(Expense.self).isEmpty)
    }

    @Test func titleMustNotExceedOneHundredCharacters() throws {
        let model = addingModel(categoryID: try category().id)
        model.title = String(repeating: "a", count: 101)
        #expect(try model.save(now: now) == false)
        #expect(model.titleError == "Title must not exceed 100 characters")

        model.title = String(repeating: "a", count: 100)
        #expect(try model.save(now: now))
        #expect(model.titleError == nil)
    }

    @Test func allErrorsAreReportedTogetherAndClearOnASuccessfulSave() throws {
        let model = addingModel(categoryID: nil, amount: "")
        model.title = String(repeating: "a", count: 101)
        #expect(try model.save(now: now) == false)
        #expect(model.categoryError != nil)
        #expect(model.amountError != nil)
        #expect(model.titleError != nil)

        model.categoryID = try category().id
        model.amountText = "₱ 10"
        model.title = "ok"
        #expect(try model.save(now: now))
        #expect(model.categoryError == nil && model.amountError == nil && model.titleError == nil)
    }

    // MARK: stored values

    @Test func blankTitleFallsBackToTheCategoryName() throws {
        let model = addingModel(categoryID: try category("Groceries").id)
        model.title = "   "
        #expect(try model.save(now: now))
        #expect(try onlyExpense().title == "Groceries")
    }

    @Test func titleAndNoteAreTrimmedAndBlankNoteIsNil() throws {
        let model = addingModel(categoryID: try category().id)
        model.title = "  Lunch with team "
        model.note = "  "
        #expect(try model.save(now: now))
        let expense = try onlyExpense()
        #expect(expense.title == "Lunch with team")
        #expect(expense.note == nil)
    }

    @Test func savesTheFieldsOfANewExpense() throws {
        let food = try category()
        let model = addingModel(categoryID: food.id, amount: "₱ 1,234.5")
        model.note = "Team lunch"
        let day = TestCalendar.date(2026, 11, 3, 9)
        model.date = day
        #expect(try model.save(now: now))
        let expense = try onlyExpense()
        #expect(expense.amount == 1234.5)
        #expect(expense.categoryID == food.id)
        #expect(expense.note == "Team lunch")
        #expect(expense.transactionDate == day)
        #expect(expense.recurrence == nil && expense.recurrenceID == nil && expense.warrantyID == nil)
    }

    @Test func expenseAmountIsStoredPositiveAndRefundNegative() throws {
        let food = try category()
        let expense = addingModel(categoryID: food.id, amount: "-650")
        #expect(try expense.save(now: now))
        let refund = addingModel(categoryID: food.id, amount: "₱ 500")
        refund.kind = .refund
        #expect(try refund.save(now: now))
        let amounts = try store.fetch(Expense.self).map(\.amount).sorted()
        #expect(amounts == [-500, 650])
    }

    @Test func editingUpdatesInPlace() throws {
        let food = try category()
        let shopping = try category("Shopping")
        let expense = try ExpenseService(context: context).add(
            ExpenseDraft(title: "Lunch", amount: 650, transactionDate: now, categoryID: food.id), now: now)
        let model = ExpenseFormModel(editing: expense, context: context)
        model.kind = .refund
        model.categoryID = shopping.id
        model.amountText = "₱ 200"
        model.title = "Return"
        #expect(try model.save(now: now))
        let saved = try onlyExpense()
        #expect(saved.id == expense.id)
        #expect(saved.amount == -200)
        #expect(saved.title == "Return")
        #expect(saved.categoryID == shopping.id)
    }

    // MARK: recurrence

    @Test func recurringOnANewExpenseMakesATemplate() throws {
        let model = addingModel(categoryID: try category().id)
        model.isRecurring = true
        #expect(try model.save(now: now))
        let expense = try onlyExpense()
        #expect(expense.recurrence == .monthly)
        #expect(expense.recurrenceID == nil)
    }

    @Test func editingAnInstanceKeepsItAnInstance() throws {
        let service = ExpenseService(context: context)
        let template = try service.add(ExpenseDraft(title: "Rent", amount: 100, transactionDate: now,
                                                    recurrence: .monthly), now: now)
        let instance = try service.add(ExpenseDraft(title: "Rent", amount: 100, transactionDate: now,
                                                    recurrenceID: template.id), now: now)
        let model = ExpenseFormModel(editing: instance, context: context)
        model.categoryID = try category().id
        #expect(try model.save(now: now))
        #expect(instance.recurrence == nil)
        #expect(instance.recurrenceID == template.id)
        #expect(template.recurrence == .monthly)
    }

    @Test func turningRecurringOffOnATemplateDetachesIt() throws {
        let template = try ExpenseService(context: context).add(
            ExpenseDraft(title: "Rent", amount: 100, transactionDate: now, categoryID: try category().id,
                         recurrence: .monthly), now: now)
        let model = ExpenseFormModel(editing: template, context: context)
        model.isRecurring = false
        #expect(try model.save(now: now))
        #expect(template.recurrence == nil && template.recurrenceID == nil)
    }

    @Test func turningRecurringOffOnAnInstanceCancelsTheSeries() throws {
        let food = try category()
        let service = ExpenseService(context: context)
        let template = try service.add(ExpenseDraft(title: "Rent", amount: 100, transactionDate: now,
                                                    categoryID: food.id, recurrence: .monthly), now: now)
        let instance = try service.add(ExpenseDraft(title: "Rent", amount: 100, transactionDate: now,
                                                    categoryID: food.id, recurrenceID: template.id), now: now)
        let model = ExpenseFormModel(editing: instance, context: context)
        model.isRecurring = false
        #expect(try model.save(now: now))
        #expect(instance.recurrence == nil && instance.recurrenceID == nil)
        #expect(template.recurrence == nil)
    }

    // MARK: receipt

    @Test func addingWithAReceiptCreatesALinkedWarranty() throws {
        let model = addingModel(categoryID: try category().id)
        model.title = "Rice cooker"
        model.receiptChange = .replaced(image)
        let expiry = TestCalendar.date(2028, 11, 3)
        model.warrantyExpiration = expiry
        #expect(model.hasReceipt)
        #expect(try model.save(now: now))
        let warranties = try store.fetch(Warranty.self)
        #expect(warranties.count == 1)
        let warranty = try #require(warranties.first)
        #expect(warranty.title == "Rice cooker")
        #expect(warranty.imageData == image)
        #expect(warranty.expirationDate == expiry)
        #expect(try onlyExpense().warrantyID == warranty.id)
    }

    @Test func addingWithoutAReceiptCreatesNoWarranty() throws {
        let model = addingModel(categoryID: try category().id)
        model.warrantyExpiration = TestCalendar.date(2028, 1, 1)
        #expect(try model.save(now: now))
        #expect(try store.fetch(Warranty.self).isEmpty)
        #expect(try onlyExpense().warrantyID == nil)
    }

    func expenseWithWarranty() throws -> (Expense, Warranty) {
        let warranty = try WarrantyService(context: context).add(title: "Rice cooker", expirationDate: nil,
                                                                  imageData: image, now: now)
        let expense = try ExpenseService(context: context).add(
            ExpenseDraft(title: "Rice cooker", amount: 2500, transactionDate: now, categoryID: try category().id,
                         warrantyID: warranty.id), now: now)
        return (expense, warranty)
    }

    @Test func editingLoadsTheExistingWarranty() throws {
        let (expense, warranty) = try expenseWithWarranty()
        warranty.expirationDate = TestCalendar.date(2028, 1, 1)
        let model = ExpenseFormModel(editing: expense, context: context)
        #expect(model.existingWarranty?.id == warranty.id)
        #expect(model.warrantyExpiration == TestCalendar.date(2028, 1, 1))
        #expect(model.hasReceipt)
    }

    @Test func replacedReceiptDeletesTheOldWarrantyAndLinksANewOne() throws {
        let (expense, old) = try expenseWithWarranty()
        let oldID = old.id
        let model = ExpenseFormModel(editing: expense, context: context)
        model.receiptChange = .replaced(otherImage)
        #expect(try model.save(now: now))
        let warranties = try store.fetch(Warranty.self)
        #expect(warranties.count == 1)
        let fresh = try #require(warranties.first)
        #expect(fresh.id != oldID)
        #expect(fresh.imageData == otherImage)
        #expect(expense.warrantyID == fresh.id)
    }

    @Test func removedReceiptDeletesAndUnlinks() throws {
        let (expense, _) = try expenseWithWarranty()
        let model = ExpenseFormModel(editing: expense, context: context)
        model.receiptChange = .removed
        #expect(model.hasReceipt == false)
        #expect(try model.save(now: now))
        #expect(try store.fetch(Warranty.self).isEmpty)
        #expect(expense.warrantyID == nil)
    }

    @Test func unchangedReceiptUpdatesTheWarrantyTitleAndExpiry() throws {
        let (expense, warranty) = try expenseWithWarranty()
        let model = ExpenseFormModel(editing: expense, context: context)
        model.title = "Rice cooker XL"
        let expiry = TestCalendar.date(2029, 2, 1)
        model.warrantyExpiration = expiry
        #expect(try model.save(now: now))
        #expect(try store.fetch(Warranty.self).count == 1)
        #expect(warranty.title == "Rice cooker XL")
        #expect(warranty.expirationDate == expiry)
        #expect(warranty.imageData == image)
        #expect(expense.warrantyID == warranty.id)
    }

    @Test func invalidSaveTouchesNoWarranty() throws {
        let (expense, _) = try expenseWithWarranty()
        let model = ExpenseFormModel(editing: expense, context: context)
        model.receiptChange = .removed
        model.amountText = ""
        #expect(try model.save(now: now) == false)
        #expect(try store.fetch(Warranty.self).count == 1)
        #expect(expense.warrantyID != nil)
    }

    // MARK: delete

    @Test func deleteRemovesTheExpenseOnly() throws {
        let (expense, _) = try expenseWithWarranty()
        let model = ExpenseFormModel(editing: expense, context: context)
        try model.delete()
        #expect(try store.fetch(Expense.self).isEmpty)
        #expect(try store.fetch(Warranty.self).count == 1)
    }
}
