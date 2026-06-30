import { motion, useAnimation } from 'framer-motion';
import { useEffect } from 'react';
import type { Hero } from '../types/game';

interface Props {
  hero: Hero;
  isEnemy?: boolean;
  onClick?: () => void;
  isAttackable?: boolean;
  isHit?: boolean;
}

export default function HeroPortrait({ hero, isEnemy, onClick, isAttackable, isHit }: Props) {
  const controls = useAnimation();
  const pct = (hero.hp / hero.maxHp) * 100;
  const barColor = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  useEffect(() => {
    if (!isHit) return;
    controls.start({ x: [-10, 10, -7, 7, -4, 4, 0], transition: { duration: 0.4 } });
  }, [isHit, controls]);

  return (
    <motion.div
      animate={controls}
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 cursor-pointer select-none
        ${isAttackable ? 'ring-4 ring-red-400 ring-offset-2 rounded-lg scale-105' : ''}
        transition-transform
      `}
    >
      <div
        className={`
          w-16 h-16 rounded-lg border-2 flex items-center justify-center
          ${isEnemy ? 'border-red-700/60 bg-red-950/40' : 'border-blue-700/60 bg-blue-950/40'}
          ${isAttackable ? 'border-red-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]' : ''}
        `}
      >
        <span className={`text-2xl font-bold ${pct > 50 ? 'text-green-400' : pct > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
          {hero.hp}
        </span>
      </div>
      <div className="w-16">
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div className={`h-full ${barColor} transition-all duration-500`} style={{ width: `${Math.max(0, pct)}%` }} />
        </div>
      </div>
      <span className="text-[10px] text-gray-500">{isEnemy ? 'AI' : 'Player'}</span>
    </motion.div>
  );
}
