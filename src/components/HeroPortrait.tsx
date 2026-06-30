import type { Hero } from '../types/game';

interface Props {
  hero: Hero;
  isEnemy?: boolean;
  onClick?: () => void;
  isAttackable?: boolean;
  // 나중에 추가: imageSrc?: string;
}

export default function HeroPortrait({ hero, isEnemy, onClick, isAttackable }: Props) {
  const pct = (hero.hp / hero.maxHp) * 100;
  const barColor = pct > 50 ? 'bg-green-500' : pct > 25 ? 'bg-yellow-500' : 'bg-red-500';

  return (
    <div
      onClick={onClick}
      className={`
        flex flex-col items-center gap-1 cursor-pointer select-none
        ${isAttackable ? 'ring-4 ring-red-400 ring-offset-2 rounded-lg scale-105' : ''}
        transition-transform
      `}
    >
      {/* 영웅 초상화 자리 — 나중에 imageSrc prop으로 이미지 교체 예정 */}
      <div
        className={`
          w-16 h-16 rounded-lg border-2 flex items-center justify-center
          ${isEnemy
            ? 'border-red-700/60 bg-red-950/40'
            : 'border-blue-700/60 bg-blue-950/40'
          }
          ${isAttackable ? 'border-red-400 shadow-[0_0_12px_rgba(248,113,113,0.7)]' : ''}
        `}
      >
        {/* 이미지 없을 때 — HP 숫자만 크게 표시 */}
        <span className={`text-2xl font-bold ${pct > 50 ? 'text-green-400' : pct > 25 ? 'text-yellow-400' : 'text-red-400'}`}>
          {hero.hp}
        </span>
      </div>

      {/* HP 바 */}
      <div className="w-16">
        <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${barColor} transition-all duration-500`}
            style={{ width: `${Math.max(0, pct)}%` }}
          />
        </div>
      </div>

      <span className="text-[10px] text-gray-500">{isEnemy ? 'AI' : 'Player'}</span>
    </div>
  );
}
