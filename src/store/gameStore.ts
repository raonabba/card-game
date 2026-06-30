import { create } from 'zustand';
import type { GameState, CardDef } from '../types/game';
import { initGame, playCard, endPlayerTurn, checkWin } from '../engine/gameEngine';
import { doAttack, useAttackAbility, useDefenseAbility } from '../engine/abilities';
import { runAITurn } from '../engine/ai';

interface GameStore {
  game: GameState | null;
  startGame: () => void;
  resetGame: () => void;
  selectMinion: (instanceId: string | null) => void;
  playCardToSlot: (card: CardDef, slot: number) => void;
  attackTarget: (attackerId: string, targetId: string) => void;
  useAttackSkill: (sourceId: string, targets: string[]) => void;
  useDefenseSkill: (sourceId: string, targets: string[]) => void;
  endTurn: () => void;
}

export const useGameStore = create<GameStore>((set, get) => ({
  game: null,

  startGame: () => {
    set({ game: initGame('vsAI') });
  },

  resetGame: () => {
    set({ game: null });
  },

  selectMinion: (instanceId) => {
    const { game } = get();
    if (!game) return;
    set({ game: { ...game, selectedMinionId: instanceId } });
  },

  playCardToSlot: (card, slot) => {
    const { game } = get();
    if (!game) return;
    const updated = playCard(game, card, slot);
    set({ game: updated });
  },

  attackTarget: (attackerId, targetId) => {
    const { game } = get();
    if (!game) return;
    let updated = doAttack(game, attackerId, targetId);
    updated = checkWin(updated);
    set({ game: { ...updated, selectedMinionId: null, pendingAction: null } });
  },

  useAttackSkill: (sourceId, targets) => {
    const { game } = get();
    if (!game) return;
    let updated = useAttackAbility(game, sourceId, targets);
    // Deduct use
    updated = {
      ...updated,
      playerField: updated.playerField.map((m) =>
        m?.instanceId === sourceId
          ? { ...m, attackAbilityUsesLeft: Math.max(0, m.attackAbilityUsesLeft - 1) }
          : m
      ),
      selectedMinionId: null,
      pendingAction: null,
    };
    updated = checkWin(updated);
    set({ game: updated });
  },

  useDefenseSkill: (sourceId, targets) => {
    const { game } = get();
    if (!game) return;
    let updated = useDefenseSkill_inner(game, sourceId, targets);
    updated = { ...updated, selectedMinionId: null, pendingAction: null };
    set({ game: updated });
  },

  endTurn: () => {
    const { game } = get();
    if (!game || game.activePlayer !== 'player') return;

    let updated = endPlayerTurn(game);
    set({ game: updated });

    // Run AI after short delay
    setTimeout(() => {
      const { game: current } = get();
      if (!current || current.phase === 'game_over') return;
      const afterAI = runAITurn(current);
      set({ game: afterAI });
    }, 1200);
  },
}));

function useDefenseSkill_inner(game: GameState, sourceId: string, targets: string[]) {
  return useDefenseAbility(game, sourceId, targets);
}
