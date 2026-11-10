import SwiftUI

/// A 1pt strong rule, then a label line with an optional right-aligned value.
/// Callers put `Theme.Spacing.section` above it (`block` when first under the header row).
struct SectionRule: View {
    let label: String
    let trailing: String?

    init(_ label: String, trailing: String? = nil) {
        self.label = label
        self.trailing = trailing
    }

    var body: some View {
        VStack(alignment: .leading, spacing: Theme.Spacing.gutter) {
            Rectangle().fill(Theme.Colors.borderStrong).frame(height: Theme.hairline)
            HStack(alignment: .firstTextBaseline, spacing: Theme.Spacing.block) {
                Text(label).themeLabel(color: Theme.Colors.text)
                Spacer(minLength: 0)
                if let trailing {
                    Text(trailing)
                        .font(Theme.Fonts.small.bold())
                        .monospacedDigit()
                        .foregroundStyle(Theme.Colors.text)
                }
            }
        }
        .accessibilityElement(children: .combine)
        .accessibilityAddTraits(.isHeader)
    }
}

#Preview {
    VStack {
        SectionRule("Today", trailing: "₱1,250")
        SectionRule("Earlier")
    }
    .screenMargins()
}
