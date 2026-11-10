import Foundation

/// Web-compatible record ids: a per-table prefix plus a lowercased UUID.
nonisolated enum IDFactory {
    enum Kind: String, Sendable { case expense = "exp", category = "ctg", budget = "bdg", warranty = "wrt" }

    static func make(_ kind: Kind) -> String { kind.rawValue + uid() }

    static func uid() -> String { UUID().uuidString.lowercased() }
}
