import type { Minion } from '../types/game';

interface Props {
  minion: Minion;
  onUseAttack: () => void;
  onUseDefense: () => void;
  onClose: () => void;
}

const PASSIVE_ATTACK = new Set(['piercing']);
const PASSIVE_DEFENSE = new Set(['cond_revive', 'revive_once', 'cond_couple', 'cond_swap']);

export default function AbilityPanel({ minion, onUseAttack, onUseDefense, onClose }: Props) {
  const atkType = minion.attackAbility.type;
  const defType = minion.defenseAbility.type;

  const atkIsNone = atkType === 'none';
  const defIsNone = defType === 'none';
  const atkIsPassive = PASSIVE_ATTACK.has(atkType);
  const defIsPassive = PASSIVE_DEFENSE.has(defType);
  const atkUsed = !atkIsNone && !atkIsPassive && minion.attackAbilityUsesLeft <= 0;
  const defUsed = !defIsNone && !defIsPassive && minion.defenseAbilityUsesLeft <= 0;

  return (
    <div className="absolute bottom-36 left-1/2 -translate-x-1/2 bg-gray-900/95 border border-yellow-600/60 rounded-xl p-4 z-50 w-80 shadow-2xl">
      <div className="text-yellow-300 font-bold text-center mb-3">{minion.name} 스킬</div>

      <div className="space-y-2">
        {/* Attack Ability */}
        {atkIsNone ? (
          <div className="px-3 py-2 rounded-lg border border-gray-700 text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚔️</span>
              <div>
                <div className="font-bold text-sm">기본 공격</div>
                <div className="text-xs text-gray-600">특수 능력 없음</div>
              </div>
            </div>
          </div>
        ) : atkIsPassive ? (
          <div className="px-3 py-2 rounded-lg border border-orange-900/50 bg-orange-950/20">
            <div className="flex items-start gap-2">
              <span className="text-lg">⚔️</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-orange-300">{minion.attackAbility.nameKo}</span>
                  <span className="text-[9px] bg-orange-800/60 text-orange-200 px-1.5 py-0.5 rounded-full">자동발동</span>
                </div>
                <div className="text-xs text-gray-400">{minion.attackAbility.descKo}</div>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onUseAttack}
            disabled={atkUsed}
            className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
              atkUsed
                ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                : 'border-orange-500 hover:bg-orange-500/20 text-orange-300 cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">⚔️</span>
              <div>
                <div className="font-bold text-sm">{minion.attackAbility.nameKo}</div>
                <div className="text-xs text-gray-400">{minion.attackAbility.descKo}</div>
                {!atkUsed && (
                  <div className="text-xs text-orange-400 mt-0.5">남은 사용: {minion.attackAbilityUsesLeft}</div>
                )}
                {atkUsed && <div className="text-xs text-gray-500 mt-0.5">사용 완료</div>}
              </div>
            </div>
          </button>
        )}

        {/* Defense Ability */}
        {defIsNone ? (
          <div className="px-3 py-2 rounded-lg border border-gray-700 text-gray-600">
            <div className="flex items-start gap-2">
              <span className="text-lg">🛡️</span>
              <div>
                <div className="font-bold text-sm">특수 능력 없음</div>
                <div className="text-xs text-gray-600">방어 능력이 없습니다</div>
              </div>
            </div>
          </div>
        ) : defIsPassive ? (
          <div className="px-3 py-2 rounded-lg border border-blue-900/50 bg-blue-950/20">
            <div className="flex items-start gap-2">
              <span className="text-lg">🛡️</span>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-blue-300">{minion.defenseAbility.nameKo}</span>
                  <span className="text-[9px] bg-blue-800/60 text-blue-200 px-1.5 py-0.5 rounded-full">자동발동</span>
                </div>
                <div className="text-xs text-gray-400">{minion.defenseAbility.descKo}</div>
                {minion.defenseAbilityUsesLeft > 0 && (
                  <div className="text-xs text-blue-400 mt-0.5">발동 가능: {minion.defenseAbilityUsesLeft}회</div>
                )}
                {minion.defenseAbilityUsesLeft <= 0 && (
                  <div className="text-xs text-gray-500 mt-0.5">이미 발동됨</div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={onUseDefense}
            disabled={defUsed}
            className={`w-full text-left px-3 py-2 rounded-lg border transition-all ${
              defUsed
                ? 'border-gray-600 text-gray-500 cursor-not-allowed'
                : 'border-blue-500 hover:bg-blue-500/20 text-blue-300 cursor-pointer'
            }`}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">🛡️</span>
              <div>
                <div className="font-bold text-sm">{minion.defenseAbility.nameKo}</div>
                <div className="text-xs text-gray-400">{minion.defenseAbility.descKo}</div>
                {!defUsed && (
                  <div className="text-xs text-blue-400 mt-0.5">남은 사용: {minion.defenseAbilityUsesLeft}</div>
                )}
                {defUsed && <div className="text-xs text-gray-500 mt-0.5">사용 완료</div>}
              </div>
            </div>
          </button>
        )}
      </div>

      <button
        onClick={onClose}
        className="mt-3 w-full text-center text-gray-400 hover:text-white text-sm py-1"
      >
        닫기
      </button>
    </div>
  );
}
