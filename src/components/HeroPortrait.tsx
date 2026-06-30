import type { Hero } from '../types/game';

interface Props {
  hero: Hero;
  isEnemy?: boolean;
  onClick?: () => void;
  isAttackable?: boolean;
}

export default function HeroPortrait({ hero, isEnemy, onClick, isAttackable }: Props) {
  const pct = (hero.hp / hero.maxHp) * 100;
  const barColor = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 cursor-pointer select-none
        ${isAttackable ? 'ring-4 ring-red-400 ring-offset-2 ring-offset-transparent rounded-full scale-105' : ''}
        transition-transform
      `}
    >
      <div
        className={`
          w-16 h-16 rounded-full border-4 flex items-center justify-center text-3xl
          ${isEnemy ? 'border-red-500 bg-red-900/60' : 'border-blue-400 bg-blue-900/60'}
          shadow-lg
        `}
      >
        {isEnemy ? '👹' : '🧙'}
      </div>
      <div className="w-20">
        <div className="flex justify-between text-xs text-white mb-0.5">
          <span>{hero.hp}</span>
          <span>{hero.maxHp}</span>
        </div>
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${Math.max(0, pct)}%` }}
          />
        </div>
      </div>
      <span className="text-xs text-gray-400">{isEnemy ? 'AI' : 'Player'}</span>
    </div>
  );
}
