import React from 'react';
import { FAB as PaperFAB } from 'react-native-paper';
import { StyleSheet } from 'react-native';

interface FABProps {
  onPress: () => void;
  icon?: string;
  style?: any;
  elevation?: number;
}

export const FAB: React.FC<FABProps> = ({ onPress, icon = 'plus', style, elevation }) => {
  return (
    <PaperFAB
      icon={icon}
      onPress={onPress}
      elevation={elevation}
      style={[styles.fab, style]}
    />
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    margin: 16,
    right: 0,
    bottom: 0,
  },
});

export default FAB;