import Foundation
import Testing
@testable import PokuExpenses

/// Requirement 10: colour, font size and spacing values live only in `DesignSystem/Theme.swift`.
/// Scans the app sources on disk (the simulator can read the host file system).
struct DesignRulesTests {
    static let sourcesRoot = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent()
        .appendingPathComponent("PokuExpenses")

    struct Violation: CustomStringConvertible {
        let file: String, line: Int, text: String, rule: String
        var description: String { "\(file):\(line) [\(rule)] \(text)" }
    }

    static let colourNames = "red|green|blue|black|white|gray|grey|orange|yellow|pink|purple|cyan|mint|teal|indigo|brown"

    /// (rule, pattern). Numbers other than 0, 1 and 2 (rules and bars) are violations.
    static let rules: [(String, String)] = [
        ("colour literal", ##"#colorLiteral|(UI)?Color\(\s*(red|white|hue|\.sRGB|\.displayP3|hex|"#)"##),
        ("colour literal", #"\bColor\.("# + colourNames + #")\b"#),
        ("colour literal", #"[(,:]\s*\.("# + colourNames + #")\b(?!\s*[:(])"#),
        ("system font size", #"\.system\(size:"#),
        ("raw padding", #"\.padding\(\s*(\.[A-Za-z]+\s*,\s*|\[[^\]]*\]\s*,\s*)?-?([3-9]|\d{2,}|\d*\.\d+)\b"#),
        ("raw spacing", #"spacing:\s*-?([3-9]|\d{2,}|\d*\.\d+)\b"#),
        ("raw frame", #"\.frame\([^)]*\b(width|height|minWidth|minHeight|maxWidth|maxHeight|idealWidth|idealHeight):\s*-?([3-9]|\d{2,}|\d*\.\d+)\b"#),
    ]

    static func swiftFiles() throws -> [URL] {
        let enumerator = FileManager.default.enumerator(at: sourcesRoot, includingPropertiesForKeys: nil)
        var files: [URL] = []
        while let url = enumerator?.nextObject() as? URL {
            if url.pathExtension == "swift" { files.append(url) }
        }
        return files
    }

    static func violations(in source: String, file: String) throws -> [Violation] {
        let compiled = try rules.map { ($0.0, try NSRegularExpression(pattern: $0.1)) }
        var found: [Violation] = []
        for (index, line) in source.components(separatedBy: .newlines).enumerated() {
            let code = line.components(separatedBy: "//").first ?? line
            let range = NSRange(code.startIndex..., in: code)
            for (rule, regex) in compiled where regex.firstMatch(in: code, range: range) != nil {
                found.append(Violation(file: file, line: index + 1, text: line.trimmingCharacters(in: .whitespaces), rule: rule))
            }
        }
        return found
    }

    @Test func scannerFlagsEachRule() throws {
        let bad = """
        Text("a").foregroundStyle(Color.red)
        Text("a").foregroundStyle(.white)
        let c = Color(red: 1, green: 0, blue: 0)
        Text("a").font(.system(size: 12))
        Text("a").padding(16)
        Text("a").padding(.horizontal, 24)
        VStack(spacing: 8) {}
        Rectangle().frame(height: 48)
        """
        let flagged = try Self.violations(in: bad, file: "bad.swift")
        #expect(Set(flagged.map(\.line)) == Set(1...8))
    }

    @Test func scannerAllowsThemeTokensAndHairlines() throws {
        let good = """
        Text("a").foregroundStyle(Theme.Colors.text)
        Text("a").padding(.horizontal, Theme.Spacing.margin)
        VStack(spacing: 0) {}
        HStack(spacing: Theme.Spacing.gutter) {}
        Rectangle().frame(height: 1)
        Rectangle().frame(maxWidth: .infinity)
        Button("x", role: .destructive) {}
        """
        #expect(try Self.violations(in: good, file: "good.swift").isEmpty)
    }

    @Test func sourcesOutsideThemeUseOnlyThemeValues() throws {
        let files = try Self.swiftFiles()
        #expect(files.count > 10, "expected to find the app sources at \(Self.sourcesRoot.path)")
        var all: [Violation] = []
        for url in files where !url.path.hasSuffix("DesignSystem/Theme.swift") {
            let source = try String(contentsOf: url, encoding: .utf8)
            all += try Self.violations(in: source, file: url.lastPathComponent)
        }
        #expect(all.isEmpty, "\(all.map(\.description).joined(separator: "\n"))")
    }

    @Test func themeDefinesTheSpacingScale() {
        #expect(Theme.Spacing.tight == 4)
        #expect(Theme.Spacing.gutter == 8)
        #expect(Theme.Spacing.row == 12)
        #expect(Theme.Spacing.block == 16)
        #expect(Theme.Spacing.field == 24)
        #expect(Theme.Spacing.section == 32)
        #expect(Theme.Spacing.margin == 24)
        #expect(Theme.controlHeight == 48)
        #expect(Theme.segmentedHeight == 40)
        #expect(Theme.Radius.control == 4)
        #expect(Theme.Radius.sheet == 8)
        #expect(Theme.Grid.threeColumns.count == 3)
    }
}
