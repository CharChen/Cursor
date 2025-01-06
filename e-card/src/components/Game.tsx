import React, { useState, useEffect } from 'react';
import { GameState, Card, GamePhase, BetAmount } from '../types/types';
import { GameLogic, DEFAULT_SETTINGS } from '../utils/gameLogic';
import { Card as CardComponent } from './Card';
import { CoinFlip } from './CoinFlip';
import './Game.css';
import '../styles/animations.css';

export const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    playerDeck: [],
    computerDeck: [],
    playerChips: DEFAULT_SETTINGS.initialChips,
    currentBet: 0,
    totalPot: 0,
    selectedCards: {
      player: null,
      computer: null
    },
    phase: 'init',
    round: 1,
    winner: null,
    timeRemaining: DEFAULT_SETTINGS.timeLimit,
    isPlayerTurn: true,
    lastBet: 0,
    gameMessage: '點擊開始遊戲',
    isAnimating: false,
    betSliderValue: 0,
    isPlayerDeckA: false
  });

  const [coinResult, setCoinResult] = useState<'Emperor' | 'Slave'>('Emperor');

  // 計時器
  useEffect(() => {
    let timer: NodeJS.Timeout;
    
    if (gameState.phase === 'cardSelection' && gameState.timeRemaining > 0) {
      timer = setInterval(() => {
        setGameState(prev => ({
          ...prev,
          timeRemaining: prev.timeRemaining - 1
        }));
      }, 1000);
    }

    return () => clearInterval(timer);
  }, [gameState.phase, gameState.timeRemaining]);

  // 監控計時器結束
  useEffect(() => {
    if (gameState.timeRemaining === 0 && gameState.phase === 'cardSelection') {
      const randomCard = gameState.playerDeck[
        Math.floor(Math.random() * gameState.playerDeck.length)
      ];
      selectCard(randomCard);
    }
  }, [gameState.timeRemaining]);

  // 初始化遊戲
  const initializeGame = () => {
    const result = Math.random() < 0.5 ? 'Emperor' : 'Slave';
    setCoinResult(result);
    setGameState(prev => ({
      ...prev,
      phase: 'coinFlip',
      selectedCards: { player: null, computer: null },
      currentBet: 0,
      totalPot: 0,
      isAnimating: true,
      gameMessage: '擲硬幣決定牌組...'
    }));
  };

  // 處理硬幣翻轉結束
  const handleCoinFlipEnd = () => {
    setGameState(prev => ({
      ...prev,
      playerDeck: GameLogic.createDeck(coinResult === 'Emperor'),
      computerDeck: GameLogic.createDeck(coinResult === 'Slave'),
      phase: 'cardSelection',
      isAnimating: false,
      isPlayerDeckA: coinResult === 'Emperor',
      gameMessage: coinResult === 'Emperor' ? 
        '你獲得了 A 牌組！請選擇一張卡牌' : 
        '你獲得了 B 牌組！請選擇一張卡牌'
    }));
  };

  // 選擇卡牌
  const selectCard = (card: Card) => {
    if (gameState.phase !== 'cardSelection') return;

    const computerCard = gameState.computerDeck[
      Math.floor(Math.random() * gameState.computerDeck.length)
    ];

    setGameState(prev => ({
      ...prev,
      selectedCards: {
        player: card,
        computer: computerCard
      },
      playerDeck: prev.playerDeck.filter(c => c.id !== card.id),
      computerDeck: prev.computerDeck.filter(c => c.id !== computerCard.id),
      phase: 'betting',
      playerChips: prev.playerChips - DEFAULT_SETTINGS.anteBet,
      totalPot: DEFAULT_SETTINGS.anteBet * 2,
      gameMessage: `雙方支付前注 ${DEFAULT_SETTINGS.anteBet} 籌碼，請選擇下注金額`,
      isPlayerTurn: !prev.isPlayerDeckA  // B 牌組先手
    }));

    // 如果玩家是 A 牌組，電腦（B 牌組）必須先加注
    if (gameState.isPlayerDeckA) {
      setTimeout(() => {
        const betAmount = Math.floor(Math.random() * 51);
        setGameState(prev => ({
          ...prev,
          totalPot: prev.totalPot + betAmount,
          currentBet: betAmount,
          isPlayerTurn: true,
          gameMessage: `電腦加注 ${betAmount} 籌碼，輪到你行動`
        }));
      }, 1000);
    }
  };

  // 下注
  const placeBet = (amount: number) => {
    if (gameState.phase !== 'betting') return;
    
    // 先顯示玩家的下注
    setGameState(prev => ({
      ...prev,
      playerChips: prev.playerChips - amount,
      totalPot: prev.totalPot + amount,
      currentBet: amount,
      lastBet: amount,
      isPlayerTurn: false,
      gameMessage: `你下注了 ${amount} 籌碼，等待電腦回應...`
    }));

    // 電腦回合
    setTimeout(() => {
      if (!gameState.selectedCards.computer) return;

      const decision = GameLogic.computerDecision(
        gameState.selectedCards.computer,
        amount,
        !gameState.isPlayerDeckA
      );

      if (decision.action === 'fold') {
        setGameState(prev => ({
          ...prev,
          gameMessage: '電腦選擇棄牌！你贏得了這回合',
          phase: 'result'
        }));
        setTimeout(() => endRound('player'), 2000);
        return;
      }

      if (decision.action === 'raise' && decision.amount !== undefined) {
        // 電腦選擇加注
        setGameState(prev => ({
          ...prev,
          totalPot: prev.totalPot + decision.amount!,
          currentBet: decision.amount!,
          isPlayerTurn: true,  // 讓玩家回應
          gameMessage: `電腦加注到 ${decision.amount} 籌碼，輪到你行動`
        }));
      } else {
        // 電腦選擇跟注，進入比牌
        setGameState(prev => ({
          ...prev,
          totalPot: prev.totalPot + prev.currentBet,
          phase: 'comparison',
          gameMessage: `電腦選擇跟注 ${prev.currentBet} 籌碼！開始比牌...`,
          isAnimating: true
        }));
        setTimeout(compareCards, 2000);
      }
    }, 1500);

    // 下注動畫
    const betValue = document.querySelector('.bet-value');
    betValue?.classList.add('betting');
    setTimeout(() => betValue?.classList.remove('betting'), 500);
  };

  // 電腦回合
  const computerTurn = () => {
    if (!gameState.selectedCards.computer) return;

    const decision = GameLogic.computerDecision(
      gameState.selectedCards.computer,
      gameState.currentBet,
      !gameState.isPlayerDeckA
    );

    if (decision.action === 'fold') {
      setGameState(prev => ({
        ...prev,
        gameMessage: '電腦選擇棄牌！你贏得了這回合',
        phase: 'result'
      }));
      setTimeout(() => endRound('player'), 2000);
      return;
    }

    if (decision.action === 'raise' && decision.amount !== undefined) {
      // 電腦選擇加注
      setGameState(prev => ({
        ...prev,
        totalPot: prev.totalPot + decision.amount!,
        currentBet: decision.amount!,
        isPlayerTurn: true,  // 讓玩家回應
        gameMessage: `電腦加注到 ${decision.amount} 籌碼，輪到你行動`
      }));
    } else {
      // 電腦選擇跟注，進入比牌
      setGameState(prev => ({
        ...prev,
        totalPot: prev.totalPot + prev.currentBet,
        phase: 'comparison',
        gameMessage: `電腦選擇跟注 ${prev.currentBet} 籌碼！開始比牌...`,
        isAnimating: true
      }));
      setTimeout(compareCards, 2000);
    }
  };

  // 比牌
  const compareCards = () => {
    if (!gameState.selectedCards.player || !gameState.selectedCards.computer) return;

    const result = GameLogic.determineWinner(
      gameState.selectedCards.player,
      gameState.selectedCards.computer
    );

    // 先更新遊戲狀態
    setGameState(prev => ({
      ...prev,
      phase: 'result',
      isAnimating: true
    }));

    // 計算獎勵或損失
    const totalBet = gameState.currentBet + DEFAULT_SETTINGS.anteBet;

    if (result.winner === 'player') {
      const reward = GameLogic.calculateReward(
        gameState.currentBet,
        result.multiplier,
        DEFAULT_SETTINGS.anteBet
      );

      // 贏牌動畫
      const playerCard = document.querySelector('.play-area .card:last-child');
      playerCard?.classList.add('win');
      setTimeout(() => playerCard?.classList.remove('win'), 2000);

      // 籌碼動畫
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const chip = document.createElement('div');
          chip.className = 'flying-chips';
          chip.style.left = `${40 + Math.random() * 20}%`;
          document.body.appendChild(chip);
          setTimeout(() => document.body.removeChild(chip), 1000);
        }, i * 200);
      }

      setGameState(prev => ({
        ...prev,
        gameMessage: `你贏了！獲得 ${reward} 籌碼 (${result.multiplier}倍)`
      }));
    } else if (result.winner === 'computer') {
      // 使用電腦的卡牌對玩家的卡牌計算倍率
      const computerResult = GameLogic.determineWinner(
        gameState.selectedCards.computer,
        gameState.selectedCards.player
      );
      const loss = Math.floor(totalBet * computerResult.multiplier);

      // 輸牌動畫
      const playerCard = document.querySelector('.play-area .card:last-child');
      playerCard?.classList.add('lose');
      setTimeout(() => playerCard?.classList.remove('lose'), 2000);

      setGameState(prev => ({
        ...prev,
        gameMessage: `你輸了！損失 ${loss} 籌碼 (${computerResult.multiplier}倍)`
      }));
    } else {
      setGameState(prev => ({
        ...prev,
        gameMessage: '平局！雙方收回籌碼'
      }));
    }

    // 確保動畫和狀態更新完成後再結束回合
    setTimeout(() => {
      endRound(result.winner);
    }, 2000);
  };

  // 結束回合
  const endRound = (winner: PlayerType | 'draw') => {
    setGameState(prev => {
      const newState = { ...prev, phase: 'result' as GamePhase };

      if (winner === 'player') {
        if (prev.phase === 'result' && prev.gameMessage.includes('棄牌')) {
          // 電腦棄牌，玩家贏得所有已下注的籌碼
          newState.playerChips += prev.totalPot;  // 獲得獎池中的所有籌碼
          newState.gameMessage = `電腦棄牌！你贏得了 ${prev.totalPot - (prev.currentBet + DEFAULT_SETTINGS.anteBet)} 籌碼`;
        } else {
          // 正常比牌獲勝的邏輯保持不變
          const result = GameLogic.determineWinner(
            prev.selectedCards.player!,
            prev.selectedCards.computer!
          );
          const reward = GameLogic.calculateReward(
            prev.currentBet,
            result.multiplier,
            DEFAULT_SETTINGS.anteBet
          );
          newState.playerChips += reward;
          newState.gameMessage = `你贏得了 ${reward} 籌碼！`;
        }
      } else if (winner === 'computer') {
        if (prev.phase === 'betting') {
          // 玩家棄牌，損失已下注的金額（前注 + 追加注）
          // 不需要額外操作，因為下注時已經扣除了籌碼
          newState.gameMessage = `你選擇棄牌，損失 ${prev.currentBet + DEFAULT_SETTINGS.anteBet} 籌碼`;
        } else {
          // 正常比牌失敗的邏輯保持不變
          const result = GameLogic.determineWinner(
            prev.selectedCards.computer!,
            prev.selectedCards.player!
          );
          const loss = Math.floor((prev.currentBet + DEFAULT_SETTINGS.anteBet) * result.multiplier);
          newState.gameMessage = `你輸了 ${loss} 籌碼 (${result.multiplier}倍)`;
        }
      } else {
        // 平局時收回自己的籌碼
        newState.playerChips += (prev.currentBet + DEFAULT_SETTINGS.anteBet);
        newState.gameMessage = '平局！雙方收回籌碼';
      }

      return newState;
    });

    // 檢查遊戲是否結束
    if (GameLogic.isGameOver(gameState.playerDeck, gameState.computerDeck, gameState.round)) {
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          phase: 'init',
          selectedCards: { player: null, computer: null },
          currentBet: 0,
          totalPot: 0,
          gameMessage: '遊戲結束！點擊開始新的一局'
        }));
      }, 2000);
    } else {
      // 準備下一回合
      setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          round: prev.round + 1,
          phase: 'cardSelection',
          selectedCards: { player: null, computer: null },
          currentBet: 0,
          totalPot: 0,
          betSliderValue: 0,
          timeRemaining: DEFAULT_SETTINGS.timeLimit,
          gameMessage: '請選擇一張卡牌',
          isAnimating: false,
          isPlayerTurn: true
        }));
      }, 2000);
    }
  };

  return (
    <div className="game-container">
      <div className="game-status">
        <div className="player-chips">籌碼: {gameState.playerChips}</div>
        {gameState.phase === 'betting' && (
          <div className="current-bet">
            當前賭注: {gameState.currentBet + DEFAULT_SETTINGS.anteBet}
            <span className="bet-detail">
              （前注: {DEFAULT_SETTINGS.anteBet} + 
              追加: {gameState.currentBet}）
            </span>
          </div>
        )}
        {gameState.phase === 'comparison' && (
          <div className="current-bet">
            當前賭注: {gameState.currentBet + DEFAULT_SETTINGS.anteBet}
          </div>
        )}
        {gameState.phase === 'result' && (
          <div className="current-bet">
            最終賭注: {gameState.currentBet + DEFAULT_SETTINGS.anteBet}
          </div>
        )}
        {gameState.phase === 'cardSelection' && (
          <div className="timer">剩餘時間: {gameState.timeRemaining}秒</div>
        )}
        <div className="message">{gameState.gameMessage}</div>
      </div>

      {gameState.phase === 'coinFlip' && (
        <div className="coin-flip-container">
          <CoinFlip 
            isFlipping={gameState.isAnimating}
            result={coinResult}
            onFlipEnd={handleCoinFlipEnd}
          />
        </div>
      )}

      <div className="computer-hand">
        {gameState.computerDeck.map(card => (
          <CardComponent key={card.id} card={card} isHidden={true} disabled={true} />
        ))}
      </div>

      <div className="play-area">
        {gameState.selectedCards.computer && (
          <CardComponent 
            card={gameState.selectedCards.computer} 
            isHidden={gameState.phase !== 'comparison' && gameState.phase !== 'result'} 
            disabled={true} 
            isFlipping={gameState.phase === 'comparison'}
          />
        )}
        {gameState.selectedCards.player && (
          <CardComponent 
            card={gameState.selectedCards.player} 
            disabled={true} 
            isFlipping={false}
          />
        )}
      </div>

      {gameState.phase === 'betting' && gameState.isPlayerTurn && (
        <div className="betting-controls">
          <input
            type="range"
            min={DEFAULT_SETTINGS.minBet}
            max={DEFAULT_SETTINGS.maxBet}
            value={gameState.betSliderValue}
            onChange={(e) => setGameState(prev => ({
              ...prev,
              betSliderValue: parseInt(e.target.value)
            }))}
          />
          <div className="bet-value">追加下注金額: {gameState.betSliderValue}</div>
          <button 
            onClick={() => placeBet(gameState.betSliderValue)}
            disabled={gameState.betSliderValue > gameState.playerChips}
          >
            確認下注
          </button>
          {gameState.currentBet > 0 && (
            <>
              <button onClick={() => placeBet(gameState.currentBet)}>
                跟注 ({gameState.currentBet})
              </button>
              <button onClick={() => endRound('computer')}>
                棄牌
              </button>
            </>
          )}
        </div>
      )}

      <div className="player-hand">
        {gameState.playerDeck.map(card => (
          <CardComponent 
            key={card.id} 
            card={card} 
            onClick={() => gameState.phase === 'cardSelection' && selectCard(card)}
            disabled={gameState.phase !== 'cardSelection'}
          />
        ))}
      </div>

      {gameState.phase === 'init' && (
        <button className="start-button" onClick={initializeGame}>
          開始遊戲
        </button>
      )}
    </div>
  );
}; 