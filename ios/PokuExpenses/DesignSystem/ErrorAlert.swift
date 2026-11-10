import SwiftUI

extension View {
    /// Shows `message` in an alert while it is non-nil; dismissing clears it.
    func errorAlert(_ message: Binding<String?>) -> some View {
        alert("Something went wrong", isPresented: Binding(
            get: { message.wrappedValue != nil },
            set: { if !$0 { message.wrappedValue = nil } }
        )) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(message.wrappedValue ?? "")
        }
    }
}

#Preview {
    @Previewable @State var message: String? = "The store could not be saved."
    Text("Behind the alert").errorAlert($message)
}
