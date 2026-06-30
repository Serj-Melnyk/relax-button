import AppKit
import Foundation

struct Target {
    let path: String
    let size: Int
}

let targets: [Target] = [
    .init(path: "android/app/src/main/res/mipmap-mdpi/ic_launcher.png", size: 96),
    .init(path: "android/app/src/main/res/mipmap-mdpi/ic_launcher_round.png", size: 96),
    .init(path: "android/app/src/main/res/mipmap-mdpi/ic_launcher_foreground.png", size: 216),
    .init(path: "android/app/src/main/res/mipmap-hdpi/ic_launcher.png", size: 144),
    .init(path: "android/app/src/main/res/mipmap-hdpi/ic_launcher_round.png", size: 144),
    .init(path: "android/app/src/main/res/mipmap-hdpi/ic_launcher_foreground.png", size: 324),
    .init(path: "android/app/src/main/res/mipmap-xhdpi/ic_launcher.png", size: 192),
    .init(path: "android/app/src/main/res/mipmap-xhdpi/ic_launcher_round.png", size: 192),
    .init(path: "android/app/src/main/res/mipmap-xhdpi/ic_launcher_foreground.png", size: 432),
    .init(path: "android/app/src/main/res/mipmap-xxhdpi/ic_launcher.png", size: 288),
    .init(path: "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_round.png", size: 288),
    .init(path: "android/app/src/main/res/mipmap-xxhdpi/ic_launcher_foreground.png", size: 648),
    .init(path: "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher.png", size: 384),
    .init(path: "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_round.png", size: 384),
    .init(path: "android/app/src/main/res/mipmap-xxxhdpi/ic_launcher_foreground.png", size: 864),
    .init(path: "release/google-play/icon-512.png", size: 512),
    .init(path: "ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png", size: 1024),
]

func drawShadowedCircle(path: NSBezierPath, color: NSColor, shadowColor: NSColor, offset: NSSize, blur: CGFloat) {
    NSGraphicsContext.saveGraphicsState()
    let shadow = NSShadow()
    shadow.shadowColor = shadowColor
    shadow.shadowOffset = offset
    shadow.shadowBlurRadius = blur
    shadow.set()
    color.setFill()
    path.fill()
    NSGraphicsContext.restoreGraphicsState()
}

func renderIcon(size: Int) -> Data? {
    let dimension = CGFloat(size)
    guard let bitmap = NSBitmapImageRep(
        bitmapDataPlanes: nil,
        pixelsWide: size,
        pixelsHigh: size,
        bitsPerSample: 8,
        samplesPerPixel: 4,
        hasAlpha: true,
        isPlanar: false,
        colorSpaceName: .deviceRGB,
        bytesPerRow: 0,
        bitsPerPixel: 0
    ) else {
        return nil
    }

    bitmap.size = NSSize(width: dimension, height: dimension)
    NSGraphicsContext.saveGraphicsState()
    guard let context = NSGraphicsContext(bitmapImageRep: bitmap) else {
        NSGraphicsContext.restoreGraphicsState()
        return nil
    }
    NSGraphicsContext.current = context

    NSColor.white.setFill()
    NSBezierPath(rect: NSRect(x: 0, y: 0, width: dimension, height: dimension)).fill()

    let center = NSPoint(x: dimension / 2, y: dimension / 2)
    let outerRadius = dimension * 0.278
    let innerRadius = dimension * 0.118

    let outerRect = NSRect(
        x: center.x - outerRadius,
        y: center.y - outerRadius,
        width: outerRadius * 2,
        height: outerRadius * 2
    )
    let outerPath = NSBezierPath(ovalIn: outerRect)

    drawShadowedCircle(
        path: outerPath,
        color: NSColor(calibratedRed: 0.898, green: 0.906, blue: 0.914, alpha: 1),
        shadowColor: NSColor(calibratedRed: 0.745, green: 0.761, blue: 0.780, alpha: 0.62),
        offset: NSSize(width: dimension * 0.06, height: -dimension * 0.06),
        blur: dimension * 0.09
    )
    drawShadowedCircle(
        path: outerPath,
        color: NSColor(calibratedRed: 0.898, green: 0.906, blue: 0.914, alpha: 1),
        shadowColor: NSColor(calibratedWhite: 1, alpha: 0.98),
        offset: NSSize(width: -dimension * 0.038, height: dimension * 0.038),
        blur: dimension * 0.065
    )

    NSColor(calibratedRed: 0.396, green: 0.314, blue: 0.667, alpha: 1).setFill()
    let innerRect = NSRect(
        x: center.x - innerRadius,
        y: center.y - innerRadius,
        width: innerRadius * 2,
        height: innerRadius * 2
    )
    NSBezierPath(ovalIn: innerRect).fill()

    NSGraphicsContext.restoreGraphicsState()
    return bitmap.representation(using: .png, properties: [:])
}

for target in targets {
    guard let data = renderIcon(size: target.size) else {
        fputs("Unable to encode PNG for \(target.path)\n", stderr)
        exit(1)
    }
    let url = URL(fileURLWithPath: target.path)
    try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    try data.write(to: url, options: .atomic)
    print("Wrote \(target.path)")
}
