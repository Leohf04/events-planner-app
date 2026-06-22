import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Icon } from 'react-native-paper';
import { colors, spacing } from '../theme';
import { Button } from './Button';

interface EmptyStateProps {
  message: string;
  icon?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  message,
  icon = 'inbox-outline',
  actionLabel,
  onAction,
}) => {
  return (
    <View style={styles.container}>
      <Icon source={icon} size={64} color={colors.text.disabled} />
      <Text style={styles.message}>{message}</Text>
      {actionLabel && onAction && (
        <Button
          title={actionLabel}
          onPress={onAction}
          style={styles.button}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  message: {
    fontSize: 16,
    color: colors.text.secondary,
    textAlign: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.md,
  },
  button: {
    minWidth: 150,
  },
});

export default EmptyState;