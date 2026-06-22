import React, { useState, useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation/AppNavigator';
import { AuthProvider } from './src/contexts/AuthContext';
import { AlertProvider } from './src/components/AlertDialog';
import { colors } from './src/theme';

const paperTheme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    primaryContainer: 'rgba(10, 132, 255, 0.12)',
    onPrimary: colors.onPrimary,
    secondary: colors.primary,
    secondaryContainer: 'rgba(10, 132, 255, 0.12)',
    background: colors.background.layout,
    surface: colors.background.surface,
    surfaceVariant: colors.background.component,
    error: colors.error,
    errorContainer: 'rgba(176, 0, 32, 0.12)',
    onBackground: colors.text.primary,
    onSurface: colors.text.primary,
    onSurfaceVariant: colors.text.secondary,
    outline: colors.border,
    elevation: {
      level0: colors.elevation.level0,
      level1: colors.elevation.level1,
      level2: colors.elevation.level2,
      level3: colors.elevation.level3,
      level4: colors.elevation.level4,
      level5: colors.elevation.level5,
    },
  },
};

export default function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        setIsReady(true);
      } catch (e) {
        console.error('Init error:', e);
        setIsReady(true);
      }
    };
    init();
  }, []);

  if (!isReady) {
    return null;
  }

  return (
    <AuthProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <SafeAreaProvider>
          <PaperProvider theme={paperTheme}>
            <StatusBar style="dark" />
            <AlertProvider>
              <AppNavigator />
            </AlertProvider>
          </PaperProvider>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    </AuthProvider>
  );
}