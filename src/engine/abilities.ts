import type { GameState, Minion, StatusEffect } from '../types/game';
import { CARD_DEFS } from '../data/cards';

let idCounter = 0;
export function makeId() {
  return `m_${++idCounter}_${Date.now()}`;
}

function compactField(field: (Minion | null)[]): (Minion | null)[] {
  const minions = field.filter((m): m is Minion => m !== null);
  const result: (Minion | null)[] = Array(6).fill(null);
  minions.forEach((m, i) => {
    m.position = i;
    result[i] = m;
  });
  return result;
}

function addLog(state: GameState, msg: string) {
  state.log = [msg, ...state.log.slice(0, 49)];
}

export function applyDeath(state: GameState): GameState {
  let s = { ...state };

  const checkField = (
    field: (Minion | null)[],
    isPlayer: boolean
  ): (Minion | null)[] => {
    return field.map((m) => {
      if (!m || m.hp > 0) return m;

      if (m.defenseAbility.type === 'revive_once' && m.revivesLeft > 0) {
        addLog(s, `${m.name} 불사의 갈기 발동! 절반 HP로 부활!`);
        return { ...m, hp: Math.ceil(m.maxHp / 2), revivesLeft: m.revivesLeft - 1 };
      }
      if (m.defenseAbility.type === 'cond_revive' && m.revivesLeft > 0) {
        addLog(s, `${m.name} 부활 발동! HP 1로 재기!`);
        return { ...m, hp: 1, revivesLeft: m.revivesLeft - 1 };
      }

      addLog(s, `${m.name} 사망!`);
      // trigger ally cond_revive (sagittarius style)
      const allyField = isPlayer ? s.playerField : s.aiField;
      allyField.forEach((ally) => {
        if (
          ally &&
          ally.instanceId !== m.instanceId &&
          ally.defenseAbility.type === 'cond_revive' &&
          ally.revivesLeft > 0 &&
          ally.hp <= 0
        ) {
          // handled in their own death check
        }
      });
      return null;
    });
  };

  s.playerField = checkField(s.playerField, true);
  s.aiField = checkField(s.aiField, false);
  s.playerField = compactField(s.playerField);
  s.aiField = compactField(s.aiField);
  return s;
}

export function checkCoupleBonus(state: GameState): GameState {
  const applyCouple = (field: (Minion | null)[]): (Minion | null)[] => {
    return field.map((m, i) => {
      if (!m) return null;
      if (m.cardId !== 'pisces') return m;
      const left = field[i - 1];
      const right = field[i + 1];
      const hasAquarius =
        (left && left.cardId === 'aquarius') ||
        (right && right.cardId === 'aquarius');
      const base = CARD_DEFS.find((c) => c.id === 'pisces')!;
      if (hasAquarius) {
        return { ...m, atk: base.atk + 2, maxHp: base.hp + 2, hp: Math.min(m.hp + 2, base.hp + 2) };
      }
      return { ...m, atk: base.atk, maxHp: base.hp };
    });
  };
  return {
    ...state,
    playerField: applyCouple(state.playerField),
    aiField: applyCouple(state.aiField),
  };
}

export function doAttack(
  state: GameState,
  attackerInstanceId: string,
  targetInstanceId: string | 'player_hero' | 'ai_hero'
): GameState {
  let s = { ...state };

  const isPlayerAttacker = s.playerField.some(
    (m) => m?.instanceId === attackerInstanceId
  );
  const attackerField = isPlayerAttacker ? s.playerField : s.aiField;
  const attacker = attackerField.find(
    (m) => m?.instanceId === attackerInstanceId
  ) as Minion;

  if (!attacker || attacker.attacksLeftThisTurn <= 0) return s;

  let atk = attacker.atk;
  let newAttacker = { ...attacker };

  if (newAttacker.statusEffects.includes('double_power')) {
    atk *= 2;
    newAttacker.statusEffects = newAttacker.statusEffects.filter(
      (e) => e !== 'double_power'
    );
    addLog(s, `${attacker.name} 독침 발동! ATK ${atk}으로 공격!`);
  }

  newAttacker.attacksLeftThisTurn -= 1;
  newAttacker.hasAttackedThisTurn = true;

  if (targetInstanceId === 'player_hero') {
    s.playerHero = { ...s.playerHero, hp: s.playerHero.hp - atk };
    addLog(s, `${attacker.name}이 플레이어 영웅에게 ${atk} 피해!`);
  } else if (targetInstanceId === 'ai_hero') {
    s.aiHero = { ...s.aiHero, hp: s.aiHero.hp - atk };
    addLog(s, `${attacker.name}이 AI 영웅에게 ${atk} 피해!`);
  } else {
    const targetField = s.playerField.some(
      (m) => m?.instanceId === targetInstanceId
    )
      ? 'playerField'
      : 'aiField';
    const targetMinion = s[targetField].find(
      (m) => m?.instanceId === targetInstanceId
    ) as Minion;

    if (!targetMinion) return s;

    // cond_disguise: evade targeting once
    if (
      targetMinion.statusEffects.includes('cond_disguise') &&
      targetMinion.defenseAbilityUsesLeft > 0
    ) {
      addLog(s, `${targetMinion.name} 둔갑술 발동! 공격 회피!`);
      const updatedTarget = {
        ...targetMinion,
        defenseAbilityUsesLeft: targetMinion.defenseAbilityUsesLeft - 1,
        statusEffects: targetMinion.statusEffects.filter(
          (e) => e !== 'cond_disguise'
        ),
      };
      s[targetField] = s[targetField].map((m) =>
        m?.instanceId === targetInstanceId ? updatedTarget : m
      );
      // attacker still used attack
      const af = isPlayerAttacker ? 'playerField' : 'aiField';
      s[af] = s[af].map((m) =>
        m?.instanceId === attackerInstanceId ? newAttacker : m
      );
      return applyDeath(s);
    }

    let dmg = atk;
    let heroSpillover = 0;

    if (newAttacker.attackAbility.type === 'piercing') {
      heroSpillover = dmg;
    }

    const updatedTarget = { ...targetMinion, hp: targetMinion.hp - dmg };
    addLog(s, `${attacker.name}이 ${targetMinion.name}에게 ${dmg} 피해! (남은 HP: ${Math.max(0, updatedTarget.hp)})`);

    if (heroSpillover > 0) {
      if (targetField === 'aiField') {
        s.aiHero = { ...s.aiHero, hp: s.aiHero.hp - heroSpillover };
        addLog(s, `황금 화살 관통! AI 영웅에게 ${heroSpillover} 추가 피해!`);
      } else {
        s.playerHero = { ...s.playerHero, hp: s.playerHero.hp - heroSpillover };
        addLog(s, `황금 화살 관통! 플레이어 영웅에게 ${heroSpillover} 추가 피해!`);
      }
    }

    s[targetField] = s[targetField].map((m) =>
      m?.instanceId === targetInstanceId ? updatedTarget : m
    );
  }

  const af = isPlayerAttacker ? 'playerField' : 'aiField';
  s[af] = s[af].map((m) =>
    m?.instanceId === attackerInstanceId ? newAttacker : m
  );

  s = applyDeath(s);
  s = checkCoupleBonus(s);
  return s;
}

export function useAttackAbility(
  state: GameState,
  sourceId: string,
  targets: string[]
): GameState {
  let s = { ...state };
  const isPlayer = s.playerField.some((m) => m?.instanceId === sourceId);
  const field = isPlayer ? 'playerField' : 'aiField';
  const source = s[field].find((m) => m?.instanceId === sourceId) as Minion;
  if (!source) return s;

  const ability = source.attackAbility;

  switch (ability.type) {
    case 'double_shot': {
      addLog(s, `${source.name} 재돌진! 이번 턴 2번 공격 가능!`);
      const updated = { ...source, attacksLeftThisTurn: 2 };
      s[field] = s[field].map((m) => (m?.instanceId === sourceId ? updated : m));
      break;
    }

    case 'double_turn': {
      addLog(s, `${source.name} 더블 러시! 추가 턴 획득!`);
      s.extraTurn = true;
      break;
    }

    case 'knockback': {
      const targetId = targets[0];
      const tf = s.playerField.some((m) => m?.instanceId === targetId)
        ? 'playerField'
        : 'aiField';
      const target = s[tf].find((m) => m?.instanceId === targetId) as Minion;
      if (target) {
        const newPos = Math.min(5, target.position + 1);
        if (s[tf][newPos] === null) {
          const moved = { ...target, position: newPos };
          const newField = [...s[tf]];
          newField[target.position] = null;
          newField[newPos] = moved;
          s[tf] = newField;
          addLog(s, `${source.name} 연타! ${target.name}을 ${newPos}번 슬롯으로 밀어냄!`);
        }
      }
      break;
    }

    case 'snipe': {
      targets.forEach((tid) => {
        const tf = s.playerField.some((m) => m?.instanceId === tid)
          ? 'playerField'
          : 'aiField';
        s[tf] = s[tf].map((m) => {
          if (m?.instanceId !== tid) return m;
          addLog(s, `${source.name} 저격! ${m.name}에게 ${source.atk} 피해!`);
          return { ...m, hp: m.hp - source.atk };
        });
      });
      s = applyDeath(s);
      break;
    }

    case 'push_two': {
      targets.forEach((tid) => {
        const tf = s.playerField.some((m) => m?.instanceId === tid)
          ? 'playerField'
          : 'aiField';
        const target = s[tf].find((m) => m?.instanceId === tid) as Minion;
        if (target) {
          const newPos = Math.min(5, target.position + 1);
          if (s[tf][newPos] === null) {
            const moved = { ...target, position: newPos };
            const newField = [...s[tf]];
            newField[target.position] = null;
            newField[newPos] = moved;
            s[tf] = newField;
            addLog(s, `${source.name} 충격파! ${target.name}을 밀어냄!`);
          }
        }
      });
      break;
    }

    case 'push_all': {
      const tf = isPlayer ? 'aiField' : 'playerField';
      const minions = s[tf].filter((m): m is Minion => m !== null);
      const newField: (Minion | null)[] = Array(6).fill(null);
      minions.forEach((m, i) => {
        const pos = 5 - i;
        newField[pos] = { ...m, position: pos };
      });
      s[tf] = newField;
      addLog(s, `${source.name} 팬플루트! 모든 적을 가장자리로 밀어냄!`);
      break;
    }

    case 'pull': {
      const targetId = targets[0];
      const tf = s.playerField.some((m) => m?.instanceId === targetId)
        ? 'playerField'
        : 'aiField';
      const target = s[tf].find((m) => m?.instanceId === targetId) as Minion;
      if (target && target.position !== 0) {
        const newField = [...s[tf]];
        newField[target.position] = null;
        if (newField[0] === null) {
          newField[0] = { ...target, position: 0 };
          s[tf] = newField;
          addLog(s, `${source.name} 발톱! ${target.name}을 0번 슬롯으로 끌어당김!`);
        }
      }
      break;
    }

    case 'summon_star': {
      const targetField = isPlayer ? 'playerField' : 'aiField';
      const emptySlots = s[targetField]
        .map((m, i) => (m === null ? i : -1))
        .filter((i) => i >= 0);
      const starDef = CARD_DEFS.find((c) => c.id === 'aries')!;
      emptySlots.forEach((slot) => {
        const star: Minion = {
          instanceId: makeId(),
          cardId: 'star',
          name: '별 토큰',
          sign: '⭐',
          atk: 1,
          hp: 1,
          maxHp: 1,
          image: '',
          position: slot,
          attackAbility: starDef.attackAbility,
          defenseAbility: starDef.defenseAbility,
          attackAbilityUsesLeft: 0,
          defenseAbilityUsesLeft: 0,
          hasAttackedThisTurn: false,
          attacksLeftThisTurn: 0,
          statusEffects: ['summoning_sickness'],
          disguisedAs: null,
          revivesLeft: 0,
        };
        s[targetField] = [...s[targetField]];
        s[targetField][slot] = star;
      });
      addLog(s, `${source.name} 새싹 소환! 별 토큰 ${emptySlots.length}개 등장!`);
      break;
    }

    case 'push_outward': {
      const tf = isPlayer ? 'aiField' : 'playerField';
      const pisces = s[field].find((m) => m?.instanceId === sourceId) as Minion;
      if (!pisces) break;
      // In opponent's field, push cards adjacent to the "center" positions (0,1)
      const newField = [...s[tf]];
      for (let i = 0; i < 6; i++) {
        const m = newField[i];
        if (!m) continue;
        const newPos = Math.min(5, m.position + 1);
        if (newField[newPos] === null && newPos !== m.position) {
          newField[m.position] = null;
          newField[newPos] = { ...m, position: newPos };
        }
      }
      s[tf] = compactField(newField);
      addLog(s, `${source.name} 소용돌이! 인접 적들을 바깥으로 밀어냄!`);
      break;
    }

    default:
      break;
  }

  return s;
}

export function useDefenseAbility(
  state: GameState,
  sourceId: string,
  targets: string[]
): GameState {
  let s = { ...state };
  const isPlayer = s.playerField.some((m) => m?.instanceId === sourceId);
  const field = isPlayer ? 'playerField' : 'aiField';
  const source = s[field].find((m) => m?.instanceId === sourceId) as Minion;
  if (!source || source.defenseAbilityUsesLeft <= 0) return s;

  const ability = source.defenseAbility;

  switch (ability.type) {
    case 'ghost': {
      addLog(s, `${source.name} 하얀 환영! 이번 턴 면역!`);
      const updated = {
        ...source,
        statusEffects: [...source.statusEffects, 'ghost' as StatusEffect],
        defenseAbilityUsesLeft: source.defenseAbilityUsesLeft - 1,
      };
      s[field] = s[field].map((m) => (m?.instanceId === sourceId ? updated : m));
      break;
    }

    case 'lockdown': {
      const targetId = targets[0];
      const tf = s.playerField.some((m) => m?.instanceId === targetId)
        ? 'playerField'
        : 'aiField';
      s[tf] = s[tf].map((m) => {
        if (m?.instanceId !== targetId) return m;
        if (m.statusEffects.includes('cond_reverse') && m.defenseAbilityUsesLeft > 0) {
          addLog(s, `${m.name} 넥타르 발동! 발목잡기 무효화!`);
          return { ...m, defenseAbilityUsesLeft: m.defenseAbilityUsesLeft - 1, statusEffects: m.statusEffects.filter(e => e !== 'cond_reverse') };
        }
        addLog(s, `${source.name} 발목잡기! ${m.name}은 다음 턴 공격 불가!`);
        return { ...m, statusEffects: [...m.statusEffects, 'lockdown' as StatusEffect] };
      });
      const updated = { ...source, defenseAbilityUsesLeft: source.defenseAbilityUsesLeft - 1 };
      s[field] = s[field].map((m) => (m?.instanceId === sourceId ? updated : m));
      break;
    }

    case 'align': {
      const allMinions = [
        ...s.playerField.filter((m): m is Minion => m !== null),
        ...s.aiField.filter((m): m is Minion => m !== null),
      ];
      if (allMinions.length === 0) break;
      const avg = Math.round(allMinions.reduce((sum, m) => sum + m.hp, 0) / allMinions.length);
      addLog(s, `${source.name} 평형 초기화! 전체 미니언 HP → ${avg}`);
      s.playerField = s.playerField.map((m) =>
        m ? { ...m, hp: Math.min(avg, m.maxHp) } : null
      );
      s.aiField = s.aiField.map((m) =>
        m ? { ...m, hp: Math.min(avg, m.maxHp) } : null
      );
      const updated = { ...source, defenseAbilityUsesLeft: source.defenseAbilityUsesLeft - 1 };
      s[field] = s[field].map((m) => (m?.instanceId === sourceId ? updated : m));
      s = applyDeath(s);
      break;
    }

    case 'swap': {
      const targetId = targets[0];
      const minionA = s[field].find((m) => m?.instanceId === sourceId) as Minion;
      const minionB = s[field].find((m) => m?.instanceId === targetId) as Minion;
      if (!minionA || !minionB) break;
      addLog(s, `${minionA.name} 위치 교환!`);
      const newField = [...s[field]];
      newField[minionA.position] = { ...minionB, position: minionA.position };
      newField[minionB.position] = { ...minionA, position: minionB.position };
      s[field] = newField;
      break;
    }

    case 'double_power': {
      addLog(s, `${source.name} 독침 준비! 다음 공격 ATK 2배!`);
      const updated = {
        ...source,
        statusEffects: [...source.statusEffects, 'double_power' as StatusEffect],
        defenseAbilityUsesLeft: source.defenseAbilityUsesLeft - 1,
      };
      s[field] = s[field].map((m) => (m?.instanceId === sourceId ? updated : m));
      break;
    }

    case 'cond_disguise': {
      addLog(s, `${source.name} 둔갑술 준비! 다음 타겟팅 회피!`);
      const updated = {
        ...source,
        statusEffects: [...source.statusEffects, 'cond_disguise' as StatusEffect],
        defenseAbilityUsesLeft: source.defenseAbilityUsesLeft - 1,
      };
      s[field] = s[field].map((m) => (m?.instanceId === sourceId ? updated : m));
      break;
    }

    case 'cond_reverse': {
      addLog(s, `${source.name} 넥타르 준비! 다음 디버프 무효화!`);
      const updated = {
        ...source,
        statusEffects: [...source.statusEffects, 'cond_reverse' as StatusEffect],
        defenseAbilityUsesLeft: source.defenseAbilityUsesLeft - 1,
      };
      s[field] = s[field].map((m) => (m?.instanceId === sourceId ? updated : m));
      break;
    }

    default:
      break;
  }

  return s;
}
