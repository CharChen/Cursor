// 定義卡牌類型
export type CardType = 'Emperor' | 'Citizen' | 'Slave';

// 定義卡牌介面
export interface Card {
  type: CardType;
  id: number;
}

// 定義玩家類型
export type PlayerType = 'player' | 'computer';

// 定義遊戲狀態
export type GamePhase = 'init' | 'coinFlip' | 'cardSelection' | 'betting' | 'comparison' | 'result';

// 定義下注金額選項
export type BetAmount = 10 | 50 | 100 | 500 | 1000;

// 定義遊戲狀態介面
export interface GameState {
  playerDeck: Card[];
  computerDeck: Card[];
  playerChips: number;
  currentBet: number;
  totalPot: number;
  selectedCards: {
    player: Card | null;
    computer: Card | null;
  };
  phase: GamePhase;
  round: number;
  winner: PlayerType | 'draw' | null;
  timeRemaining: number;
  isPlayerTurn: boolean;
  lastBet: number;
  gameMessage: string;
  isAnimating: boolean;
  betSliderValue: number;
  isPlayerDeckA: boolean;
}

// 定義遊戲設置
export interface GameSettings {
  initialChips: number;
  maxRounds: number;
  timeLimit: number;
  minBet: number;
  maxBet: number;
  coinFlipDuration: number;
  anteBet: number;
}
