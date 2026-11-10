import Foundation
import SwiftData
import Testing
@testable import PokuExpenses

@MainActor
struct ModelSchemaTests {
    static let schema = AppContainer.schema

    @Test func schemaHasTheFourEntities() {
        let names = Set(Self.schema.entities.map(\.name))
        #expect(names == ["Expense", "ExpenseCategory", "Budget", "Warranty"])
    }

    @Test func everyAttributeIsOptionalOrHasADefault() {
        for entity in Self.schema.entities {
            for attribute in entity.attributes {
                #expect(attribute.isOptional || attribute.defaultValue != nil,
                        "\(entity.name).\(attribute.name) needs a default or must be optional")
            }
        }
    }

    @Test func noUniquenessConstraintsOrRelationships() {
        for entity in Self.schema.entities {
            #expect(entity.uniquenessConstraints.isEmpty, "\(entity.name) has a uniqueness constraint")
            #expect(entity.relationships.isEmpty, "\(entity.name) has a relationship")
            for attribute in entity.attributes {
                #expect(!attribute.isUnique, "\(entity.name).\(attribute.name) is unique")
            }
        }
    }

    @Test func warrantyImageUsesExternalStorage() throws {
        let entity = try #require(Self.schema.entities.first { $0.name == "Warranty" })
        let image = try #require(entity.attributes.first { $0.name == "imageData" })
        #expect(image.options.contains(.externalStorage))
    }

    @Test func idFactoryPrefixesAndLowercases() {
        let cases: [(IDFactory.Kind, String)] = [(.expense, "exp"), (.category, "ctg"), (.budget, "bdg"), (.warranty, "wrt")]
        for (kind, prefix) in cases {
            let id = IDFactory.make(kind)
            #expect(id.hasPrefix(prefix))
            let rest = String(id.dropFirst(prefix.count))
            #expect(UUID(uuidString: rest) != nil)
            #expect(rest == rest.lowercased())
        }
        let uid = IDFactory.uid()
        #expect(UUID(uuidString: uid) != nil && uid == uid.lowercased())
        #expect(IDFactory.make(.expense) != IDFactory.make(.expense))
    }

    @Test func initsFillIdentityAndTimestamps() {
        let now = Date(timeIntervalSince1970: 1_700_000_000)
        let expense = Expense(title: "Lunch", amount: 250, transactionDate: now, now: now)
        #expect(expense.id.hasPrefix("exp"))
        #expect(!expense.uid.isEmpty)
        #expect(expense.createdAt == now && expense.updatedAt == now)
        #expect(ExpenseCategory(name: "Food", now: now).id.hasPrefix("ctg"))
        #expect(Budget(amount: 1000, now: now).id.hasPrefix("bdg"))
        #expect(Warranty(title: "TV", now: now).id.hasPrefix("wrt"))
        let fixed = Expense(id: "exp-fixed", uid: "u1", title: "", amount: 0, transactionDate: now)
        #expect(fixed.id == "exp-fixed" && fixed.uid == "u1")
    }

    @Test func expenseRecurrenceAndRefund() {
        let expense = Expense(title: "Rent", amount: 100, transactionDate: .now)
        #expect(expense.recurrence == nil && !expense.isRefund)
        expense.recurrence = .monthly
        #expect(expense.recurrenceRaw == "monthly" && expense.recurrence == .monthly)
        expense.recurrence = nil
        #expect(expense.recurrenceRaw == nil)
        expense.amount = -5
        #expect(expense.isRefund)
    }
}
