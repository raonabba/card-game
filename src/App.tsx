import { useGameStore } from './store/gameStore';
import MainMenu from './components/MainMenu';
import GameBoard from './components/GameBoard';

export default function App() {
  const { game } = useGameStore();

  if (!game) return <MainMenu />;
  return <GameBoard />;
}
