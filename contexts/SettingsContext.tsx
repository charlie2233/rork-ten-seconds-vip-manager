import createContextHook from '@nkzw/create-context-hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useMemo, useState } from 'react';

export type AppTheme = 'classic' | 'warm';
export type FontSize = 'sm' | 'md' | 'lg' | 'xl';

const SETTINGS_STORAGE_KEY = 'app_settings_v1';

type StoredSettings = {
  theme?: AppTheme;
  fontSize?: FontSize;
  hideBalance?: boolean;
  soundEnabled?: boolean;
  vibrationEnabled?: boolean;
  biometricEnabled?: boolean;
  reduceMotion?: boolean;
};

const DEFAULT_SETTINGS: Required<StoredSettings> = {
  theme: 'classic',
  fontSize: 'md',
  hideBalance: false,
  soundEnabled: true,
  vibrationEnabled: true,
  biometricEnabled: false,
  reduceMotion: false,
};

const FONT_SCALE: Readonly<Record<FontSize, number>> = {
  sm: 0.92,
  md: 1,
  lg: 1.12,
  xl: 1.24,
};

function safeParseSettings(raw: string | null): StoredSettings | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const value = parsed as StoredSettings;
    return value;
  } catch {
    return null;
  }
}

export const [SettingsProvider, useSettings] = createContextHook(() => {
  const [isLoading, setIsLoading] = useState(true);
  const [theme, setThemeState] = useState<AppTheme>(DEFAULT_SETTINGS.theme);
  const [fontSize, setFontSizeState] = useState<FontSize>(DEFAULT_SETTINGS.fontSize);
  const [hideBalance, setHideBalanceState] = useState<boolean>(DEFAULT_SETTINGS.hideBalance);
  const [soundEnabled, setSoundEnabledState] = useState<boolean>(DEFAULT_SETTINGS.soundEnabled);
  const [vibrationEnabled, setVibrationEnabledState] = useState<boolean>(DEFAULT_SETTINGS.vibrationEnabled);
  const [biometricEnabled, setBiometricEnabledState] = useState<boolean>(DEFAULT_SETTINGS.biometricEnabled);
  const [reduceMotion, setReduceMotionState] = useState<boolean>(DEFAULT_SETTINGS.reduceMotion);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(SETTINGS_STORAGE_KEY);
        const parsed = safeParseSettings(stored);
        if (parsed?.theme) setThemeState(parsed.theme);
        if (parsed?.fontSize) setFontSizeState(parsed.fontSize);
        if (typeof parsed?.hideBalance === 'boolean') setHideBalanceState(parsed.hideBalance);
        if (typeof parsed?.soundEnabled === 'boolean') setSoundEnabledState(parsed.soundEnabled);
        if (typeof parsed?.vibrationEnabled === 'boolean') setVibrationEnabledState(parsed.vibrationEnabled);
        if (typeof parsed?.biometricEnabled === 'boolean') setBiometricEnabledState(parsed.biometricEnabled);
        if (typeof parsed?.reduceMotion === 'boolean') setReduceMotionState(parsed.reduceMotion);
      } catch {
        // ignore
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(
    async (next: Required<StoredSettings>) => {
      try {
        await AsyncStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
    },
    []
  );

  const setTheme = useCallback(
    async (next: AppTheme) => {
      setThemeState(next);
      await persist({ theme: next, fontSize, hideBalance, soundEnabled, vibrationEnabled, biometricEnabled, reduceMotion });
    },
    [fontSize, hideBalance, soundEnabled, vibrationEnabled, biometricEnabled, reduceMotion, persist]
  );

  const toggleTheme = useCallback(async () => {
    await setTheme(theme === 'classic' ? 'warm' : 'classic');
  }, [setTheme, theme]);

  const setFontSize = useCallback(
    async (next: FontSize) => {
      setFontSizeState(next);
      await persist({ theme, fontSize: next, hideBalance, soundEnabled, vibrationEnabled, biometricEnabled, reduceMotion });
    },
    [hideBalance, soundEnabled, vibrationEnabled, biometricEnabled, reduceMotion, persist, theme]
  );

  const setHideBalance = useCallback(
    async (next: boolean) => {
      setHideBalanceState(next);
      await persist({ theme, fontSize, hideBalance: next, soundEnabled, vibrationEnabled, biometricEnabled, reduceMotion });
    },
    [fontSize, soundEnabled, vibrationEnabled, biometricEnabled, reduceMotion, persist, theme]
  );

  const setSoundEnabled = useCallback(
    async (next: boolean) => {
      setSoundEnabledState(next);
      await persist({ theme, fontSize, hideBalance, soundEnabled: next, vibrationEnabled, biometricEnabled, reduceMotion });
    },
    [theme, fontSize, hideBalance, vibrationEnabled, biometricEnabled, reduceMotion, persist]
  );

  const setVibrationEnabled = useCallback(
    async (next: boolean) => {
      setVibrationEnabledState(next);
      await persist({ theme, fontSize, hideBalance, soundEnabled, vibrationEnabled: next, biometricEnabled, reduceMotion });
    },
    [theme, fontSize, hideBalance, soundEnabled, biometricEnabled, reduceMotion, persist]
  );

  const setBiometricEnabled = useCallback(
    async (next: boolean) => {
      setBiometricEnabledState(next);
      await persist({ theme, fontSize, hideBalance, soundEnabled, vibrationEnabled, biometricEnabled: next, reduceMotion });
    },
    [theme, fontSize, hideBalance, soundEnabled, vibrationEnabled, reduceMotion, persist]
  );

  const setReduceMotion = useCallback(
    async (next: boolean) => {
      setReduceMotionState(next);
      await persist({ theme, fontSize, hideBalance, soundEnabled, vibrationEnabled, biometricEnabled, reduceMotion: next });
    },
    [theme, fontSize, hideBalance, soundEnabled, vibrationEnabled, biometricEnabled, persist]
  );

  const fontScale = useMemo(() => FONT_SCALE[fontSize] ?? 1, [fontSize]);

  const backgroundGradient = useMemo(() => {
    if (theme === 'warm') {
      return ['#120C08', '#23160F', '#0D0D0D'] as const;
    }
    return ['#0D0D0D', '#1A1A1A', '#0D0D0D'] as const;
  }, [theme]);

  return {
    isLoading,
    theme,
    toggleTheme,
    setTheme,
    fontSize,
    setFontSize,
    fontScale,
    hideBalance,
    setHideBalance,
    soundEnabled,
    setSoundEnabled,
    vibrationEnabled,
    setVibrationEnabled,
    biometricEnabled,
    setBiometricEnabled,
    reduceMotion,
    setReduceMotion,
    backgroundGradient,
  };
});

