import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useGameStore } from '../store/gameStore';
import type { CardDef, Minion } from '../types/game';
import { HandCard } from './CardComponent';
import FieldSlot from './FieldSlot';
import HeroPortrait from './HeroPortrait';
import ManaBar from './ManaBar';
import AbilityPanel from './AbilityPanel';
import GameLog from './GameLog';

type UIMode =
  | 'idle'
  | 'placing'           // Selected hand card to play
  | 'selected_minion'   // Selected own minion → show ability panel
  | 'attacking'         // Waiting for attack target
  | 'skill_target';     // Waiting for skill target

export default function GameBoard() {
  const { game, playCardToSlot, attackTarget, useAttackSkill, useDefenseSkill, endTurn, resetGame } = useGameStore();

  const [uiMode, setUiMode] = useState<UIMode>('idle');
  const [selectedCard, setSelectedCard] = useState<CardDef | null>(null);
  const [selectedMinionId, setSelectedMinionId] = useState<string | null>(null);
  const [pendingSkill, setPendingSkill] = useState<'attack' | 'defense' | null>(null);
  const [skillTargets, setSkillTargets] = useState<string[]>([]);
  const [targetsNeeded, setTargetsNeeded] = useState(0);

  if (!game) return null;

  const isPlayerTurn = game.activePlayer === 'player';
  const playerField = game.playerField;
  const aiField = game.aiField;

  const selectedMinion = selectedMinionId
    ? (playerField.find((m) => m?.instanceId === selectedMinionId) ?? null)
    : null;

  const resetUI = useCallback(() => {
    setUiMode('idle');
    setSelectedCard(null);
    setSelectedMinionId(null);
    setPendingSkill(null);
    setSkillTargets([]);
    setTargetsNeeded(0);
  }, []);

  // ── Hand card click ──
  const handleHandCardClick = (card: CardDef) => {
    if (!isPlayerTurn) return;
    if (game.playerMana < card.mana) return;
    if (uiMode === 'placing' && selectedCard?.id === card.id) {
      resetUI();
      return;
    }
    resetUI();
    setSelectedCard(card);
    setUiMode('placing');
  };

  // ── Own field slot click ──
  const handleOwnSlotClick = (slot: number, minion: Minion | null) => {
    if (!isPlayerTurn) return;

    if (uiMode === 'placing' && selectedCard && !minion) {
      playCardToSlot(selectedCard, slot);
      resetUI();
      return;
    }

    if (uiMode === 'skill_target' && pendingSkill && selectedMinionId) {
      // Swap targets own minion
      if (minion && minion.instanceId !== selectedMinionId) {
        const newTargets = [...skillTargets, minion.instanceId];
        if (newTargets.length >= targetsNeeded) {
          if (pendingSkill === 'attack') {
            useAttackSkill(selectedMinionId, newTargets);
          } else {
            useDefenseSkill(selectedMinionId, newTargets);
          }
          resetUI();
        } else {
          setSkillTargets(newTargets);
        }
      }
      return;
    }

    if (minion) {
      if (uiMode === 'selected_minion' && selectedMinionId === minion.instanceId) {
        // deselect
        resetUI();
        return;
      }
      resetUI();
      setSelectedMinionId(minion.instanceId);
      setUiMode('selected_minion');
    } else {
      resetUI();
    }
  };

  // ── Enemy field slot click ──
  const handleEnemySlotClick = (_slot: number, minion: Minion | null) => {
    if (!isPlayerTurn) return;

    if (uiMode === 'attacking' && selectedMinionId) {
      if (minion) {
        if (minion.statusEffects.includes('ghost')) return; // can't target ghost
        attackTarget(selectedMinionId, minion.instanceId);
      }
      resetUI();
      return;
    }

    if (uiMode === 'skill_target' && pendingSkill && selectedMinionId) {
      if (!minion) return;
      const newTargets = [...skillTargets, minion.instanceId];
      if (newTargets.length >= targetsNeeded) {
        if (pendingSkill === 'attack') {
          useAttackSkill(selectedMinionId, newTargets);
        } else {
          useDefenseSkill(selectedMinionId, newTargets);
        }
        resetUI();
      } else {
        setSkillTargets(newTargets);
      }
    }
  };

  // ── Hero click ──
  const handleAIHeroClick = () => {
    if (!isPlayerTurn) return;
    if (uiMode === 'attacking' && selectedMinionId) {
      attackTarget(selectedMinionId, 'ai_hero');
      resetUI();
    }
  };

  // ── Ability panel actions ──
  const handleUseAttackAbility = () => {
    if (!selectedMinion) return;
    const ability = selectedMinion.attackAbility;
    const needsTarget = ['knockback', 'snipe', 'push_two', 'pull'].includes(ability.type);
    const selfTarget = ['double_shot', 'double_turn', 'push_all', 'push_outward', 'summon_star'].includes(ability.type);

    if (selfTarget) {
      useAttackSkill(selectedMinion.instanceId, []);
      resetUI();
    } else if (needsTarget) {
      const needed = ability.type === 'snipe' || ability.type === 'push_two' ? 2 : 1;
      setPendingSkill('attack');
      setSkillTargets([]);
      setTargetsNeeded(needed);
      setUiMode('skill_target');
    } else {
      useAttackSkill(selectedMinion.instanceId, []);
      resetUI();
    }
  };

  const handleUseDefenseAbility = () => {
    if (!selectedMinion) return;
    const ability = selectedMinion.defenseAbility;
    const needsEnemyTarget = ['lockdown'].includes(ability.type);
    const needsOwnTarget = ['swap'].includes(ability.type);
    const selfApply = ['ghost', 'double_power', 'cond_disguise', 'cond_reverse'].includes(ability.type);

    if (selfApply) {
      useDefenseSkill(selectedMinion.instanceId, []);
      resetUI();
    } else if (needsEnemyTarget) {
      setPendingSkill('defense');
      setSkillTargets([]);
      setTargetsNeeded(1);
      setUiMode('skill_target');
    } else if (needsOwnTarget) {
      setPendingSkill('defense');
      setSkillTargets([]);
      setTargetsNeeded(1);
      setUiMode('skill_target');
    } else {
      useDefenseSkill(selectedMinion.instanceId, []);
      resetUI();
    }
  };

  const handleStartAttack = () => {
    if (!selectedMinion) return;
    if (selectedMinion.attacksLeftThisTurn <= 0) return;
    setUiMode('attacking');
  };

  const isEnemyAttackable = uiMode === 'attacking';
  const isAIHeroAttackable = uiMode === 'attacking' && aiField.every((m) => m === null);

  return (
    <div className="w-full h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-950 flex flex-col relative overflow-hidden">
      {/* Starfield background */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.8 + 0.2,
            }}
          />
        ))}
      </div>

      {/* ── TOP: AI Area ── */}
      <div className="flex items-center px-4 py-2 gap-3 z-10">
        <HeroPortrait hero={game.aiHero} isEnemy onClick={isAIHeroAttackable ? handleAIHeroClick : undefined} isAttackable={isAIHeroAttackable} />
        <div className="flex-1" />
        <div className="text-gray-400 text-xs">
          핸드: {game.aiHand.length}장 | 덱: {game.aiDeck.length}장
        </div>
        <ManaBar current={game.aiMana} max={game.aiMaxMana} />
      </div>

      {/* ── AI FIELD ── */}
      <div className="flex justify-center gap-2 px-4 py-2 z-10">
        {Array.from({ length: 6 }).map((_, i) => {
          const minion = aiField[i] ?? null;
          return (
            <FieldSlot
              key={i}
              slot={i}
              minion={minion}
              isOwn={false}
              isAttackable={isEnemyAttackable && !!minion && !minion.statusEffects.includes('ghost')}
              onClick={() => handleEnemySlotClick(i, minion)}
            />
          );
        })}
        <GameLog logs={game.log} />
      </div>

      {/* ── DIVIDER ── */}
      <div className="flex items-center gap-4 px-6 z-10">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="text-purple-300 text-sm font-bold tracking-widest">
          TURN {game.turn} — {isPlayerTurn ? '내 차례' : 'AI 차례'}
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-purple-500/50 to-transparent" />
      </div>

      {/* ── PLAYER FIELD ── */}
      <div className="flex justify-center gap-2 px-4 py-2 z-10 relative">
        {Array.from({ length: 6 }).map((_, i) => {
          const minion = playerField[i] ?? null;
          const isSelected = minion?.instanceId === selectedMinionId;
          const isPlayTarget = uiMode === 'placing' && !minion;
          return (
            <FieldSlot
              key={i}
              slot={i}
              minion={minion}
              isOwn={true}
              isSelected={isSelected}
              isPlayTarget={isPlayTarget}
              onClick={() => handleOwnSlotClick(i, minion)}
            />
          );
        })}

        {/* Ability panel popup */}
        {uiMode === 'selected_minion' && selectedMinion && (
          <AbilityPanel
            minion={selectedMinion}
            onUseAttack={handleUseAttackAbility}
            onUseDefense={handleUseDefenseAbility}
            onClose={resetUI}
          />
        )}
      </div>

      {/* ── STATUS BAR ── */}
      {uiMode !== 'idle' && uiMode !== 'placing' && uiMode !== 'selected_minion' && (
        <div className="text-center text-yellow-300 text-sm py-1 z-10">
          {uiMode === 'attacking' && '공격할 대상을 선택하세요'}
          {uiMode === 'skill_target' && `스킬 대상 선택 (${skillTargets.length}/${targetsNeeded})`}
        </div>
      )}

      {/* Attack button */}
      {uiMode === 'selected_minion' && selectedMinion && selectedMinion.attacksLeftThisTurn > 0 && (
        <div className="flex justify-center z-10 -mt-1">
          <button
            onClick={handleStartAttack}
            className="px-4 py-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-full border border-red-400 shadow-lg transition-all"
          >
            ⚔️ 공격
          </button>
        </div>
      )}

      {/* ── PLAYER INFO BAR ── */}
      <div className="flex items-center px-4 py-2 gap-3 z-10">
        <HeroPortrait hero={game.playerHero} />
        <ManaBar current={game.playerMana} max={game.playerMaxMana} />
        <div className="flex-1" />
        <div className="text-gray-400 text-xs">덱: {game.playerDeck.length}장</div>
        <button
          onClick={isPlayerTurn ? endTurn : undefined}
          disabled={!isPlayerTurn}
          className={`
            px-5 py-2 rounded-full font-bold text-sm border-2 transition-all shadow-lg
            ${isPlayerTurn
              ? 'bg-green-600 hover:bg-green-500 border-green-400 text-white cursor-pointer'
              : 'bg-gray-700 border-gray-600 text-gray-500 cursor-not-allowed'
            }
          `}
        >
          {isPlayerTurn ? '턴 종료' : 'AI 차례...'}
        </button>
      </div>

      {/* ── HAND ── */}
      <div className="flex justify-center gap-2 px-4 pb-3 z-10 overflow-x-auto">
        {game.playerHand.map((card) => (
          <HandCard
            key={card.id}
            card={card}
            isSelected={selectedCard?.id === card.id}
            isPlayable={game.playerMana >= card.mana && isPlayerTurn}
            onClick={() => handleHandCardClick(card)}
          />
        ))}
        {game.playerHand.length === 0 && (
          <div className="text-gray-500 text-sm py-8">핸드가 비어있습니다</div>
        )}
      </div>

      {/* ── GAME OVER OVERLAY ── */}
      <AnimatePresence>
        {game.phase === 'game_over' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50"
          >
            <motion.div
              initial={{ scale: 0.5, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              className="text-center"
            >
              <div className={`text-6xl font-bold mb-4 ${game.winner === 'player' ? 'text-yellow-400' : 'text-red-400'}`}>
                {game.winner === 'player' ? '🏆 승리!' : '💀 패배'}
              </div>
              <div className="text-gray-300 text-xl mb-8">
                {game.winner === 'player' ? '적 영웅을 처치했습니다!' : '영웅이 쓰러졌습니다...'}
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => { resetGame(); }}
                  className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl border border-purple-400 text-lg transition-all"
                >
                  메인 메뉴
                </button>
                <button
                  onClick={() => { useGameStore.getState().startGame(); }}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl border border-green-400 text-lg transition-all"
                >
                  다시 하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ESC to cancel */}
      {uiMode !== 'idle' && (
        <button
          onClick={resetUI}
          className="fixed bottom-4 right-4 z-50 text-gray-400 text-xs hover:text-white"
        >
          [ESC] 취소
        </button>
      )}
    </div>
  );
}
