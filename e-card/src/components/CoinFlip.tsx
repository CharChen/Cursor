import React, { useEffect, useState } from 'react';
import './CoinFlip.css';

interface CoinFlipProps {
  isFlipping: boolean;
  result: 'Emperor' | 'Slave';
  onFlipEnd?: () => void;
}

export const CoinFlip: React.FC<CoinFlipProps> = ({ isFlipping, result, onFlipEnd }) => {
  const [showResult, setShowResult] = useState(false);
  const [finalResult, setFinalResult] = useState<'Emperor' | 'Slave'>(result);

  useEffect(() => {
    if (isFlipping) {
      setShowResult(false);
      setFinalResult(result);
      
      const timer = setTimeout(() => {
        setShowResult(true);
      }, 400);

      const endTimer = setTimeout(() => {
        onFlipEnd?.();
      }, 600);

      return () => {
        clearTimeout(timer);
        clearTimeout(endTimer);
      };
    }
  }, [isFlipping, result, onFlipEnd]);

  return (
    <div className={`coin ${isFlipping ? 'flipping' : ''}`}>
      <div className="coin-inner">
        <div className="coin-front">
          <span className="coin-text">
            {finalResult === 'Emperor' ? 'E' : 'S'}
          </span>
        </div>
        <div className="coin-back">
          <span className="coin-text">
            {finalResult === 'Emperor' ? 'E' : 'S'}
          </span>
        </div>
      </div>
    </div>
  );
};
