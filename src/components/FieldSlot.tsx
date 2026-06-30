import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Minion } from '../types/game';
import { FieldCard } from './CardComponent';

interface Props {
  slot: number;
  minion: Minion | null;
  isOwn: boolean;
  isPlayTarget?: boolean;
  isAttackable?: boolean;
  isSelected?: boolean;
  isAttacking?: boolean;
  isHit?: boolean;
  onClick: () => void;
  onDrop?: (slot: number) => void;
}

const STAR_ANGLES = [0, 60, 120, 180, 240, 300];

export default function FieldSlot({
  slot: _slot,
  minion,
  isOwn,
  isPlayTarget,
  isAttackable,
  isSelected,
  isAttacking,
  isHit,
  onClick,
  onDrop,
}: Props) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [showStars, setShowStars] = useState(false);
  const [starKey, setStarKey] = useState(0);
  const prevMinionRef = useRef<Minion | null>(null);

  useEffect(() => {
    if (prevMinionRef.current && !minion) {
      setShowStars(true);
      setStarKey(k => k + 1);
      setTimeout(() => setShowStars(false), 750);
    }
    prevMinionRef.current = minion;
  }, [minion]);

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

  return (
    <div className="relative w-20 h-28">
      {/* Empty droppable slot — always mounted */}
      <div
        onClick={minion ? undefined : onClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          absolute inset-0 rounded-lg border-2 border-dashed flex flex-col items-center justify-center gap-1
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

      {/* Star death particles */}
      <AnimatePresence>
        {showStars && (
          <div key={starKey} className="absolute inset-0 pointer-events-none z-30 overflow-visible">
            {STAR_ANGLES.map((deg, i) => (
              <motion.span
                key={i}
                className="absolute text-yellow-200 text-sm font-bold"
                style={{ left: '50%', top: '50%', marginLeft: '-7px', marginTop: '-7px' }}
                initial={{ opacity: 1, x: 0, y: 0, scale: 1.6 }}
                animate={{
                  opacity: 0,
                  x: Math.cos((deg * Math.PI) / 180) * 52,
                  y: Math.sin((deg * Math.PI) / 180) * 52,
                  scale: 0.2,
                }}
                transition={{ duration: 0.65, ease: 'easeOut', delay: i * 0.03 }}
              >
                ✦
              </motion.span>
            ))}
          </div>
        )}
      </AnimatePresence>

      {/* Field card — AnimatePresence plays exit animation on death */}
      <AnimatePresence>
        {minion && (
          <motion.div
            key={minion.instanceId}
            className="absolute inset-0"
            exit={{
              opacity: 0,
              scale: 0.08,
              y: -16,
              filter: 'brightness(8) blur(4px)',
              transition: { duration: 0.45, ease: 'easeOut' },
            }}
          >
            <FieldCard
              minion={minion}
              isOwn={isOwn}
              isSelected={isSelected}
              isAttackable={isAttackable}
              isAttacking={isAttacking}
              isHit={isHit}
              onClick={onClick}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
