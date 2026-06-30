import { motion } from 'framer-motion';
import { useGameStore } from '../store/gameStore';

export default function MainMenu() {
  const { startGame } = useGameStore();

  return (
    <div
      className="w-full h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ backgroundImage: "url('/menu-bg.png')", backgroundSize: 'cover', backgroundPosition: 'center' }}
    >
      {/* Dark overlay for readability */}
      <div className="absolute inset-0 bg-black/40 pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="text-center z-10"
      >
        <div className="text-6xl mb-4">♈♉♊♋♌♍♎♏♐♑♒♓</div>
        <h1 className="text-5xl font-bold text-yellow-300 mb-2 tracking-widest drop-shadow-lg">
          황도 카드 배틀
        </h1>
        <p className="text-purple-300 text-lg mb-12">Zodiac Card Battle</p>

        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          onClick={startGame}
          className="px-12 py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xl font-bold rounded-2xl border-2 border-purple-400 shadow-2xl transition-all mb-4"
        >
          ⚔️ AI와 대결
        </motion.button>

        <div className="mt-10 text-gray-400 text-sm space-y-1">
          <p>12장의 황도궁 카드로 영웅 HP 30을 먼저 0으로 만드세요</p>
          <p>카드를 클릭해 스킬을 사용하고, 공격 버튼으로 전투하세요</p>
        </div>

        {/* Card preview */}
        <div className="mt-8 flex gap-2 justify-center flex-wrap max-w-2xl">
          {['♈ ARIES', '♉ TAURUS', '♊ GEMINI', '♋ CANCER', '♌ LEO', '♍ VIRGO',
            '♎ LIBRA', '♏ SCORPIO', '♐ SAGITTARIUS', '♑ CAPRICORN', '♒ AQUARIUS', '♓ PISCES'].map((s) => (
            <span key={s} className="text-xs text-purple-300 bg-purple-900/40 px-2 py-1 rounded-full border border-purple-700/50">
              {s}
            </span>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
