import { motion } from 'framer-motion';
import type { CardDef, Minion } from '../types/game';

interface HandCardProps {
  card: CardDef;
  isSelected?: boolean;
  isPlayable?: boolean;
  onClick?: () => void;
  onDragStart?: () => void;
}

export function HandCard({ card, isSelected, isPlayable, onClick, onDragStart }: HandCardProps) {
  return (
    <motion.div
      whileHover={{ y: -20, scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      draggable={isPlayable}
      onDragStart={(e) => {
        if (!isPlayable) { e.preventDefault(); return; }
        onDragStart?.();
        // Set drag image
        (e as unknown as DragEvent).dataTransfer?.setData('text/plain', card.id);
      }}
      className={`
        relative w-28 h-40 rounded-xl flex-shrink-0 overflow-hidden
        border-2 transition-all duration-200
        ${isSelected ? 'border-yellow-400 card-glow-gold scale-105' : ''}
        ${isPlayable && !isSelected ? 'border-blue-400 cursor-grab active:cursor-grabbing' : ''}
        ${!isPlayable ? 'border-gray-600 opacity-50 cursor-not-allowed' : ''}
        bg-gradient-to-b from-gray-800 to-gray-900
        shadow-xl select-none
      `}
    >
      {/* Mana cost */}
      <div className="absolute top-1 left-1 w-7 h-7 rounded-full bg-blue-600 border-2 border-blue-300 flex items-center justify-center text-white font-bold text-sm z-10 shadow-lg">
        {card.mana}
      </div>

      {/* Playable hint */}
      {isPlayable && !isSelected && (
        <div className="absolute top-1 right-1 text-xs z-10">✨</div>
      )}

      {/* Card image */}
      <div className="w-full h-24 overflow-hidden bg-gray-700">
        {card.image ? (
          <img
            src={card.image}
            alt={card.name}
            className="w-full h-full object-cover object-top"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            {card.sign}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="px-1 py-0.5">
        <div className="text-white text-xs font-bold text-center truncate">{card.name}</div>
        <div className="text-gray-400 text-[10px] text-center">{card.sign}</div>
      </div>

      {/* ATK / HP */}
      <div className="absolute bottom-1 left-1 right-1 flex justify-between">
        <div className="w-6 h-6 rounded-full bg-orange-600 border border-orange-300 flex items-center justify-center text-white text-xs font-bold">
          {card.atk}
        </div>
        <div className="w-6 h-6 rounded-full bg-green-600 border border-green-300 flex items-center justify-center text-white text-xs font-bold">
          {card.hp}
        </div>
      </div>
    </motion.div>
  );
}

interface FieldCardProps {
  minion: Minion;
  isSelected?: boolean;
  isAttackable?: boolean;
  isOwn?: boolean;
  onClick?: () => void;
}

export function FieldCard({ minion, isSelected, isAttackable, isOwn, onClick }: FieldCardProps) {
  const canAct = isOwn && minion.attacksLeftThisTurn > 0 && !minion.hasAttackedThisTurn;
  const hasGhost = minion.statusEffects.includes('ghost');
  const hasLockdown = minion.statusEffects.includes('lockdown');
  const hasDoublePower = minion.statusEffects.includes('double_power');
  const hpPct = (minion.hp / minion.maxHp) * 100;

  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className={`
        relative w-20 h-28 rounded-lg cursor-pointer overflow-hidden
        border-2 transition-all duration-200
        ${isSelected ? 'border-yellow-400 card-glow-gold' : ''}
        ${isAttackable ? 'border-red-400 card-glow-red animate-pulse' : ''}
        ${canAct && !isSelected && !isAttackable ? 'border-green-400 card-glow-green' : ''}
        ${!isSelected && !isAttackable && !canAct ? 'border-gray-600' : ''}
        ${hasGhost ? 'opacity-60 card-glow-white' : ''}
        ${hasLockdown ? 'grayscale' : ''}
        bg-gradient-to-b from-gray-800 to-gray-900 shadow-lg select-none
      `}
    >
      {/* Image */}
      <div className="w-full h-16 bg-gray-700 overflow-hidden">
        {minion.image ? (
          <img
            src={minion.image}
            alt={minion.name}
            className="w-full h-full object-cover object-top"
            draggable={false}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-2xl">
            {minion.sign}
          </div>
        )}
      </div>

      {/* Name */}
      <div className="text-white text-[9px] text-center px-0.5 truncate font-bold">
        {minion.name}
      </div>

      {/* HP bar */}
      <div className="mx-1 mt-0.5 h-1.5 bg-gray-600 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            hpPct > 50 ? 'bg-green-400' : hpPct > 25 ? 'bg-yellow-400' : 'bg-red-400'
          }`}
          style={{ width: `${Math.max(0, hpPct)}%` }}
        />
      </div>

      {/* ATK / HP */}
      <div className="absolute bottom-0.5 left-0.5 right-0.5 flex justify-between">
        <div className={`w-5 h-5 rounded-full border flex items-center justify-center text-white text-xs font-bold
          ${hasDoublePower ? 'bg-purple-500 border-purple-300' : 'bg-orange-600 border-orange-300'}`}>
          {hasDoublePower ? minion.atk * 2 : minion.atk}
        </div>
        <div className="w-5 h-5 rounded-full bg-green-600 border border-green-300 flex items-center justify-center text-white text-xs font-bold">
          {minion.hp}
        </div>
      </div>

      {/* Status icons */}
      <div className="absolute top-0.5 right-0.5 flex flex-col gap-0.5">
        {hasGhost && <span className="text-xs">👻</span>}
        {hasLockdown && <span className="text-xs">🔒</span>}
        {hasDoublePower && <span className="text-xs">💀</span>}
      </div>

      {/* Can act indicator */}
      {canAct && !isSelected && (
        <div className="absolute top-0.5 left-0.5 w-2 h-2 bg-green-400 rounded-full animate-ping" />
      )}
    </motion.div>
  );
}
