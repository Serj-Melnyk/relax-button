#import <Capacitor/Capacitor.h>

CAP_PLUGIN(NativeHapticPlugin, "NativeHapticPlugin",
    CAP_PLUGIN_METHOD(playPremiumClick, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(playPremiumRelease, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(playHaptic, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(startNoiseLoop, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(stopNoiseLoop, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setNoiseVolume, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setNoiseSleepTimer, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(clearNoiseSleepTimer, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(setKeepAwake, CAPPluginReturnPromise);
    CAP_PLUGIN_METHOD(getNoiseLoopState, CAPPluginReturnPromise);
)
