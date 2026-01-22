import { useEffect, useState, useCallback, useRef } from 'react';

export interface AntiCheatConfig {
    enableFullscreen: boolean;
    enableCopyProtection: boolean;
    enableTabSwitchDetection: boolean;
    maxViolations: number;
    onViolation: (type: ViolationType, count: number) => void;
    onMaxViolationsReached: () => void;
}

export type ViolationType = 'tab_switch' | 'fullscreen_exit' | 'copy_attempt' | 'devtools_open';

export interface AntiCheatState {
    isFullscreen: boolean;
    tabSwitchCount: number;
    fullscreenExitCount: number;
    copyAttemptCount: number;
    totalViolations: number;
    isLocked: boolean;
}

export function useAntiCheat(config: AntiCheatConfig) {
    const [state, setState] = useState<AntiCheatState>({
        isFullscreen: false,
        tabSwitchCount: 0,
        fullscreenExitCount: 0,
        copyAttemptCount: 0,
        totalViolations: 0,
        isLocked: false,
    });

    const isQuizActiveRef = useRef(true);

    // Track total violations
    const incrementViolation = useCallback((type: ViolationType) => {
        setState(prev => {
            const newState = { ...prev };

            switch (type) {
                case 'tab_switch':
                    newState.tabSwitchCount++;
                    break;
                case 'fullscreen_exit':
                    newState.fullscreenExitCount++;
                    break;
                case 'copy_attempt':
                    newState.copyAttemptCount++;
                    break;
            }

            newState.totalViolations++;

            // Call violation callback
            config.onViolation(type, newState.totalViolations);

            // Check if max violations reached
            if (newState.totalViolations >= config.maxViolations) {
                newState.isLocked = true;
                config.onMaxViolationsReached();
            }

            return newState;
        });
    }, [config]);

    // Enter fullscreen
    const enterFullscreen = useCallback(async () => {
        if (!config.enableFullscreen) return;

        try {
            await document.documentElement.requestFullscreen();
        } catch (err) {
            console.error('Error entering fullscreen:', err);
        }
    }, [config.enableFullscreen]);

    // Exit fullscreen
    const exitFullscreen = useCallback(async () => {
        try {
            if (document.fullscreenElement) {
                await document.exitFullscreen();
            }
        } catch (err) {
            console.error('Error exiting fullscreen:', err);
        }
    }, []);

    // Fullscreen change handler
    useEffect(() => {
        if (!config.enableFullscreen) return;

        const handleFullscreenChange = () => {
            const isNowFullscreen = !!document.fullscreenElement;
            setState(prev => ({ ...prev, isFullscreen: isNowFullscreen }));

            // Track fullscreen exits only when quiz is active
            if (!isNowFullscreen && isQuizActiveRef.current && state.isFullscreen) {
                incrementViolation('fullscreen_exit');
            }
        };

        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [config.enableFullscreen, incrementViolation, state.isFullscreen]);

    // Visibility change handler (tab switching)
    useEffect(() => {
        if (!config.enableTabSwitchDetection) return;

        const handleVisibilityChange = () => {
            if (document.hidden && isQuizActiveRef.current) {
                incrementViolation('tab_switch');
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [config.enableTabSwitchDetection, incrementViolation]);

    // Window blur handler (alt-tab / click outside)
    useEffect(() => {
        if (!config.enableTabSwitchDetection) return;

        const handleBlur = () => {
            if (isQuizActiveRef.current) {
                incrementViolation('tab_switch');
            }
        };

        window.addEventListener('blur', handleBlur);
        return () => window.removeEventListener('blur', handleBlur);
    }, [config.enableTabSwitchDetection, incrementViolation]);

    // Copy protection
    useEffect(() => {
        if (!config.enableCopyProtection) return;

        const preventCopy = (e: ClipboardEvent) => {
            e.preventDefault();
            incrementViolation('copy_attempt');
        };

        const preventContextMenu = (e: MouseEvent) => {
            e.preventDefault();
        };

        const preventKeyboardShortcuts = (e: KeyboardEvent) => {
            // Block common shortcuts
            if (
                (e.ctrlKey || e.metaKey) &&
                ['c', 'x', 'a', 's', 'p', 'u'].includes(e.key.toLowerCase())
            ) {
                e.preventDefault();
                if (e.key.toLowerCase() === 'c') {
                    incrementViolation('copy_attempt');
                }
            }

            // Block F12, Ctrl+Shift+I, Ctrl+Shift+J (DevTools)
            if (
                e.key === 'F12' ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && ['i', 'j', 'c'].includes(e.key.toLowerCase()))
            ) {
                e.preventDefault();
            }

            // Block Alt+Tab, Cmd+Tab (best effort - may not work)
            if (e.altKey && e.key === 'Tab') {
                e.preventDefault();
            }
        };

        // Block text selection
        const preventSelection = (e: Event) => {
            e.preventDefault();
            return false;
        };

        document.addEventListener('copy', preventCopy);
        document.addEventListener('cut', preventCopy);
        document.addEventListener('contextmenu', preventContextMenu);
        document.addEventListener('keydown', preventKeyboardShortcuts);
        document.addEventListener('selectstart', preventSelection);

        return () => {
            document.removeEventListener('copy', preventCopy);
            document.removeEventListener('cut', preventCopy);
            document.removeEventListener('contextmenu', preventContextMenu);
            document.removeEventListener('keydown', preventKeyboardShortcuts);
            document.removeEventListener('selectstart', preventSelection);
        };
    }, [config.enableCopyProtection, incrementViolation]);

    // Prevent page unload
    useEffect(() => {
        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            if (isQuizActiveRef.current) {
                e.preventDefault();
                e.returnValue = 'Are you sure you want to leave? Your quiz progress may be lost.';
                return e.returnValue;
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // Set quiz active state
    const setQuizActive = useCallback((active: boolean) => {
        isQuizActiveRef.current = active;
    }, []);

    return {
        state,
        enterFullscreen,
        exitFullscreen,
        setQuizActive,
    };
}
