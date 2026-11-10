import SwiftData
import SwiftUI

/// Receipts soonest-expiry first (mockup 10). Tap to view full size, swipe to delete, + adds one with no expense.
struct WarrantiesScreen: View {
    static func countLabel(_ count: Int) -> String {
        "\(count) \(count == 1 ? "receipt" : "receipts")"
    }

    static func color(for tone: WarrantyTone) -> Color {
        switch tone {
        case .expired: Theme.Colors.danger
        case .soon: Theme.Colors.warning
        case .ok: Theme.Colors.success
        case .none: Theme.Colors.textSubtle
        }
    }

    static func sorted(_ warranties: [Warranty]) -> [Warranty] {
        warranties.sorted(by: WarrantyService.soonestExpiryFirst)
    }

    @Query private var warranties: [Warranty]
    @Environment(\.modelContext) private var context
    @State private var isAdding = false
    @State private var pendingDelete: Warranty?
    @State private var errorMessage: String?

    var body: some View {
        let rows = Self.sorted(warranties)
        List {
            VStack(alignment: .leading, spacing: 0) {
                HStack(alignment: .firstTextBaseline) {
                    Text("Warranties").themeLabel()
                    Spacer(minLength: 0)
                    Text(Self.countLabel(rows.count)).themeLabel()
                }
                SectionRule("By expiry").padding(.top, Theme.Spacing.block)
                if rows.isEmpty {
                    EmptyLine("No warranties yet. Add one here, or attach a receipt when logging an expense.")
                }
            }
            .padding(.top, Theme.Spacing.block)
            .padding(.bottom, Theme.Spacing.tight)
            .plainListRow()

            ForEach(rows) { warranty in
                NavigationLink {
                    ReceiptViewer(warranty: warranty)
                } label: {
                    WarrantyRow(warranty: warranty)
                }
                .accessibilityIdentifier("warranty-row-\(warranty.id)")
                .plainListRow()
                .swipeActions(edge: .trailing, allowsFullSwipe: false) {
                    Button("Delete") { pendingDelete = warranty }
                        .tint(Theme.Colors.danger)
                }
            }
        }
        .listStyle(.plain)
        .scrollContentBackground(.hidden)
        .background(Theme.Colors.background)
        .toolbar(.hidden, for: .navigationBar)
        .safeAreaInset(edge: .bottom, spacing: 0) {
            ActionBar(addLabel: "Add warranty", addIdentifier: "add-warranty-button",
                      onAdd: { isAdding = true }) { EmptyView() }
        }
        .sheet(isPresented: $isAdding) {
            WarrantyFormScreen(warranty: nil)
        }
        .confirmationDialog(DeleteConfirmation.title(pendingDelete?.title ?? ""),
                            isPresented: Binding(get: { pendingDelete != nil },
                                                 set: { if !$0 { pendingDelete = nil } }),
                            titleVisibility: .visible) {
            Button("Delete", role: .destructive, action: delete)
        }
        .errorAlert($errorMessage)
    }

    private func delete() {
        guard let warranty = pendingDelete else { return }
        pendingDelete = nil
        do {
            try WarrantyService(context: context).delete(warranty)
        } catch {
            errorMessage = error.localizedDescription
        }
    }
}

/// Thumbnail, title and the expiry status word.
private struct WarrantyRow: View {
    let warranty: Warranty

    var body: some View {
        let expiry = WarrantyExpiry.status(expirationDate: warranty.expirationDate)
        HStack(spacing: Theme.Spacing.block) {
            ReceiptThumbnail(image: warranty.imageData, remoteURL: warranty.imageURL)
            VStack(alignment: .leading, spacing: Theme.Spacing.tight) {
                Text(warranty.title).font(Theme.Fonts.bodyStrong).foregroundStyle(Theme.Colors.text)
                StatusText(expiry.label, color: WarrantiesScreen.color(for: expiry.tone))
            }
            Spacer(minLength: 0)
        }
        .padding(.vertical, Theme.Spacing.row)
        .frame(minHeight: Theme.controlHeight)
        .contentShape(Rectangle())
        .rowDivider()
    }
}

#Preview {
    let container = AppContainer.make(.inMemory).container
    let context = container.mainContext
    context.insert(Warranty(title: "Blender", expirationDate: .now.addingTimeInterval(-86_400 * 3)))
    context.insert(Warranty(title: "Wireless earbuds", expirationDate: .now.addingTimeInterval(86_400 * 12)))
    context.insert(Warranty(title: "Office chair"))
    return NavigationStack { WarrantiesScreen() }.modelContainer(container)
}
