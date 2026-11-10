import SwiftUI
import UIKit

/// The ONLY place colour, spacing, radius and font values appear (design §7, requirement 10).
enum Theme {
    enum Colors {
        static let background = Color(light: 0xfafaf9, dark: 0x111111)
        static let surface = Color(light: 0xffffff, dark: 0x1c1917)
        static let surfaceSubtle = Color(light: 0xf5f5f4, dark: 0x292524)
        static let text = Color(light: 0x111111, dark: 0xffffff)
        static let textMuted = Color(light: 0x57534e, dark: 0xd6d3d1)
        static let textSubtle = Color(light: 0x78716c, dark: 0xa8a29e)
        static let border = Color(light: 0xd6d3d1, dark: 0x44403c)
        static let borderSubtle = Color(light: 0xe7e5e4, dark: 0x292524)
        static let borderStrong = Color(light: 0x292524, dark: 0xd6d3d1)
        static let inverse = Color(light: 0x111111, dark: 0xffffff)
        static let onInverse = Color(light: 0xffffff, dark: 0x111111)
        static let accent = Color(light: 0xb63f4c, dark: 0xf07f8b)
        static let onAccent = Color(light: 0xffffff, dark: 0x111111)
        static let danger = Color(light: 0xdc2626, dark: 0xf87171)
        static let success = Color(light: 0x15803d, dark: 0x4ade80)
        static let warning = Color(light: 0xd97706, dark: 0xfbbf24)
        /// The track under a selected chip's bar (mockup: 50% grey).
        static let trackOnInverse = Color(UIColor.gray.withAlphaComponent(0.5))
    }

    /// Seven steps on a 4pt baseline; each has one job (design §7 table).
    enum Spacing {
        static let tight: CGFloat = 4
        static let gutter: CGFloat = 8
        static let row: CGFloat = 12
        static let block: CGFloat = 16
        static let field: CGFloat = 24
        static let section: CGFloat = 32
        static let margin: CGFloat = 24
    }

    enum Radius {
        static let control: CGFloat = 4
        static let sheet: CGFloat = 8
    }

    enum Grid {
        static var threeColumns: [GridItem] {
            Array(repeating: GridItem(.flexible(), spacing: Spacing.gutter), count: 3)
        }
    }

    /// Buttons, stepper, choice cells, list rows' minimum height.
    static let controlHeight: CGFloat = 48
    static let segmentedHeight: CGFloat = 40
    /// Minimum width of the stepper's middle label (mockup: 120).
    static let stepperLabelWidth: CGFloat = 120
    /// The square in front of a status word.
    static let statusMark: CGFloat = 6
    /// Thin rules and progress bars.
    static let hairline: CGFloat = 1
    static let barHeight: CGFloat = 2
    /// Receipt thumbnail.
    static let thumbnail: CGFloat = 52
    static let labelTracking: CGFloat = 0.8

    /// System font scaled with Dynamic Type through `UIFontMetrics`. Computed so that each body
    /// evaluation picks up the current content size.
    enum Fonts {
        static var display: Font { scaled(40, .bold, .largeTitle) }
        static var title: Font { scaled(24, .bold, .title2) }
        static var body: Font { scaled(16, .regular, .body) }
        static var bodyStrong: Font { scaled(16, .medium, .body) }
        static var amount: Font { scaled(16, .bold, .body) }
        static var small: Font { scaled(14, .regular, .subheadline) }
        static var caption: Font { scaled(12, .regular, .caption1) }
        /// Use through `.themeLabel()` (uppercased, tracked).
        static var label: Font { scaled(11, .medium, .caption2) }
        /// Large amount input in sheets and the form.
        static var input: Font { scaled(28, .bold, .title1) }

        private static func scaled(_ size: CGFloat, _ weight: UIFont.Weight, _ style: UIFont.TextStyle) -> Font {
            let base = UIFont.systemFont(ofSize: size, weight: weight)
            return Font(UIFontMetrics(forTextStyle: style).scaledFont(for: base))
        }
    }
}

extension Color {
    /// A colour that follows light/dark mode, from 0xRRGGBB values.
    init(light: UInt32, dark: UInt32) {
        self.init(UIColor { traits in
            UIColor(rgb: traits.userInterfaceStyle == .dark ? dark : light)
        })
    }
}

private extension UIColor {
    convenience init(rgb: UInt32) {
        self.init(red: CGFloat((rgb >> 16) & 0xff) / 255,
                  green: CGFloat((rgb >> 8) & 0xff) / 255,
                  blue: CGFloat(rgb & 0xff) / 255,
                  alpha: 1)
    }
}

extension View {
    /// The one tracked style: 11 medium, uppercased.
    func themeLabel(color: Color = Theme.Colors.textSubtle) -> some View {
        font(Theme.Fonts.label)
            .tracking(Theme.labelTracking)
            .textCase(.uppercase)
            .foregroundStyle(color)
    }

    /// Left and right screen edge.
    func screenMargins() -> some View {
        padding(.horizontal, Theme.Spacing.margin)
    }

    /// A List row laid out like the rest of the app: screen margins, no system separator or inset.
    func plainListRow() -> some View {
        listRowInsets(EdgeInsets(top: 0, leading: Theme.Spacing.margin, bottom: 0, trailing: Theme.Spacing.margin))
            .listRowSeparator(.hidden)
            .listRowBackground(Theme.Colors.background)
    }

    /// A 1pt line under a row.
    func rowDivider(_ color: Color = Theme.Colors.borderSubtle) -> some View {
        overlay(alignment: .bottom) {
            Rectangle().fill(color).frame(height: Theme.hairline)
        }
    }
}
