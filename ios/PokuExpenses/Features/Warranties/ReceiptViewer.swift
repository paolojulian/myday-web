import SwiftUI
import UIKit

/// The receipt full size (pinch to zoom, double-tap to reset), with its title and expiry.
/// "Edit" opens the warranty form for this record.
struct ReceiptViewer: View {
    static let maxZoom: CGFloat = 5

    let warranty: Warranty
    @State private var isEditing = false
    @State private var zoom: CGFloat = 1
    @GestureState private var pinch: CGFloat = 1

    var body: some View {
        let expiry = WarrantyExpiry.status(expirationDate: warranty.expirationDate)
        VStack(alignment: .leading, spacing: 0) {
            image
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .clipped()
            VStack(alignment: .leading, spacing: Theme.Spacing.tight) {
                Text(warranty.title).font(Theme.Fonts.title).foregroundStyle(Theme.Colors.text)
                StatusText(expiry.label, color: WarrantiesScreen.color(for: expiry.tone))
            }
            .padding(.vertical, Theme.Spacing.field)
            .screenMargins()
        }
        .background(Theme.Colors.background)
        .navigationBarTitleDisplayMode(.inline)
        .toolbar(.visible, for: .navigationBar)
        .toolbar {
            ToolbarItem(placement: .topBarTrailing) {
                Button("Edit") { isEditing = true }
                    .tint(Theme.Colors.text)
            }
        }
        .sheet(isPresented: $isEditing) {
            WarrantyFormScreen(warranty: warranty)
        }
    }

    @ViewBuilder private var image: some View {
        if let data = warranty.imageData, let uiImage = UIImage(data: data) {
            zoomable(Image(uiImage: uiImage).resizable().scaledToFit())
        } else if let remote = warranty.imageURL, let url = URL(string: remote) {
            AsyncImage(url: url) { phase in
                if let loaded = phase.image {
                    zoomable(loaded.resizable().scaledToFit())
                } else {
                    placeholder
                }
            }
        } else {
            placeholder
        }
    }

    private func zoomable(_ content: some View) -> some View {
        content
            .scaleEffect(min(Self.maxZoom, max(1, zoom * pinch)))
            .gesture(
                MagnifyGesture()
                    .updating($pinch) { value, state, _ in state = value.magnification }
                    .onEnded { value in zoom = min(Self.maxZoom, max(1, zoom * value.magnification)) }
            )
            .onTapGesture(count: 2) { withAnimation { zoom = 1 } }
            .accessibilityLabel("Receipt photo")
    }

    private var placeholder: some View {
        Image(systemName: "doc.text.image")
            .font(Theme.Fonts.display)
            .foregroundStyle(Theme.Colors.textSubtle)
            .frame(maxWidth: .infinity, maxHeight: .infinity)
            .background(Theme.Colors.surfaceSubtle)
            .accessibilityLabel("No receipt photo")
    }
}

#Preview {
    NavigationStack {
        ReceiptViewer(warranty: Warranty(title: "Robot vacuum", expirationDate: .now.addingTimeInterval(86_400 * 700)))
    }
    .modelContainer(AppContainer.make(.inMemory).container)
}
