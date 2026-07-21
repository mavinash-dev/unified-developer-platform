#!/usr/bin/env swift
import Vision
import AppKit

guard CommandLine.arguments.count > 1 else {
    fputs("Usage: swift ocr.swift <image-path>\n", stderr)
    exit(1)
}

let path = CommandLine.arguments[1]
guard let image = NSImage(contentsOfFile: path),
      let cgImage = image.cgImage(forProposedRect: nil, context: nil, hints: nil) else {
    fputs("Failed to load image at: \(path)\n", stderr)
    exit(1)
}

let request = VNRecognizeTextRequest()
request.recognitionLevel = .accurate
request.usesLanguageCorrection = true
request.automaticallyDetectsLanguage = true

let handler = VNImageRequestHandler(cgImage: cgImage, options: [:])
do {
    try handler.perform([request])
} catch {
    fputs("Vision error: \(error)\n", stderr)
    exit(1)
}

let lines = (request.results ?? [])
    .compactMap { $0.topCandidates(1).first?.string }

print(lines.joined(separator: "\n"))
