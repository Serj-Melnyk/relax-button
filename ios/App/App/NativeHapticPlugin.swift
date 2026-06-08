import Foundation
import Capacitor
import CoreHaptics
import UIKit

@objc(NativeHapticPlugin)
public class NativeHapticPlugin: CAPPlugin {
    private var hapticEngine: CHHapticEngine?

    @objc func playPremiumClick(_ call: CAPPluginCall) {
        guard CHHapticEngine.capabilitiesForHardware().supportsHaptics else {
            // Fallback to legacy Taptic Engine
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

        // Dry, metallic tactile click (sharpness 0.90, intensity 0.85)
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
}
