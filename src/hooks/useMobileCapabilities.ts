import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Keyboard, KeyboardResize } from '@capacitor/keyboard';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

export function useMobileCapabilities() {
    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        const initMobile = async () => {
            try {
                // 1. Status Bar
                // Set to match typical dark/light mode background
                // You might want to make this dynamic based on theme
                await StatusBar.setStyle({ style: Style.Dark });
                await StatusBar.setOverlaysWebView({ overlay: false }); // Ensure it doesn't overlap completely unless desired
                await StatusBar.setBackgroundColor({ color: '#09090b' }); // Zinc-950

                // 2. Keyboard
                // Resize: Body resizes when keyboard opens (good for messaging)
                await Keyboard.setResizeMode({ mode: KeyboardResize.Body });
                await Keyboard.setScroll({ isDisabled: false });
            } catch (err) {
                console.warn('Mobile capability initialization failed:', err);
            }
        };

        initMobile();
    }, []);

    // Helper for Haptics
    const triggerHaptic = async (style: ImpactStyle = ImpactStyle.Light) => {
        if (!Capacitor.isNativePlatform()) return;
        try {
            await Haptics.impact({ style });
        } catch (err) {
            // Ignore (web or permission issue)
        }
    };

    return {
        triggerHaptic,
        isNative: Capacitor.isNativePlatform()
    };
}
