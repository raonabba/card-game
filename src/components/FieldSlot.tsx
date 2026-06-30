import { useState } from 'react';
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
  onDrop?: (slot: number) => void;
}

export default function FieldSlot({
  slot: _slot,
  minion,
  isOwn,
  isPlayTarget,
  isAttackable,
  isSelected,
  onClick,
  onDrop,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    if (!isOwn || minion) return;
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => setIsDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (!isOwn || minion) return;
    onDrop?.(_slot);
  };

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
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={`
        w-20 h-28 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1
        transition-all duration-150 cursor-pointer
        ${isDragOver
          ? 'border-yellow-300 bg-yellow-300/20 scale-105 shadow-[0_0_16px_rgba(250,204,21,0.6)]'
          : isPlayTarget
            ? 'border-yellow-400 bg-yellow-400/10 shadow-[0_0_10px_rgba(250,204,21,0.4)]'
            : 'border-gray-600/40 hover:border-gray-400/60 hover:bg-white/5'
        }
      `}
    >
      {(isPlayTarget || isDragOver) && (
        <>
          <span className="text-yellow-300 text-2xl">+</span>
          <span className="text-yellow-300/70 text-[9px]">여기에 놓기</span>
        </>
      )}
    </div>
  );
}
