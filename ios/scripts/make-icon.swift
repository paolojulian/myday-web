#!/usr/bin/env swift
// Draws the 1024×1024 app icon: warm white ground, a bold ink "₱" centred on an eighths grid,
// and the brand-red square one eighth wide, inset one eighth from the top-right corner.
// Usage (from any cwd): swift ios/scripts/make-icon.swift
// Writes ios/PokuExpenses/Resources/Assets.xcassets/AppIcon.appiconset/icon-1024.png (opaque, no alpha).
import CoreGraphics
import CoreText
import Foundation
import ImageIO
import UniformTypeIdentifiers

let size = 1024
let unit = CGFloat(size) / 8          // the grid: 128pt eighths

func color(_ rgb: UInt32) -> CGColor {
    CGColor(srgbRed: CGFloat((rgb >> 16) & 0xff) / 255,
            green: CGFloat((rgb >> 8) & 0xff) / 255,
            blue: CGFloat(rgb & 0xff) / 255,
            alpha: 1)
}

let background = color(0xfafaf9)
let ink = color(0x111111)
let accent = color(0xb63f4c)

guard let context = CGContext(data: nil, width: size, height: size, bitsPerComponent: 8, bytesPerRow: 0,
                              space: CGColorSpace(name: CGColorSpace.sRGB)!,
                              bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue) else {
    fatalError("Could not create the drawing context")
}

// Ground.
context.setFillColor(background)
context.fill(CGRect(x: 0, y: 0, width: size, height: size))

// "₱": the glyph's outline is scaled so its height spans four eighths, then centred on the canvas.
let baseFont = CTFontCreateUIFontForLanguage(.emphasizedSystem, 200, nil)!
let font = CTFontCreateCopyWithSymbolicTraits(baseFont, 200, nil, .traitBold, .traitBold) ?? baseFont
var character: UniChar = 0x20B1
var glyph: CGGlyph = 0
guard CTFontGetGlyphsForCharacters(font, &character, &glyph, 1), let outline = CTFontCreatePathForGlyph(font, glyph, nil) else {
    fatalError("The system font has no ₱ glyph")
}
let bounds = outline.boundingBoxOfPath
let scale = (unit * 4) / bounds.height
var transform = CGAffineTransform(translationX: CGFloat(size) / 2, y: CGFloat(size) / 2)
    .scaledBy(x: scale, y: scale)
    .translatedBy(x: -bounds.midX, y: -bounds.midY)
guard let placed = outline.copy(using: &transform) else { fatalError("Could not place the glyph") }
context.setFillColor(ink)
context.addPath(placed)
context.fillPath()

// Brand square: one eighth wide, one eighth in from the top and right edges (CG's origin is bottom-left).
context.setFillColor(accent)
context.fill(CGRect(x: CGFloat(size) - unit * 2, y: CGFloat(size) - unit * 2, width: unit, height: unit))

guard let image = context.makeImage() else { fatalError("Could not render the icon") }

let output = URL(fileURLWithPath: #filePath)
    .deletingLastPathComponent().deletingLastPathComponent()
    .appendingPathComponent("PokuExpenses/Resources/Assets.xcassets/AppIcon.appiconset/icon-1024.png")
guard let destination = CGImageDestinationCreateWithURL(output as CFURL, UTType.png.identifier as CFString, 1, nil) else {
    fatalError("Could not open \(output.path)")
}
CGImageDestinationAddImage(destination, image, nil)
guard CGImageDestinationFinalize(destination) else { fatalError("Could not write \(output.path)") }
print("Wrote \(output.path)")
