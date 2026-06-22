import React, { createContext, useContext, useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Portal, Modal } from 'react-native-paper';
import { colors, spacing } from '../theme';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertOptions {
  title: string;
  message?: string;
  buttons?: AlertButton[];
}

interface AlertContextType {
  showAlert: (options: AlertOptions) => void;
}

const AlertContext = createContext<AlertContextType>({
  showAlert: () => {},
});

export const useAlert = () => useContext(AlertContext);

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [visible, setVisible] = useState(false);
  const [options, setOptions] = useState<AlertOptions>({ title: '' });

  const showAlert = useCallback((opts: AlertOptions) => {
    setOptions(opts);
    setVisible(true);
  }, []);

  const handlePress = (button?: AlertButton) => {
    setVisible(false);
    button?.onPress?.();
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <Portal>
        <Modal
          visible={visible}
          onDismiss={() => setVisible(false)}
          contentContainerStyle={styles.modal}
        >
          <Text variant="titleMedium" style={styles.title}>{options.title}</Text>
          {options.message ? (
            <Text variant="bodyMedium" style={styles.message}>{options.message}</Text>
          ) : null}
          <View style={styles.buttons}>
            {(options.buttons || [{ text: 'OK' }]).map((btn, i) => (
              <Button
                key={i}
                mode={btn.style === 'cancel' ? 'outlined' : 'contained'}
                onPress={() => handlePress(btn)}
                style={styles.button}
                buttonColor={btn.style === 'destructive' ? colors.error : undefined}
              >
                {btn.text}
              </Button>
            ))}
          </View>
        </Modal>
      </Portal>
    </AlertContext.Provider>
  );
};

const styles = StyleSheet.create({
  modal: {
    backgroundColor: colors.white,
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 8,
  },
  title: {
    fontWeight: 'bold',
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  message: {
    color: colors.text.secondary,
    marginBottom: spacing.md,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  button: {
    minWidth: 80,
  },
});

export default AlertProvider;
