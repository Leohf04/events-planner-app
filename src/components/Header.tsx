import React from 'react';
import { Appbar } from 'react-native-paper';
import { colors } from '../theme';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  onBack?: () => void;
  onAdd?: () => void;
  rightAction?: React.ReactNode;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  showBack = false,
  onBack,
  onAdd,
  rightAction,
}) => {
  return (
    <Appbar.Header style={{ backgroundColor: colors.primary }}>
      {showBack && onBack && (
        <Appbar.BackAction onPress={onBack} color={colors.onPrimary} />
      )}
      <Appbar.Content
        title={title}
        titleStyle={{ color: colors.onPrimary, fontWeight: 'bold' }}
      />
      {onAdd && (
        <Appbar.Action
          icon="plus-circle-outline"
          onPress={onAdd}
          color={colors.onPrimary}
        />
      )}
      {rightAction}
    </Appbar.Header>
  );
};

export default Header;