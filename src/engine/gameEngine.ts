import type { CardDef, GameState, Minion } from '../types/game';
import { CARD_DEFS } from '../data/cards';
import { makeId, checkCoupleBonus } from './abilities';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function cardDefToMinion(card: CardDef, position: number): Minion {
  const maxUsesDef = card.defenseAbility.maxUses ?? 1;
  const maxUsesAtk = card.attackAbility.maxUses ?? 1;
  return {
    instanceId: makeId(),
    cardId: card.id,
    name: card.name,
    sign: card.sign,
    atk: card.atk,
    hp: card.hp,
    maxHp: card.hp,
    image: card.image,
    position,
    attackAbility: card.attackAbility,
    defenseAbility: card.defenseAbility,
    attackAbilityUsesLeft: maxUsesAtk,
    defenseAbilityUsesLeft: maxUsesDef,
    hasAttackedThisTurn: false,
    attacksLeftThisTurn: 0,
    statusEffects: ['summoning_sickness'],
    disguisedAs: null,
    revivesLeft: card.defenseAbility.type === 'revive_once' || card.defenseAbility.type === 'cond_revive' ? 1 : 0,
  };
}

export function initGame(_mode: 'vsAI' | 'local'): GameState {
  const playerDeck = shuffle([...CARD_DEFS]);
  const aiDeck = shuffle([...CARD_DEFS]);

  const playerHand = playerDeck.splice(0, 3);
  const aiHand = aiDeck.splice(0, 4);

  return {
    phase: 'playing',
    activePlayer: 'player',
    turn: 1,
    playerHero: { id: 'player', hp: 30, maxHp: 30 },
    aiHero: { id: 'ai', hp: 30, maxHp: 30 },
    playerField: Array(6).fill(null),
    aiField: Array(6).fill(null),
    playerHand,
    aiHand,
    playerDeck,
    aiDeck,
    playerMana: 1,
    playerMaxMana: 1,
    aiMana: 1,
    aiMaxMana: 1,
    extraTurn: false,
    pendingAction: null,
    selectedMinionId: null,
    log: ['게임 시작! 플레이어 선공.'],
    winner: null,
  };
}

export function playCard(
  state: GameState,
  card: CardDef,
  slot: number
): GameState {
  if (state.activePlayer !== 'player') return state;
  if (state.playerMana < card.mana) return state;
  if (state.playerField[slot] !== null) return state;

  const minion = cardDefToMinion(card, slot);
  const newField = [...state.playerField];
  newField[slot] = minion;

  let s: GameState = {
    ...state,
    playerField: newField,
    playerHand: state.playerHand.filter((c) => c.id !== card.id),
    playerMana: state.playerMana - card.mana,
    log: [`${card.name} 소환! (마나 ${card.mana} 소비)`, ...state.log.slice(0, 49)],
  };

  s = checkCoupleBonus(s);
  return checkWin(s);
}

export function endPlayerTurn(state: GameState): GameState {
  let s = { ...state };

  if (s.extraTurn) {
    s.extraTurn = false;
    s.log = ['더블 러시! 추가 턴!', ...s.log.slice(0, 49)];
    // Reset attacks but keep extra turn for player
    s.playerField = s.playerField.map((m) =>
      m
        ? {
            ...m,
            attacksLeftThisTurn: 0,
            hasAttackedThisTurn: false,
            statusEffects: m.statusEffects.filter(
              (e) => e !== 'summoning_sickness'
            ),
          }
        : null
    );
    return s;
  }

  // Remove ghost/lockdown status effects from both fields at end of turn
  const clearTurnEffects = (field: (Minion | null)[]): (Minion | null)[] =>
    field.map((m) => {
      if (!m) return null;
      return {
        ...m,
        hasAttackedThisTurn: false,
        attacksLeftThisTurn: 0,
        statusEffects: m.statusEffects.filter(
          (e) => e !== 'ghost' && e !== 'summoning_sickness'
        ),
      };
    });

  s.playerField = clearTurnEffects(s.playerField);
  s.activePlayer = 'ai';

  // AI turn: draw + gain mana
  const newMaxMana = Math.min(10, s.aiMaxMana + 1);
  s.aiMaxMana = newMaxMana;
  s.aiMana = newMaxMana;

  if (s.aiDeck.length > 0) {
    const drawn = s.aiDeck[0];
    s.aiHand = [...s.aiHand, drawn];
    s.aiDeck = s.aiDeck.slice(1);
    s.log = [`AI가 카드를 드로우했습니다.`, ...s.log.slice(0, 49)];
  }

  // Remove lockdown (they couldn't attack last turn)
  s.aiField = s.aiField.map((m) => {
    if (!m) return null;
    return {
      ...m,
      statusEffects: m.statusEffects.filter((e) => e !== 'lockdown'),
    };
  });

  return s;
}

export function startPlayerTurn(state: GameState): GameState {
  const newMaxMana = Math.min(10, state.playerMaxMana + 1);
  let s: GameState = {
    ...state,
    turn: state.turn + 1,
    activePlayer: 'player',
    playerMaxMana: newMaxMana,
    playerMana: newMaxMana,
  };

  // Draw card
  if (s.playerDeck.length > 0) {
    const drawn = s.playerDeck[0];
    s.playerHand = [...s.playerHand, drawn];
    s.playerDeck = s.playerDeck.slice(1);
    s.log = [`턴 ${s.turn}: ${drawn.name} 드로우!`, ...s.log.slice(0, 49)];
  }

  // Remove lockdown from player field
  s.playerField = s.playerField.map((m) => {
    if (!m) return null;
    return {
      ...m,
      attacksLeftThisTurn: m.statusEffects.includes('lockdown') ? 0 : 1,
      hasAttackedThisTurn: false,
      statusEffects: m.statusEffects.filter(
        (e) => e !== 'lockdown' && e !== 'summoning_sickness'
      ),
    };
  });

  return s;
}

export function endAITurn(state: GameState): GameState {
  const clearTurnEffects = (field: (Minion | null)[]): (Minion | null)[] =>
    field.map((m) => {
      if (!m) return null;
      return {
        ...m,
        hasAttackedThisTurn: false,
        attacksLeftThisTurn: 0,
        statusEffects: m.statusEffects.filter(
          (e) => e !== 'ghost' && e !== 'summoning_sickness'
        ),
      };
    });

  let s = { ...state };
  s.aiField = clearTurnEffects(s.aiField);

  return startPlayerTurn(s);
}

export function checkWin(state: GameState): GameState {
  if (state.playerHero.hp <= 0) {
    return { ...state, phase: 'game_over', winner: 'ai' };
  }
  if (state.aiHero.hp <= 0) {
    return { ...state, phase: 'game_over', winner: 'player' };
  }
  return state;
}
