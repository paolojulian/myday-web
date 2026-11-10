import UIKit

enum ReceiptImage {
    /// Downscale so the long edge is <= maxDimension, encode JPEG. nil if encoding fails.
    static func prepare(_ image: UIImage, maxDimension: CGFloat = 2048, quality: CGFloat = 0.8) -> Data? {
        let pixelSize = CGSize(width: image.size.width * image.scale, height: image.size.height * image.scale)
        let longEdge = max(pixelSize.width, pixelSize.height)
        guard longEdge > 0 else { return nil }
        let factor = min(1, maxDimension / longEdge)
        let target = CGSize(width: (pixelSize.width * factor).rounded(), height: (pixelSize.height * factor).rounded())
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        format.opaque = true
        let resized = UIGraphicsImageRenderer(size: target, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: target))
        }
        return resized.jpegData(compressionQuality: quality)
    }
}
