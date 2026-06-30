import Foundation
import Capacitor
import CoreHaptics
import UIKit
import AVFoundation

@objc(NativeHapticPlugin)
public class NativeHapticPlugin: CAPPlugin {
    private var hapticEngine: CHHapticEngine?
    private let audioEngine = AVAudioEngine()
    private let playerNode = AVAudioPlayerNode()
    private var loopBuffer: AVAudioPCMBuffer?
    private var currentFile: String?
    private var currentVolume: Float = 0.72
    private var sleepTimer: Timer?

    public override func load() {
        super.load()
        configureAudioEngineIfNeeded()
    }

    @objc func playPremiumClick(_ call: CAPPluginCall) {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else {
            let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)
            feedbackGenerator.impactOccurred()
            call.resolve()
            return
        }

        if hapticEngine == nil {
            do {
                hapticEngine = try CHHapticEngine()
                try hapticEngine?.start()
            } catch {
                let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)
                feedbackGenerator.impactOccurred()
                call.resolve()
                return
            }
        }

        let intensity = CHHapticEventParameter(parameterID: .hapticIntensity, value: 0.85)
        let sharpness = CHHapticEventParameter(parameterID: .hapticSharpness, value: 0.90)
        let transientEvent = CHHapticEvent(
            eventType: .hapticTransient,
            parameters: [intensity, sharpness],
            relativeTime: 0
        )

        do {
            let pattern = try CHHapticPattern(events: [transientEvent], parameters: [])
            let player = try hapticEngine?.makePlayer(with: pattern)
            try player?.start(atTime: CHHapticTimeImmediate)
            call.resolve()
        } catch {
            let feedbackGenerator = UIImpactFeedbackGenerator(style: .medium)
            feedbackGenerator.impactOccurred()
            call.resolve()
        }
    }

    @objc func playPremiumRelease(_ call: CAPPluginCall) {
        call.resolve()
    }

    @objc func playHaptic(_ call: CAPPluginCall) {
        let style = call.getString("style", "light")
        let generator: UIImpactFeedbackGenerator
        switch style {
        case "heavy":
            generator = UIImpactFeedbackGenerator(style: .heavy)
        case "medium":
            generator = UIImpactFeedbackGenerator(style: .medium)
        default:
            generator = UIImpactFeedbackGenerator(style: .light)
        }
        generator.impactOccurred()
        call.resolve()
    }

    @objc func startNoiseLoop(_ call: CAPPluginCall) {
        guard let file = call.getString("file"), !file.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            call.reject("Missing audio file")
            return
        }

        let gain = Float(call.getDouble("gain", 0.72))
        let loopStartMs = max(0, call.getInt("loopStartMs", 0))
        let loopEndTrimMs = max(0, call.getInt("loopEndTrimMs", 0))

        DispatchQueue.main.async {
            do {
                try self.startNoiseLoopInternal(file: file, gain: gain, loopStartMs: loopStartMs, loopEndTrimMs: loopEndTrimMs)
                call.resolve()
            } catch {
                call.reject("Unable to start native noise loop", nil, error)
            }
        }
    }

    @objc func stopNoiseLoop(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.stopNoiseLoopInternal()
            call.resolve()
        }
    }

    @objc func setNoiseVolume(_ call: CAPPluginCall) {
        let gain = Float(call.getDouble("gain", 0.0))
        DispatchQueue.main.async {
            self.currentVolume = max(0, min(1, gain))
            self.playerNode.volume = self.currentVolume
            call.resolve()
        }
    }

    @objc func setNoiseSleepTimer(_ call: CAPPluginCall) {
        let durationMs = max(0.0, call.getDouble("durationMs", 0.0))
        DispatchQueue.main.async {
            self.sleepTimer?.invalidate()
            self.sleepTimer = nil
            if durationMs > 0 {
                self.sleepTimer = Timer.scheduledTimer(withTimeInterval: durationMs / 1000.0, repeats: false) { [weak self] _ in
                    self?.stopNoiseLoopInternal()
                }
            }
            call.resolve()
        }
    }

    @objc func clearNoiseSleepTimer(_ call: CAPPluginCall) {
        DispatchQueue.main.async {
            self.sleepTimer?.invalidate()
            self.sleepTimer = nil
            call.resolve()
        }
    }

    @objc func setKeepAwake(_ call: CAPPluginCall) {
        let enabled = call.getBool("enabled", false)
        DispatchQueue.main.async {
            UIApplication.shared.isIdleTimerDisabled = enabled
            call.resolve()
        }
    }

    @objc func getNoiseLoopState(_ call: CAPPluginCall) {
        let result = JSObject()
        result["isPlaying"] = playerNode.isPlaying && currentFile != nil
        result["file"] = currentFile
        result["volume"] = currentVolume
        call.resolve(result)
    }

    private func configureAudioEngineIfNeeded() {
        guard audioEngine.attachedNodes.contains(playerNode) == false else { return }
        audioEngine.attach(playerNode)
        audioEngine.connect(playerNode, to: audioEngine.mainMixerNode, format: nil)
        audioEngine.mainMixerNode.outputVolume = 1.0
    }

    private func startNoiseLoopInternal(file: String, gain: Float, loopStartMs: Int, loopEndTrimMs: Int) throws {
        configureAudioEngineIfNeeded()

        let session = AVAudioSession.sharedInstance()
        try session.setCategory(.playback, mode: .default, options: [.mixWithOthers])
        try session.setActive(true)

        let buffer = try makeLoopBuffer(file: file, loopStartMs: loopStartMs, loopEndTrimMs: loopEndTrimMs)
        if audioEngine.isRunning == false {
            try audioEngine.start()
        }

        playerNode.stop()
        playerNode.reset()
        loopBuffer = buffer
        currentFile = file
        currentVolume = max(0, min(1, gain))
        playerNode.volume = currentVolume
        playerNode.scheduleBuffer(buffer, at: nil, options: [.loops], completionHandler: nil)
        playerNode.play()
    }

    private func stopNoiseLoopInternal() {
        sleepTimer?.invalidate()
        sleepTimer = nil
        playerNode.stop()
        playerNode.reset()
        loopBuffer = nil
        currentFile = nil
        do {
            try AVAudioSession.sharedInstance().setActive(false, options: [.notifyOthersOnDeactivation])
        } catch {
        }
    }

    private func makeLoopBuffer(file: String, loopStartMs: Int, loopEndTrimMs: Int) throws -> AVAudioPCMBuffer {
        guard let baseURL = Bundle.main.resourceURL else {
            throw NSError(domain: "NativeHapticPlugin", code: 1, userInfo: [NSLocalizedDescriptionKey: "Bundle URL unavailable"])
        }

        let fileURL = baseURL.appendingPathComponent("public").appendingPathComponent(file)
        let audioFile = try AVAudioFile(forReading: fileURL)
        let format = audioFile.processingFormat
        let frameCount = AVAudioFrameCount(audioFile.length)

        guard let sourceBuffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: frameCount) else {
            throw NSError(domain: "NativeHapticPlugin", code: 2, userInfo: [NSLocalizedDescriptionKey: "Unable to allocate source buffer"])
        }

        try audioFile.read(into: sourceBuffer)

        let sampleRate = format.sampleRate
        let startFrame = max(0, min(Int64((Double(loopStartMs) / 1000.0) * sampleRate), Int64(sourceBuffer.frameLength)))
        let trimFrames = max(0, Int64((Double(loopEndTrimMs) / 1000.0) * sampleRate))
        let endFrame = max(startFrame + 1, Int64(sourceBuffer.frameLength) - trimFrames)
        let framesToCopy = AVAudioFrameCount(max(1, min(Int64(sourceBuffer.frameLength), endFrame) - startFrame))

        guard let clippedBuffer = AVAudioPCMBuffer(pcmFormat: format, frameCapacity: framesToCopy) else {
            throw NSError(domain: "NativeHapticPlugin", code: 3, userInfo: [NSLocalizedDescriptionKey: "Unable to allocate clipped buffer"])
        }

        clippedBuffer.frameLength = framesToCopy
        try copyFrames(from: sourceBuffer, to: clippedBuffer, startFrame: Int(startFrame), frameCount: Int(framesToCopy))
        return clippedBuffer
    }

    private func copyFrames(from source: AVAudioPCMBuffer, to destination: AVAudioPCMBuffer, startFrame: Int, frameCount: Int) throws {
        let channelCount = Int(source.format.channelCount)

        if let sourceData = source.floatChannelData, let destinationData = destination.floatChannelData {
            for channel in 0..<channelCount {
                destinationData[channel].assign(from: sourceData[channel].advanced(by: startFrame), count: frameCount)
            }
            return
        }

        if let sourceData = source.int16ChannelData, let destinationData = destination.int16ChannelData {
            for channel in 0..<channelCount {
                destinationData[channel].assign(from: sourceData[channel].advanced(by: startFrame), count: frameCount)
            }
            return
        }

        if let sourceData = source.int32ChannelData, let destinationData = destination.int32ChannelData {
            for channel in 0..<channelCount {
                destinationData[channel].assign(from: sourceData[channel].advanced(by: startFrame), count: frameCount)
            }
            return
        }

        throw NSError(domain: "NativeHapticPlugin", code: 4, userInfo: [NSLocalizedDescriptionKey: "Unsupported PCM buffer layout"])
    }
}
