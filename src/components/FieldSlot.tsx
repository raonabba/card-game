import type { Minion } from '../types/game';
import { FieldCard } from './CardComponent';

interface Props {
  slot: number;
  minion: Minion | null;
  isOwn: boolean;
  isPlayTarget?: boolean;
  isAttackable?: boolean;
  isSelected?: boolean;
  onClick: () => void;
}

export default function FieldSlot({
  slot: _slot,
  minion,
  isOwn,
  isPlayTarget,
  isAttackable,
  isSelected,
  onClick,
}: Props) {
  if (minion) {
    return (
      <FieldCard
        minion={minion}
        isOwn={isOwn}
        isSelected={isSelected}
        isAttackable={isAttackable}
        onClick={onClick}
      />
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        w-20 h-28 rounded-lg border-2 border-dashed flex items-center justify-center
        transition-all duration-200 cursor-pointer
        ${isPlayTarget
          ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_10px_rgba(250,204,21,0.4)]'
          : 'border-gray-600/40 hover:border-gray-400/60'
        }
      `}
    >
      {isPlayTarget && (
        <span className="text-yellow-300 text-2xl">+</span>
      )}
    </div>
  );
}
