import type { GameState, Minion } from '../types/game';
import { cardDefToMinion } from './gameEngine';
import { doAttack, useAttackAbility, applyDeath, checkCoupleBonus } from './abilities';
import { checkWin, endAITurn } from './gameEngine';

function addLog(state: GameState, msg: string): GameState {
  return { ...state, log: [`[AI] ${msg}`, ...state.log.slice(0, 49)] };
}

function findEmptySlot(field: (Minion | null)[]): number {
  return field.findIndex((m) => m === null);
}

export function runAITurn(state: GameState): GameState {
  let s = { ...state };

  // Enable AI minions to attack
  s.aiField = s.aiField.map((m) => {
    if (!m) return null;
    const canAttack = !m.statusEffects.includes('lockdown') &&
                      !m.statusEffects.includes('summoning_sickness');
    return {
      ...m,
      attacksLeftThisTurn: canAttack ? 1 : 0,
      hasAttackedThisTurn: false,
    };
  });

  // 1. Play cards greedily (highest mana cost first that fits)
  const sortedHand = [...s.aiHand].sort((a, b) => b.mana - a.mana);
  for (const card of sortedHand) {
    if (s.aiMana >= card.mana) {
      const slot = findEmptySlot(s.aiField);
      if (slot >= 0) {
        const minion = cardDefToMinion(card, slot);
        const newField = [...s.aiField];
        newField[slot] = minion;
        s = {
          ...s,
          aiField: newField,
          aiHand: s.aiHand.filter((c) => c.id !== card.id),
          aiMana: s.aiMana - card.mana,
        };
        s = addLog(s, `${card.name} 소환! (마나 ${card.mana} 소비)`);
        s = checkCoupleBonus(s);
      }
    }
  }

  // 2. Use attack abilities (simple heuristic)
  for (const minion of s.aiField.filter((m): m is Minion => m !== null)) {
    const ability = minion.attackAbility;
    const enemyMinions = s.playerField.filter((m): m is Minion => m !== null);
    const m = s.aiField.find((m) => m?.instanceId === minion.instanceId) as Minion;
    if (!m) continue;

    switch (ability.type) {
      case 'double_shot':
        if (m.attackAbilityUsesLeft > 0) {
          s = useAttackAbility(s, m.instanceId, []);
          s.aiField = s.aiField.map((x) =>
            x?.instanceId === m.instanceId
              ? { ...x, attackAbilityUsesLeft: x.attackAbilityUsesLeft - 1 }
              : x
          );
        }
        break;
      case 'double_turn':
        if (m.attackAbilityUsesLeft > 0) {
          s = useAttackAbility(s, m.instanceId, []);
          s.aiField = s.aiField.map((x) =>
            x?.instanceId === m.instanceId
              ? { ...x, attackAbilityUsesLeft: x.attackAbilityUsesLeft - 1 }
              : x
          );
        }
        break;
      case 'push_all':
        if (m.attackAbilityUsesLeft > 0 && enemyMinions.length > 0) {
          s = useAttackAbility(s, m.instanceId, []);
          s.aiField = s.aiField.map((x) =>
            x?.instanceId === m.instanceId
              ? { ...x, attackAbilityUsesLeft: x.attackAbilityUsesLeft - 1 }
              : x
          );
        }
        break;
      case 'snipe':
        if (m.attackAbilityUsesLeft > 0 && enemyMinions.length > 0) {
          const targets = enemyMinions
            .sort((a, b) => a.hp - b.hp)
            .slice(0, 2)
            .map((e) => e.instanceId);
          s = useAttackAbility(s, m.instanceId, targets);
          s.aiField = s.aiField.map((x) =>
            x?.instanceId === m.instanceId
              ? { ...x, attackAbilityUsesLeft: Math.max(0, x.attackAbilityUsesLeft - 1) }
              : x
          );
        }
        break;
      case 'summon_star':
        if (m.attackAbilityUsesLeft > 0 && findEmptySlot(s.aiField) >= 0) {
          s = useAttackAbility(s, m.instanceId, []);
          s.aiField = s.aiField.map((x) =>
            x?.instanceId === m.instanceId
              ? { ...x, attackAbilityUsesLeft: x.attackAbilityUsesLeft - 1 }
              : x
          );
        }
        break;
      default:
        break;
    }
  }

  // 3. Attack: prioritize killing player minions, then hero
  for (const minion of s.aiField.filter((m): m is Minion => m !== null)) {
    const m = s.aiField.find((x) => x?.instanceId === minion.instanceId) as Minion;
    if (!m || m.attacksLeftThisTurn <= 0) continue;

    const enemyMinions = s.playerField.filter((e): e is Minion => e !== null && !e.statusEffects.includes('ghost'));

    // Find a target we can kill
    const killTarget = enemyMinions.find((e) => e.hp <= m.atk);
    if (killTarget) {
      s = doAttack(s, m.instanceId, killTarget.instanceId);
    } else if (enemyMinions.length > 0) {
      // Attack weakest minion
      const weakest = [...enemyMinions].sort((a, b) => a.hp - b.hp)[0];
      s = doAttack(s, m.instanceId, weakest.instanceId);
    } else {
      // Attack hero directly
      s = doAttack(s, m.instanceId, 'player_hero');
    }

    s = checkWin(s);
    if (s.phase === 'game_over') return s;
  }

  s = applyDeath(s);
  s = endAITurn(s);
  return checkWin(s);
}
