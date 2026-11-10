import SwiftData
import SwiftUI

/// Add or edit a warranty with no expense (mockup 13). Presented as a sheet by WarrantiesScreen and ReceiptViewer.
struct WarrantyFormScreen: View {
    /// nil = add a new one.
    let warranty: Warranty?
    @Environment(\.modelContext) private var context
    @State private var model: WarrantyFormModel?

    static func expiryText(_ date: Date?, calendar: Calendar = .current) -> String {
        date.map { DateMath.mediumDate($0, calendar: calendar) } ?? "No expiry date"
    }

    static func dateLinkTitle(_ date: Date?) -> String { date == nil ? "Set date" : "Change date" }

    var body: some View {
        Group {
            if let model {
                WarrantyFormContent(model: model)
            } else {
                Color.clear
            }
        }
        .background(Theme.Colors.surface)
        .presentationCornerRadius(Theme.Radius.sheet)
        .onAppear {
            guard model == nil else { return }
            model = warranty.map { WarrantyFormModel(editing: $0, context: context) }
                ?? WarrantyFormModel(addingIn: context)
        }
    }
}

private struct WarrantyFormContent: View {
    @Bindable var model: WarrantyFormModel
    @Environment(\.dismiss) private var dismiss
    @FocusState private var nameFocused: Bool
    @State private var isPickingDate = false
    @State private var errorMessage: String?

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 0) {
                VStack(alignment: .leading, spacing: Theme.Spacing.tight) {
                    Text(model.isEditing ? "Edit warranty" : "Add warranty")
                        .font(Theme.Fonts.title)
                        .foregroundStyle(Theme.Colors.text)
                    if !model.isEditing {
                        Text("For something you already bought. This does not add an expense.")
                            .font(Theme.Fonts.small)
                            .foregroundStyle(Theme.Colors.textMuted)
                    }
                }
                UnderlineField(label: "Name", text: $model.title, placeholder: "Air conditioner",
                               error: model.titleError)
                    .focused($nameFocused)
                    .submitLabel(.done)
                    .onSubmit { nameFocused = false }
                    .accessibilityIdentifier("warranty-name-field")
                    .padding(.top, Theme.Spacing.field)
                receipt.padding(.top, Theme.Spacing.field)
                expiry.padding(.top, Theme.Spacing.field)
            }
            .screenMargins()
            .padding(.vertical, Theme.Spacing.field)
        }
        .scrollDismissesKeyboard(.interactively)
        .background(Theme.Colors.surface)
        .safeAreaInset(edge: .bottom, spacing: 0) { footer }
        .onAppear { if !model.isEditing { nameFocused = true } }
        .sheet(isPresented: $isPickingDate) {
            CustomDateSheet(date: model.expirationDate ?? .now) { model.expirationDate = $0 }
        }
        .errorAlert($errorMessage)
    }

    private var receipt: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.tight) {
            ReceiptField(image: model.pickedImageData ?? model.existing?.imageData,
                         remoteURL: model.pickedImageData == nil ? model.existing?.imageURL : nil,
                         expiryText: nil, title: "Receipt", allowsRemove: false,
                         onPick: { model.pickedImageData = $0 }, onRemove: {}, onChangeDate: nil)
            Text(model.imageError ?? " ")
                .font(Theme.Fonts.caption)
                .foregroundStyle(Theme.Colors.danger)
                .opacity(model.imageError == nil ? 0 : 1)
                .accessibilityHidden(model.imageError == nil)
        }
    }

    private var expiry: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text("Expiry date · optional").themeLabel()
            HStack(spacing: Theme.Spacing.block) {
                Text(WarrantyFormScreen.expiryText(model.expirationDate))
                    .font(Theme.Fonts.bodyStrong)
                    .foregroundStyle(model.expirationDate == nil ? Theme.Colors.textSubtle : Theme.Colors.text)
                Spacer(minLength: 0)
                link(WarrantyFormScreen.dateLinkTitle(model.expirationDate)) { isPickingDate = true }
                if model.expirationDate != nil {
                    link("Clear") { model.expirationDate = nil }
                }
            }
            .frame(minHeight: Theme.controlHeight)
            .rowDivider()
        }
    }

    private func link(_ title: String, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(Theme.Fonts.small.weight(.medium))
                .underline()
                .foregroundStyle(Theme.Colors.text)
                .frame(minHeight: Theme.controlHeight)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private var footer: some View {
        HStack(spacing: Theme.Spacing.gutter) {
            IconButton(systemImage: "xmark", label: "Cancel") { dismiss() }
                .accessibilityIdentifier("form-cancel-button")
            PrimaryButton(model.isEditing ? "Update warranty" : "Add warranty", action: save)
                .accessibilityIdentifier("warranty-save-button")
        }
        .padding(.vertical, Theme.Spacing.row)
        .screenMargins()
        .background(Theme.Colors.surface)
        .overlay(alignment: .top) {
            Rectangle().fill(Theme.Colors.borderSubtle).frame(height: Theme.hairline)
        }
    }

    private func save() {
        do {
            if try model.save() { dismiss() }
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

#Preview {
    Text("Warranties").sheet(isPresented: .constant(true)) {
        WarrantyFormScreen(warranty: nil)
    }
    .modelContainer(AppContainer.make(.inMemory).container)
}
