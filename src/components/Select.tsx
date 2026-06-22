import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, TextInput, Menu, Button, Dialog, Portal } from 'react-native-paper';
import { colors, spacing, borderRadius } from '../theme';

interface SelectOption {
  label: string;
  value: string | number;
}

interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string | number;
  options: SelectOption[];
  onChange: (value: string | number) => void;
  error?: string;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Seleccionar...',
  value,
  options,
  onChange,
  error,
}) => {
  const [visible, setVisible] = useState(false);

  const selectedOption = options.find(opt => opt.value === value);

  return (
    <View style={styles.wrapper}>
      <TouchableOpacity onPress={() => setVisible(true)}>
        <TextInput
          mode="outlined"
          label={label}
          value={selectedOption?.label || ''}
          placeholder={placeholder}
          error={!!error}
          editable={false}
          right={<TextInput.Icon icon="chevron-down" onPress={() => setVisible(true)} />}
          outlineColor={colors.border}
          activeOutlineColor={colors.primary}
          style={styles.input}
        />
      </TouchableOpacity>
      {error && (
        <Text style={styles.error}>{error}</Text>
      )}
      <Portal>
        <Dialog visible={visible} onDismiss={() => setVisible(false)}>
          <Dialog.Title>{label || 'Seleccionar'}</Dialog.Title>
          <Dialog.Content>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt.value}
                style={[
                  styles.option,
                  opt.value === value && styles.optionSelected,
                ]}
                onPress={() => {
                  onChange(opt.value);
                  setVisible(false);
                }}
              >
                <Text
                  style={[
                    styles.optionText,
                    opt.value === value && styles.optionTextSelected,
                  ]}
                >
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setVisible(false)}>Cerrar</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  option: {
    paddingVertical: spacing.sm + 4,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  optionSelected: {
    backgroundColor: 'rgba(10, 132, 255, 0.08)',
  },
  optionText: {
    fontSize: 16,
    color: colors.text.primary,
  },
  optionTextSelected: {
    color: colors.primary,
    fontWeight: '600',
  },
});

export default Select;