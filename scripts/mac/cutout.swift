// cutout.swift — local background removal with Apple Vision (macOS 14+). Usage: swift cutout.swift in.jpg out.png
import Foundation
import Vision
import CoreImage
import AppKit
let args = CommandLine.arguments
guard args.count >= 3, let ci = CIImage(contentsOf: URL(fileURLWithPath: args[1])) else { print("usage: cutout in out"); exit(2) }
let req = VNGenerateForegroundInstanceMaskRequest()
let handler = VNImageRequestHandler(ciImage: ci, options: [:])
try handler.perform([req])
guard let result = req.results?.first else { print("no foreground found"); exit(1) }
let maskPB = try result.generateMaskedImage(ofInstances: result.allInstances, from: handler, croppedToInstancesExtent: true)
let out = CIImage(cvPixelBuffer: maskPB)
let ctx = CIContext()
let rep = NSBitmapImageRep(ciImage: out)
guard let png = rep.representation(using: .png, properties: [:]) else { print("encode failed"); exit(1) }
try png.write(to: URL(fileURLWithPath: args[2]))
print("wrote \(args[2]) \(Int(out.extent.width))x\(Int(out.extent.height))")
