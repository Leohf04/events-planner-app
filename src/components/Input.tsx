import React from 'react';
import { TextInput, HelperText } from 'react-native-paper';
import { View, StyleSheet } from 'react-native';
import { colors, spacing } from '../theme';

interface InputProps extends Omit<React.ComponentProps<typeof TextInput>, 'mode'> {
  label?: string;
  error?: string;
  required?: boolean;
  leftIcon?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  required,
  leftIcon,
  style,
  ...props
}) => {
  return (
    <View style={styles.wrapper}>
      <TextInput
        mode="outlined"
        label={label ? `${label}${required ? ' *' : ''}` : undefined}
        error={!!error}
        left={leftIcon ? <TextInput.Icon icon={leftIcon} /> : undefined}
        style={[styles.input, style]}
        outlineColor={colors.border}
        activeOutlineColor={colors.primary}
        {...props}
      />
      {error && (
        <HelperText type="error" visible={!!error}>
          {error}
        </HelperText>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.white,
  },
  error: {
    color: colors.error,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

export default Input;