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
import HowToPlay from './HowToPlay';

type UIMode =
  | 'idle'
  | 'placing'
  | 'selected_minion'
  | 'attacking'
  | 'skill_target';

export default function GameBoard() {
  const { game, playCardToSlot, attackTarget, useAttackSkill, useDefenseSkill, endTurn, resetGame } = useGameStore();

  const [uiMode, setUiMode] = useState<UIMode>('idle');
  const [selectedCard, setSelectedCard] = useState<CardDef | null>(null);
  const [selectedMinionId, setSelectedMinionId] = useState<string | null>(null);
  const [pendingSkill, setPendingSkill] = useState<'attack' | 'defense' | null>(null);
  const [skillTargets, setSkillTargets] = useState<string[]>([]);
  const [targetsNeeded, setTargetsNeeded] = useState(0);
  const [showHelp, setShowHelp] = useState(false);
  const [dragCardId, setDragCardId] = useState<string | null>(null);

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

  // ── 상태 안내 메시지 ──
  const getStatusMsg = () => {
    if (!isPlayerTurn) return '⏳ AI가 생각 중...';
    switch (uiMode) {
      case 'idle': return '✨ 카드를 드래그하거나 클릭해서 필드에 놓으세요 | 내 카드 클릭 → 공격/스킬';
      case 'placing': return `📌 ${selectedCard?.name} 선택됨 — 아래 빈 슬롯에 드롭하거나 클릭하세요 | ESC 취소`;
      case 'selected_minion': return `${selectedMinion?.name} 선택됨 — ⚔️ 공격 또는 스킬 패널 선택 | ESC 취소`;
      case 'attacking': return '🎯 공격할 적 카드 또는 적 영웅(상단 얼굴)을 클릭하세요 | ESC 취소';
      case 'skill_target': return `🎯 스킬 대상 선택 (${skillTargets.length}/${targetsNeeded}) | ESC 취소`;
    }
  };

  // ── 드래그 앤 드롭 ──
  const handleDragStart = (card: CardDef) => {
    setDragCardId(card.id);
    setSelectedCard(card);
    setUiMode('placing');
  };

  const handleDrop = (slot: number) => {
    const card = selectedCard ?? game.playerHand.find((c) => c.id === dragCardId);
    if (card && game.playerMana >= card.mana) {
      playCardToSlot(card, slot);
    }
    setDragCardId(null);
    resetUI();
  };

  // ── 핸드 카드 클릭 ──
  const handleHandCardClick = (card: CardDef) => {
    if (!isPlayerTurn) return;
    if (game.playerMana < card.mana) return;
    if (uiMode === 'placing' && selectedCard?.id === card.id) { resetUI(); return; }
    resetUI();
    setSelectedCard(card);
    setUiMode('placing');
  };

  // ── 내 필드 슬롯 클릭 ──
  const handleOwnSlotClick = (slot: number, minion: Minion | null) => {
    if (!isPlayerTurn) return;

    if (uiMode === 'placing' && selectedCard && !minion) {
      playCardToSlot(selectedCard, slot);
      resetUI();
      return;
    }

    if (uiMode === 'skill_target' && pendingSkill && selectedMinionId) {
      if (minion && minion.instanceId !== selectedMinionId) {
        const newTargets = [...skillTargets, minion.instanceId];
        if (newTargets.length >= targetsNeeded) {
          if (pendingSkill === 'attack') useAttackSkill(selectedMinionId, newTargets);
          else useDefenseSkill(selectedMinionId, newTargets);
          resetUI();
        } else {
          setSkillTargets(newTargets);
        }
      }
      return;
    }

    if (minion) {
      if (uiMode === 'selected_minion' && selectedMinionId === minion.instanceId) { resetUI(); return; }
      resetUI();
      setSelectedMinionId(minion.instanceId);
      setUiMode('selected_minion');
    } else {
      resetUI();
    }
  };

  // ── 적 필드 슬롯 클릭 ──
  const handleEnemySlotClick = (_slot: number, minion: Minion | null) => {
    if (!isPlayerTurn) return;

    if (uiMode === 'attacking' && selectedMinionId) {
      if (minion && !minion.statusEffects.includes('ghost')) {
        attackTarget(selectedMinionId, minion.instanceId);
      }
      resetUI();
      return;
    }

    if (uiMode === 'skill_target' && pendingSkill && selectedMinionId) {
      if (!minion) return;
      const newTargets = [...skillTargets, minion.instanceId];
      if (newTargets.length >= targetsNeeded) {
        if (pendingSkill === 'attack') useAttackSkill(selectedMinionId, newTargets);
        else useDefenseSkill(selectedMinionId, newTargets);
        resetUI();
      } else {
        setSkillTargets(newTargets);
      }
    }
  };

  // ── AI 영웅 클릭 ──
  const handleAIHeroClick = () => {
    if (!isPlayerTurn || uiMode !== 'attacking' || !selectedMinionId) return;
    attackTarget(selectedMinionId, 'ai_hero');
    resetUI();
  };

  // ── 스킬 패널 ──
  const handleUseAttackAbility = () => {
    if (!selectedMinion) return;
    const { type } = selectedMinion.attackAbility;
    const selfTarget = ['double_shot', 'double_turn', 'push_all', 'push_outward', 'summon_star'].includes(type);
    if (selfTarget) { useAttackSkill(selectedMinion.instanceId, []); resetUI(); return; }
    const needed = type === 'snipe' || type === 'push_two' ? 2 : 1;
    setPendingSkill('attack');
    setSkillTargets([]);
    setTargetsNeeded(needed);
    setUiMode('skill_target');
  };

  const handleUseDefenseAbility = () => {
    if (!selectedMinion) return;
    const { type } = selectedMinion.defenseAbility;
    const selfApply = ['ghost', 'double_power', 'cond_disguise', 'cond_reverse'].includes(type);
    if (selfApply) { useDefenseSkill(selectedMinion.instanceId, []); resetUI(); return; }
    setPendingSkill('defense');
    setSkillTargets([]);
    setTargetsNeeded(1);
    setUiMode('skill_target');
  };

  const handleStartAttack = () => {
    if (!selectedMinion || selectedMinion.attacksLeftThisTurn <= 0) return;
    setUiMode('attacking');
  };

  const isEnemyAttackable = uiMode === 'attacking';
  const isAIHeroAttackable = uiMode === 'attacking';

  return (
    <div
      className="w-full h-screen bg-gradient-to-b from-indigo-950 via-purple-950 to-indigo-950 flex flex-col relative overflow-hidden"
      onKeyDown={(e) => e.key === 'Escape' && resetUI()}
      tabIndex={0}
    >
      {/* Starfield */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        {Array.from({ length: 40 }).map((_, i) => (
          <div key={i} className="absolute w-1 h-1 bg-white rounded-full"
            style={{ left: `${(i * 37 + 13) % 100}%`, top: `${(i * 53 + 7) % 100}%`, opacity: 0.4 + (i % 5) * 0.12 }} />
        ))}
      </div>

      {/* ── TOP BAR: 메뉴 + AI 영역 ── */}
      <div className="flex items-center px-3 py-2 gap-3 z-10">
        {/* 메뉴로 돌아가기 */}
        <button
          onClick={() => resetGame()}
          className="px-3 py-1 bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white text-xs font-bold rounded-lg border border-gray-600 transition-all flex-shrink-0"
        >
          ← 메뉴
        </button>

        <HeroPortrait
          hero={game.aiHero}
          isEnemy
          onClick={isAIHeroAttackable ? handleAIHeroClick : undefined}
          isAttackable={isAIHeroAttackable}
        />

        <div className="flex-1" />

        <div className="text-gray-400 text-xs hidden sm:block">
          핸드: {game.aiHand.length}장 | 덱: {game.aiDeck.length}장
        </div>
        <ManaBar current={game.aiMana} max={game.aiMaxMana} />

        {/* 도움말 */}
        <button
          onClick={() => setShowHelp(true)}
          className="w-7 h-7 rounded-full bg-purple-700 hover:bg-purple-600 text-white text-sm font-bold border border-purple-400 flex items-center justify-center transition-all flex-shrink-0"
        >
          ?
        </button>
      </div>

      {/* ── AI FIELD ── */}
      <div className="flex justify-center gap-2 px-4 py-1 z-10">
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

      {/* ── STATUS BAR ── */}
      <div className={`
        mx-4 py-1.5 px-4 rounded-lg text-center text-xs font-medium z-10 transition-all
        ${uiMode === 'idle' ? 'text-gray-400 bg-black/20' : 'text-yellow-300 bg-yellow-900/30 border border-yellow-700/50'}
      `}>
        {getStatusMsg()}
      </div>

      {/* ── DIVIDER ── */}
      <div className="flex items-center gap-4 px-6 py-1 z-10">
        <div className="flex-1 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="text-purple-300 text-sm font-bold tracking-widest">
          TURN {game.turn}
        </div>
        <div className="flex-1 h-px bg-gradient-to-l from-transparent via-purple-500/50 to-transparent" />
      </div>

      {/* ── PLAYER FIELD ── */}
      <div className="flex justify-center gap-2 px-4 py-1 z-10 relative">
        {Array.from({ length: 6 }).map((_, i) => {
          const minion = playerField[i] ?? null;
          const isSelected = minion?.instanceId === selectedMinionId;
          const isPlayTarget = (uiMode === 'placing' || dragCardId !== null) && !minion;
          return (
            <FieldSlot
              key={i}
              slot={i}
              minion={minion}
              isOwn={true}
              isSelected={isSelected}
              isPlayTarget={isPlayTarget}
              onClick={() => handleOwnSlotClick(i, minion)}
              onDrop={handleDrop}
            />
          );
        })}

        {/* Ability panel */}
        {uiMode === 'selected_minion' && selectedMinion && (
          <AbilityPanel
            minion={selectedMinion}
            onUseAttack={handleUseAttackAbility}
            onUseDefense={handleUseDefenseAbility}
            onClose={resetUI}
          />
        )}
      </div>

      {/* ── 공격 버튼 (선택된 미니언이 공격 가능할 때) ── */}
      <div className="flex justify-center gap-2 z-10 h-8">
        {uiMode === 'selected_minion' && selectedMinion && (
          <>
            {selectedMinion.attacksLeftThisTurn > 0 ? (
              <button
                onClick={handleStartAttack}
                className="px-5 py-1 bg-red-600 hover:bg-red-500 text-white text-sm font-bold rounded-full border border-red-400 shadow-lg transition-all animate-pulse"
              >
                ⚔️ 공격하기
              </button>
            ) : (
              <span className="text-gray-500 text-xs self-center">이미 공격했거나 소환된 턴</span>
            )}
          </>
        )}
      </div>

      {/* ── PLAYER INFO BAR ── */}
      <div className="flex items-center px-3 py-1 gap-3 z-10">
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
          {isPlayerTurn ? '턴 종료 →' : '⏳ AI...'}
        </button>
      </div>

      {/* ── HAND ── */}
      <div className="flex justify-center gap-2 px-4 pb-2 z-10 overflow-x-auto min-h-[11rem] items-end">
        {game.playerHand.map((card) => (
          <HandCard
            key={card.id}
            card={card}
            isSelected={selectedCard?.id === card.id}
            isPlayable={game.playerMana >= card.mana && isPlayerTurn}
            onClick={() => handleHandCardClick(card)}
            onDragStart={() => handleDragStart(card)}
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
                  onClick={() => resetGame()}
                  className="px-8 py-3 bg-gray-700 hover:bg-gray-600 text-white font-bold rounded-xl border border-gray-500 text-lg transition-all"
                >
                  ← 메인 메뉴
                </button>
                <button
                  onClick={() => useGameStore.getState().startGame()}
                  className="px-8 py-3 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl border border-green-400 text-lg transition-all"
                >
                  🔄 다시 하기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HOW TO PLAY ── */}
      {showHelp && <HowToPlay onClose={() => setShowHelp(false)} />}
    </div>
  );
}
