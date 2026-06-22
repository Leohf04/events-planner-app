import React from 'react';
import { Button as PaperButton } from 'react-native-paper';
import { colors } from '../theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  style?: any;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const getMode = (): 'contained' | 'outlined' | 'text' => {
    switch (variant) {
      case 'primary': return 'contained';
      case 'secondary': return 'contained';
      case 'danger': return 'contained';
      case 'outline': return 'outlined';
      default: return 'contained';
    }
  };

  const getColor = () => {
    switch (variant) {
      case 'danger': return { buttonColor: colors.error };
      case 'secondary': return { buttonColor: colors.background.component };
      default: return {};
    }
  };

  return (
    <PaperButton
      mode={getMode()}
      onPress={onPress}
      loading={loading}
      disabled={disabled}
      icon={icon}
      style={style}
      contentStyle={{ paddingVertical: 4 }}
      {...getColor()}
    >
      {title}
    </PaperButton>
  );
};

export default Button;