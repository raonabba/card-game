import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

const ZODIAC_ICONS = [
  { name: 'ARIES',       src: '/aries-icon.png' },
  { name: 'TAURUS',      src: '/taurus-icon.png' },
  { name: 'GEMINI',      src: '/gemini-icon.png' },
  { name: 'CANCER',      src: '/cancer-icon.png' },
  { name: 'LEO',         src: '/leo-icon.png' },
  { name: 'VIRGO',       src: '/virgo-icon.png' },
  { name: 'LIBRA',       src: '/libra-icon.png' },
  { name: 'SCORPIO',     src: '/scorpio-icon.png' },
  { name: 'SAGITTARIUS', src: '/sagittarius-icon.png' },
  { name: 'CAPRICORN',   src: '/capricorn-icon.png' },
  { name: 'AQUARIUS',    src: '/aquarius-icon.png' },
  { name: 'PISCES',      src: '/pisces-icon.png' },
];

export default function MainMenu() {
  const { startGame } = useGameStore();

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-between relative overflow-hidden py-6"
      style={{ backgroundImage: "url('/menu-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      <div className="absolute inset-0 bg-black/45 pointer-events-none" />

      {/* ── TITLE ── */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="z-10 text-center mt-2"
      >
        <h1 className="text-6xl font-black tracking-[0.12em] drop-shadow-2xl"
          style={{
            background: 'linear-gradient(to bottom, #fff9c4, #ffd700, #f59e0b)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            textShadow: 'none',
            filter: 'drop-shadow(0 0 16px rgba(251,191,36,0.6))',
          }}
        >
          STELLAR
        </h1>
        <div className="text-2xl font-bold tracking-[0.45em] text-purple-200 -mt-1"
          style={{ filter: 'drop-shadow(0 0 8px rgba(168,85,247,0.8))' }}
        >
          CARD BATTLE
        </div>
      </motion.div>

      {/* ── ZODIAC ICON GRID ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="z-10 w-full max-w-2xl px-4"
      >
        <div className="grid grid-cols-6 gap-3">
          {ZODIAC_ICONS.map((z, i) => (
            <motion.div
              key={z.name}
              initial={{ opacity: 0, scale: 0.6 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.25 + i * 0.04, duration: 0.3 }}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-14 h-14 rounded-full overflow-hidden border-2 border-purple-400/70"
                style={{ boxShadow: '0 0 12px rgba(168,85,247,0.5)' }}
              >
                <img
                  src={z.src}
                  alt={z.name}
                  className="w-full h-full object-cover"
                  onError={(e) => { (e.target as HTMLImageElement).style.opacity = '0.3'; }}
                />
              </div>
              <span className="text-[9px] font-bold text-purple-200/80 tracking-wide truncate w-full text-center">
                {z.name}
              </span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* ── START BUTTON ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
        className="z-10 flex flex-col items-center gap-3"
      >
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="px-14 py-4 text-white text-xl font-bold rounded-2xl border-2 border-purple-400 shadow-2xl transition-all"
          style={{
            background: 'linear-gradient(135deg, #7c3aed, #4f46e5)',
            boxShadow: '0 0 24px rgba(139,92,246,0.6)',
          }}
        >
          ⚔️ AI와 대결
        </motion.button>
        <p className="text-purple-300/80 text-xs tracking-wide">
          12 CONSTELLATION CARDS · HERO HP 30 · TURN-BASED STRATEGY
        </p>
      </motion.div>
    </div>
  );
}
