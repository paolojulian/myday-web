/// Copy shared by the swipe-to-delete confirmation dialogs (Categories, Warranties).
enum DeleteConfirmation {
    /// "Delete “Food”?"
    static func title(_ name: String) -> String { "Delete “\(name)”?" }
}
