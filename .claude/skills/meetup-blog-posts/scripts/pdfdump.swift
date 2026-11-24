// Dump every page of a PDF as text (pNN.txt) and a PNG (pNN.png, 1400 px wide). macOS only, no poppler needed.
// Usage: mkdir /tmp/out && cd /tmp/scriptsdir && swift /path/to/pdfdump.swift /path/to/slides.pdf /tmp/out
// Run it from a neutral cwd (not the download dir) and pass paths as arguments.
import Foundation
import PDFKit
import AppKit
let a = CommandLine.arguments
guard a.count == 3, let doc = PDFDocument(url: URL(fileURLWithPath: a[1])) else { print("cannot open"); exit(1) }
let out = a[2]
print("pages:", doc.pageCount)
for i in 0..<doc.pageCount {
    guard let p = doc.page(at: i) else { continue }
    let n = String(format: "%02d", i + 1)
    try? (p.string ?? "").write(toFile: "\(out)/p\(n).txt", atomically: true, encoding: .utf8)
    let b = p.bounds(for: .mediaBox)
    let s = 1400.0 / b.width
    let size = NSSize(width: b.width * s, height: b.height * s)
    let img = p.thumbnail(of: size, for: .mediaBox)
    if let t = img.tiffRepresentation, let r = NSBitmapImageRep(data: t), let png = r.representation(using: .png, properties: [:]) {
        try? png.write(to: URL(fileURLWithPath: "\(out)/p\(n).png"))
    }
}
