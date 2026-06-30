interface Props {
  current: number;
  max: number;
}

export default function ManaBar({ current, max }: Props) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: Math.max(max, 1) }).map((_, i) => (
        <div
          key={i}
          className={`w-5 h-5 rounded-full border-2 transition-all duration-300 ${
            i < current
              ? 'bg-blue-400 border-blue-200 shadow-[0_0_6px_rgba(96,165,250,0.8)]'
              : 'bg-gray-700 border-gray-500'
          }`}
        />
      ))}
      <span className="ml-2 text-blue-300 text-sm font-bold">
        {current}/{max}
      </span>
    </div>
  );
}
