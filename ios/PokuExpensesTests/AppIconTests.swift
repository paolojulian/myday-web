import Foundation
import Testing
import UIKit

/// Requirement 14: the generated app icon exists at 1024×1024, opaque, and the catalog points at it.
struct AppIconTests {
    static let iconSet = URL(fileURLWithPath: #filePath)
        .deletingLastPathComponent().deletingLastPathComponent()
        .appendingPathComponent("PokuExpenses/Resources/Assets.xcassets/AppIcon.appiconset")

    @Test func iconIsAnOpaque1024PixelSquare() throws {
        let data = try Data(contentsOf: Self.iconSet.appendingPathComponent("icon-1024.png"))
        let image = try #require(UIImage(data: data)?.cgImage)
        #expect(image.width == 1024 && image.height == 1024)
        let alpha = image.alphaInfo
        #expect([.none, .noneSkipLast, .noneSkipFirst].contains(alpha))
    }

    @Test func catalogNamesTheSingleSizeIcon() throws {
        let data = try Data(contentsOf: Self.iconSet.appendingPathComponent("Contents.json"))
        let json = try #require(try JSONSerialization.jsonObject(with: data) as? [String: Any])
        let images = try #require(json["images"] as? [[String: Any]])
        #expect(images.count == 1)
        #expect(images[0]["filename"] as? String == "icon-1024.png")
        #expect(images[0]["size"] as? String == "1024x1024")
    }
}
