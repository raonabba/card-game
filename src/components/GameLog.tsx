interface Props {
  logs: string[];
}

export default function GameLog({ logs }: Props) {
  return (
    <div className="w-48 h-full bg-black/40 rounded-lg border border-gray-700/50 overflow-y-auto p-2 flex flex-col gap-1">
      {logs.map((log, i) => (
        <div key={i} className={`text-xs ${i === 0 ? 'text-yellow-300' : 'text-gray-400'}`}>
          {log}
        </div>
      ))}
    </div>
  );
}
