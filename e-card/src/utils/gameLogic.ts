import { Card, CardType, PlayerType, GameSettings, BetAmount } from '../types/types';

export const DEFAULT_SETTINGS: GameSettings = {
  initialChips: 300,
  maxRounds: 5,
  timeLimit: 15,
  minBet: 0,
  maxBet: 100,
  coinFlipDuration: 500,
  anteBet: 10
};

export class GameLogic {
  static createDeck(isEmperorDeck: boolean): Card[] {
    const deck: Card[] = [];
    let id = 0;
    
    if (isEmperorDeck) {
      deck.push({ type: 'Emperor', id: id++ });
    } else {
      deck.push({ type: 'Slave', id: id++ });
    }
    
    for (let i = 0; i < 4; i++) {
      deck.push({ type: 'Citizen', id: id++ });
    }
    
    return this.shuffleDeck(deck);
  }

  static shuffleDeck(deck: Card[]): Card[] {
    const newDeck = [...deck];
    for (let i = newDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newDeck[i], newDeck[j]] = [newDeck[j], newDeck[i]];
    }
    return newDeck;
  }

  static determineWinner(playerCard: Card, computerCard: Card): {
    winner: PlayerType | 'draw';
    multiplier: number;
  } {
    if (playerCard.type === computerCard.type) {
      return { winner: 'draw', multiplier: 1 };
    }

    const winConditions: Record<CardType, { beats: CardType; multiplier: number }> = {
      Emperor: { beats: 'Citizen', multiplier: 1.44 },
      Citizen: { beats: 'Slave', multiplier: 1.44 },
      Slave: { beats: 'Emperor', multiplier: 9 }
    };

    if (winConditions[playerCard.type].beats === computerCard.type) {
      return { 
        winner: 'player', 
        multiplier: winConditions[playerCard.type].multiplier 
      };
    }

    return { 
      winner: 'computer', 
      multiplier: winConditions[computerCard.type].multiplier 
    };
  }

  static calculateReward(bet: number, multiplier: number, anteBet: number): number {
    // 計算總投注金額（下注 + 前注）
    const totalBet = bet + anteBet;
    // 計算總回報（包含本金）= 總投注金額 × 倍率
    const totalReturn = Math.floor(totalBet * multiplier);
    // 計算純獲利 = 總回報 - 本金
    const profit = totalReturn - totalBet;
    // 返回純獲利（因為本金已經在下注時扣除了）
    return profit;
  }

  static computerDecision(computerCard: Card, currentBet: number, isComputerDeckB: boolean): {
    action: 'call' | 'raise' | 'fold';
    amount?: number;
  } {
    const randomFactor = Math.random();
    const betAmount = Math.floor(Math.random() * 51); // 0-50 的隨機數

    // 如果是 B 牌組且是先手（當前下注為 0），必須加注
    if (isComputerDeckB && currentBet === 0) {
      return { action: 'raise', amount: Math.max(10, betAmount) }; // 確保至少加注 10
    }

    // 如果玩家下注超過 50，有較高機率棄牌
    if (currentBet > 50 && randomFactor > 0.7) {
      return { action: 'fold' };
    }

    // 如果是 A 牌組，只能跟注或棄牌
    if (!isComputerDeckB && currentBet > 0) {
      return randomFactor > 0.3 ? { action: 'call' } : { action: 'fold' };
    }

    // 其他情況隨機決定
    return randomFactor > 0.5 ? { action: 'call' } : { action: 'fold' };
  }

  static isGameOver(playerDeck: Card[], computerDeck: Card[], round: number): boolean {
    const hasSpecialCards = (deck: Card[]) => 
      deck.some(card => card.type === 'Emperor' || card.type === 'Slave');

    return round >= 5 || (!hasSpecialCards(playerDeck) && !hasSpecialCards(computerDeck));
  }
}
