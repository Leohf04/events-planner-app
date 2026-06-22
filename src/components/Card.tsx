import React from 'react';
import { Card as PaperCard } from 'react-native-paper';

interface CardProps {
  children: React.ReactNode;
  style?: any;
  onPress?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, style, onPress }) => {
  return (
    <PaperCard mode="elevated" onPress={onPress} style={style}>
      <PaperCard.Content>
        {children}
      </PaperCard.Content>
    </PaperCard>
  );
};

export default Card;