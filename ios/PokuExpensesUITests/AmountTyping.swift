import XCTest

extension XCUIElement {
    /// Types whole-peso `digits` into an as-you-type money field, one key at a time.
    ///
    /// Each keystroke makes the app rewrite the field ("6" → "₱ 6") one SwiftUI update later. A burst
    /// from `typeText` can land a key before that rewrite, which then overwrites it ("650" became
    /// "₱ 60"). Waiting for the formatted value after every key keeps the keystrokes ordered.
    func typeAmount(_ digits: String, file: StaticString = #filePath, line: UInt = #line) {
        for end in digits.indices {
            typeText(String(digits[end]))
            let expected = Self.formattedAmount(String(digits[...end]))
            let expectation = XCTNSPredicateExpectation(predicate: NSPredicate(format: "value == %@", expected),
                                                        object: self)
            let result = XCTWaiter().wait(for: [expectation], timeout: 5)
            XCTAssertEqual(result, .completed, "field reads \(expected), not \(value ?? "nil")", file: file, line: line)
        }
    }

    /// What a money field shows for whole-peso `digits`: "650" → "₱ 650", "2310" → "₱ 2,310".
    static func formattedAmount(_ digits: String) -> String {
        let formatter = NumberFormatter()
        formatter.locale = Locale(identifier: "en_US")
        formatter.numberStyle = .decimal
        return "₱ " + (formatter.string(from: NSNumber(value: Int(digits) ?? 0)) ?? digits)
    }
}
