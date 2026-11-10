import Foundation

/// Pesos only. Ports of toCurrency (currency.utils.ts), formatCurrency / clearCurrencyFormatting
/// (formatters.utils.ts) and the amount validation rules of the expense and budget forms.
nonisolated enum Money {
    static let maxAmount: Double = 999_999_999

    /// "₱1,250" · "₱1,250.5" · "₱1,250.75" · "-₱500". 0–2 fraction digits.
    static func format(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "en_US")
        formatter.numberStyle = .decimal
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = 2
        formatter.roundingMode = .halfUp
        let magnitude = formatter.string(from: NSNumber(value: abs(amount))) ?? "0"
        // Rounds to zero (e.g. -0.001) → no minus sign.
        let isNegative = amount < 0 && magnitude != "0"
        return (isNegative ? "-₱" : "₱") + magnitude
    }

    /// One expense in a list: refunds (negative) render "+₱500", expenses "₱650".
    static func formatSigned(expenseAmount: Double) -> String {
        expenseAmount < 0 ? "+" + format(-expenseAmount) : format(expenseAmount)
    }

    /// A stored amount as edit-field text: 1250.5 → "₱ 1,250.5". Rounds half-up to 2 decimals like `format`.
    static func inputText(_ amount: Double) -> String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "en_US_POSIX")
        formatter.numberStyle = .decimal
        formatter.usesGroupingSeparator = false
        formatter.minimumFractionDigits = 0
        formatter.maximumFractionDigits = 2
        formatter.roundingMode = .halfUp
        return formatInput(formatter.string(from: NSNumber(value: amount)) ?? "")
    }

    /// As-you-type field text: "₱ 1,234.56", "₱ 0.", "", max 2 decimals.
    static func formatInput(_ raw: String) -> String {
        let cleaned = clean(raw)
        let isNegative = cleaned.hasPrefix("-")
        let numeric = isNegative ? String(cleaned.dropFirst()) : cleaned

        if numeric.isEmpty { return isNegative ? "-" : "" }
        if numeric == "." { return isNegative ? "-₱ 0." : "₱ 0." }

        let endsWithDecimal = numeric.hasSuffix(".")
        let parts = numeric.split(separator: ".", omittingEmptySubsequences: false)
        let integerPart = parts.first.map(String.init) ?? ""
        let decimalPart = parts.count > 1 ? String(parts[1]) : nil

        // parseInt semantics: leading digits only; an empty integer part counts as 0.
        let digits = integerPart.isEmpty ? "0" : String(integerPart.prefix(while: \.isASCIIDigit))
        if digits.isEmpty { return "" }

        var formatted = (isNegative ? "-₱ " : "₱ ") + groupThousands(digits)
        if endsWithDecimal {
            formatted += "."
        } else if let decimalPart {
            formatted += "." + decimalPart.prefix(2)
        }
        return formatted
    }

    /// Strip "₱", whitespace and commas, then parse. nil when empty or not a finite number.
    static func parseInput(_ text: String) -> Double? {
        let cleaned = clean(text)
        guard !cleaned.isEmpty, let value = Double(cleaned), value.isFinite else { return nil }
        return value
    }

    /// nil = valid.
    static func expenseAmountError(_ text: String) -> String? {
        amountError(text) { $0 == 0 ? "Amount cannot be zero" : nil }
    }

    /// nil = valid.
    static func budgetAmountError(_ text: String) -> String? {
        amountError(text) { $0 <= 0 ? "Amount must be greater than 0" : nil }
    }

    private static func amountError(_ text: String, lowerBound: (Double) -> String?) -> String? {
        if clean(text).isEmpty { return "Amount is required" }
        guard let value = parseInput(text) else { return "Please enter a valid number" }
        if let error = lowerBound(value) { return error }
        if value >= maxAmount { return "Amount must be less than 999,999,999" }
        return nil
    }

    private static func clean(_ text: String) -> String {
        String(text.filter { $0 != "₱" && $0 != "," && !$0.isWhitespace })
    }

    private static func groupThousands(_ digits: String) -> String {
        let trimmed = digits.drop(while: { $0 == "0" })
        let significant = trimmed.isEmpty ? "0" : String(trimmed)
        var groups: [Substring] = []
        var end = significant.endIndex
        while end > significant.startIndex {
            let start = significant.index(end, offsetBy: -3, limitedBy: significant.startIndex) ?? significant.startIndex
            groups.insert(significant[start..<end], at: 0)
            end = start
        }
        return groups.joined(separator: ",")
    }
}

private extension Character {
    var isASCIIDigit: Bool { ("0"..."9").contains(self) }
}
