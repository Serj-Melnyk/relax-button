import AppKit
import Foundation

struct Target {
    let path: String
    let size: Int
}

let args = CommandLine.arguments
guard args.count >= 2 else {
    fputs("Usage: swift generate_icon_from_reference.swift <source-image>\n", stderr)
    exit(1)
}

let sourcePath = args[1]
let sourceURL = URL(fileURLWithPath: sourcePath)

guard let sourceImage = NSImage(contentsOf: sourceURL) else {
    fputs("Unable to load source image at \(sourcePath)\n", stderr)
    exit(1)
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

func renderSquareImage(from source: NSImage, size: Int) -> NSImage {
    let canvasSize = NSSize(width: size, height: size)
    let image = NSImage(size: canvasSize)
    image.lockFocus()

    NSColor.white.setFill()
    NSBezierPath(rect: NSRect(origin: .zero, size: canvasSize)).fill()

    let sourceSize = source.size
    let scale = min(canvasSize.width / sourceSize.width, canvasSize.height / sourceSize.height)
    let drawSize = NSSize(width: sourceSize.width * scale, height: sourceSize.height * scale)
    let drawOrigin = NSPoint(
        x: (canvasSize.width - drawSize.width) / 2,
        y: (canvasSize.height - drawSize.height) / 2
    )

    source.draw(
        in: NSRect(origin: drawOrigin, size: drawSize),
        from: NSRect(origin: .zero, size: sourceSize),
        operation: .copy,
        fraction: 1
    )

    image.unlockFocus()
    return image
}

func pngData(for image: NSImage) -> Data? {
    guard
        let tiffData = image.tiffRepresentation,
        let bitmap = NSBitmapImageRep(data: tiffData)
    else {
        return nil
    }
    return bitmap.representation(using: .png, properties: [:])
}

for target in targets {
    let image = renderSquareImage(from: sourceImage, size: target.size)
    guard let data = pngData(for: image) else {
        fputs("Unable to encode PNG for \(target.path)\n", stderr)
        exit(1)
    }
    let url = URL(fileURLWithPath: target.path)
    try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    try data.write(to: url, options: .atomic)
    print("Wrote \(target.path)")
}
