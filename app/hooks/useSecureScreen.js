import { useEffect } from 'react';
import { Platform } from 'react-native';

// For Expo managed workflow: expo-screen-capture is not in dependencies. We can implement a soft fallback.
// Add expo-screen-capture if stronger enforcement is required: expo install expo-screen-capture
// This hook attempts to:
// 1. Reduce risk by setting Android FLAG_SECURE via a dynamic import if available (custom native module could be added later)
// 2. Listen for screen capture events (iOS) if we add expo-screen-capture
// Currently, we provide placeholder logic and instructions.

export const useSecureScreen = () => {
  useEffect(() => {
    let removeListener = null;

    const enable = async () => {
      try {
        // Attempt dynamic import of expo-screen-capture if installed
        let ScreenCapture;
        try {
          ScreenCapture = require('expo-screen-capture');
        } catch {}

        if (ScreenCapture?.preventScreenCaptureAsync) {
          await ScreenCapture.preventScreenCaptureAsync();
          // Optional listener for user attempts (only works if lib installed)
          if (ScreenCapture.addScreenshotListener) {
            removeListener = ScreenCapture.addScreenshotListener(() => {
              console.log('[secure-screen] Screenshot attempt detected');
            });
          }
        } else {
          console.log('[secure-screen] expo-screen-capture not installed; soft mode only');
        }
      } catch (e) {
        console.warn('[secure-screen] enable failed', e);
      }
    };

    enable();

    return () => {
      (async () => {
        try {
          let ScreenCapture;
          try { ScreenCapture = require('expo-screen-capture'); } catch {}
          if (ScreenCapture?.allowScreenCaptureAsync) {
            await ScreenCapture.allowScreenCaptureAsync();
          }
          if (removeListener) {
            try { removeListener.remove(); } catch {}
          }
        } catch (e) {
          console.warn('[secure-screen] disable failed', e);
        }
      })();
    };
  }, []);
};

export default useSecureScreen;
