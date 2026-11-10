import PhotosUI
import SwiftUI
import UIKit

/// A receipt photo: "Add photo" when empty; thumbnail, expiry and Change date / Replace / Remove when set.
/// Holds no model knowledge, so the expense form and the warranty form share it.
struct ReceiptField: View {
    let image: Data?
    let remoteURL: String?
    let expiryText: String?
    let title: String
    let allowsRemove: Bool
    let onPick: (Data) -> Void
    let onRemove: () -> Void
    let onChangeDate: (() -> Void)?

    @State private var isChoosingSource = false
    @State private var isPickingFromLibrary = false
    @State private var isTakingPhoto = false
    @State private var libraryItem: PhotosPickerItem?
    @State private var errorMessage: String?

    init(image: Data?, remoteURL: String?, expiryText: String?, title: String, allowsRemove: Bool,
         onPick: @escaping (Data) -> Void, onRemove: @escaping () -> Void, onChangeDate: (() -> Void)?) {
        self.image = image
        self.remoteURL = remoteURL
        self.expiryText = expiryText
        self.title = title
        self.allowsRemove = allowsRemove
        self.onPick = onPick
        self.onRemove = onRemove
        self.onChangeDate = onChangeDate
    }

    private var hasReceipt: Bool { image != nil || remoteURL != nil }

    var body: some View {
        Group {
            if hasReceipt { filled } else { empty }
        }
        .confirmationDialog("Add a receipt photo", isPresented: $isChoosingSource) {
            if UIImagePickerController.isSourceTypeAvailable(.camera) {
                Button("Take photo") { isTakingPhoto = true }
            }
            Button("Choose from library") { isPickingFromLibrary = true }
        }
        .photosPicker(isPresented: $isPickingFromLibrary, selection: $libraryItem, matching: .images)
        .fullScreenCover(isPresented: $isTakingPhoto) {
            CameraPicker { picked in
                isTakingPhoto = false
                if let picked { deliver(picked) }
            }
            .ignoresSafeArea()
        }
        .onChange(of: libraryItem) { _, item in
            guard let item else { return }
            libraryItem = nil
            Task { await load(item) }
        }
        .errorAlert($errorMessage)
    }

    private var empty: some View {
        HStack(spacing: Theme.Spacing.block) {
            Text(title).font(Theme.Fonts.small.weight(.medium)).foregroundStyle(Theme.Colors.text)
            Spacer(minLength: 0)
            link("Add photo") { isChoosingSource = true }
                .accessibilityIdentifier("receipt-add-button")
        }
        .frame(minHeight: Theme.controlHeight)
    }

    private var filled: some View {
        VStack(alignment: .leading, spacing: 0) {
            Text(title).themeLabel()
            HStack(alignment: .top, spacing: Theme.Spacing.block) {
                ReceiptThumbnail(image: image, remoteURL: remoteURL)
                VStack(alignment: .leading, spacing: 0) {
                    if let expiryText {
                        Text(expiryText).font(Theme.Fonts.small.weight(.medium)).foregroundStyle(Theme.Colors.text)
                    }
                    HStack(spacing: Theme.Spacing.block) {
                        if let onChangeDate { link("Change date", action: onChangeDate) }
                        link("Replace") { isChoosingSource = true }
                            .accessibilityIdentifier("receipt-replace-button")
                        if allowsRemove {
                            link("Remove", color: Theme.Colors.danger, action: onRemove)
                                .accessibilityIdentifier("receipt-remove-button")
                        }
                    }
                }
                Spacer(minLength: 0)
            }
            .padding(.top, Theme.Spacing.gutter)
        }
    }

    private func link(_ title: String, color: Color = Theme.Colors.text, action: @escaping () -> Void) -> some View {
        Button(action: action) {
            Text(title)
                .font(Theme.Fonts.small.weight(.medium))
                .underline()
                .foregroundStyle(color)
                .frame(minHeight: Theme.controlHeight)
                .contentShape(Rectangle())
        }
        .buttonStyle(.plain)
    }

    private func load(_ item: PhotosPickerItem) async {
        do {
            guard let data = try await item.loadTransferable(type: Data.self), let picked = UIImage(data: data) else {
                errorMessage = "That photo could not be opened."
                return
            }
            deliver(picked)
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func deliver(_ picked: UIImage) {
        guard let data = ReceiptImage.prepare(picked) else {
            errorMessage = "That photo could not be saved."
            return
        }
        onPick(data)
    }
}

/// The 52pt receipt square: image bytes, else the remote URL, else a placeholder.
struct ReceiptThumbnail: View {
    let image: Data?
    let remoteURL: String?

    var body: some View {
        content
            .frame(width: Theme.thumbnail, height: Theme.thumbnail)
            .background(Theme.Colors.surfaceSubtle)
            .clipShape(RoundedRectangle(cornerRadius: Theme.Radius.control))
            .overlay(RoundedRectangle(cornerRadius: Theme.Radius.control)
                .strokeBorder(Theme.Colors.border, lineWidth: Theme.hairline))
            .accessibilityLabel("Receipt photo")
    }

    @ViewBuilder private var content: some View {
        if let image, let uiImage = UIImage(data: image) {
            Image(uiImage: uiImage).resizable().scaledToFill()
        } else if let remoteURL, let url = URL(string: remoteURL) {
            AsyncImage(url: url) { phase in
                if let loaded = phase.image { loaded.resizable().scaledToFill() } else { placeholder }
            }
        } else {
            placeholder
        }
    }

    private var placeholder: some View {
        Image(systemName: "doc.text.image").font(Theme.Fonts.bodyStrong).foregroundStyle(Theme.Colors.textSubtle)
    }
}

/// The system camera; `onFinish(nil)` when cancelled.
private struct CameraPicker: UIViewControllerRepresentable {
    let onFinish: (UIImage?) -> Void

    func makeUIViewController(context: Context) -> UIImagePickerController {
        let picker = UIImagePickerController()
        picker.sourceType = .camera
        picker.delegate = context.coordinator
        return picker
    }

    func updateUIViewController(_ uiViewController: UIImagePickerController, context: Context) {}

    func makeCoordinator() -> Coordinator { Coordinator(onFinish: onFinish) }

    final class Coordinator: NSObject, UIImagePickerControllerDelegate, UINavigationControllerDelegate {
        let onFinish: (UIImage?) -> Void
        init(onFinish: @escaping (UIImage?) -> Void) { self.onFinish = onFinish }

        func imagePickerController(_ picker: UIImagePickerController,
                                   didFinishPickingMediaWithInfo info: [UIImagePickerController.InfoKey: Any]) {
            onFinish(info[.originalImage] as? UIImage)
        }

        func imagePickerControllerDidCancel(_ picker: UIImagePickerController) { onFinish(nil) }
    }
}

#Preview("Empty") {
    ReceiptField(image: nil, remoteURL: nil, expiryText: nil, title: "Warranty receipt · optional",
                 allowsRemove: true, onPick: { _ in }, onRemove: {}, onChangeDate: {})
        .screenMargins()
}

#Preview("With receipt") {
    ReceiptField(image: nil, remoteURL: "https://example.com/r.jpg", expiryText: "Expires Nov 3, 2028",
                 title: "Warranty receipt", allowsRemove: true, onPick: { _ in }, onRemove: {}, onChangeDate: {})
        .screenMargins()
}
