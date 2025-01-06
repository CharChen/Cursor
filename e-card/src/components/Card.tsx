import React, { useState, useEffect } from 'react';
import { Card as CardType } from '../types/types';
import './Card.css';
import '../styles/animations.css';

interface CardProps {
  card: CardType;
  isHidden?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  isFlipping?: boolean;
}

export const Card: React.FC<CardProps> = ({ 
  card, 
  isHidden = false, 
  onClick, 
  disabled = false,
  isFlipping = false
}) => {
  const [isFlipped, setIsFlipped] = useState(isHidden);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isFlipping) {
      setIsAnimating(true);
      setTimeout(() => {
        setIsFlipped(false);
      }, 150);
      setTimeout(() => {
        setIsAnimating(false);
      }, 300);
    } else {
      setIsFlipped(isHidden);
    }
  }, [isFlipping, isHidden]);

  const handleClick = () => {
    if (!disabled && onClick) {
      onClick();
    }
  };

  const getDisplayText = (type: CardType) => {
    switch (type) {
      case 'Emperor':
        return 'Emperor';
      case 'Citizen':
        return 'Citizen';
      case 'Slave':
        return 'Slave';
      default:
        return type;
    }
  };

  return (
    <div 
      className={`
        card 
        ${isFlipped ? 'hidden' : ''} 
        ${disabled ? 'disabled' : ''} 
        ${isAnimating ? 'flipping' : ''}
      `}
      onClick={handleClick}
      data-type={card.type}
    >
      <div className="card-inner">
        <div className="card-front">
          <div className="card-content">
            {getDisplayText(card.type)}
          </div>
        </div>
        <div className="card-back" />
      </div>
    </div>
  );
}; 