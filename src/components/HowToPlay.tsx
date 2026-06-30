interface Props {
  onClose: () => void;
}

export default function HowToPlay({ onClose }: Props) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50" onClick={onClose}>
      <div
        className="bg-gray-900 border border-yellow-600/60 rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-yellow-300 text-xl font-bold text-center mb-4">🎮 게임 방법</h2>

        <div className="space-y-3 text-sm text-gray-300">
          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-white font-bold mb-1">📌 목표</div>
            <div>상대 영웅의 HP 30을 먼저 0으로 만들면 승리!</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-white font-bold mb-1">🃏 카드 내기</div>
            <div>핸드의 카드를 <span className="text-yellow-300">드래그</span>해서 아래 필드 빈 칸에 놓거나,<br/>
            카드 <span className="text-yellow-300">클릭 → 빈 슬롯 클릭</span>으로도 배치 가능<br/>
            (파란 숫자 = 마나 비용, 마나가 부족하면 낼 수 없음)</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-white font-bold mb-1">⚔️ 공격하기</div>
            <div>
              1. 내 필드의 카드 <span className="text-green-300">클릭</span><br/>
              2. 아래 나타나는 <span className="text-red-300">⚔️ 공격</span> 버튼 클릭<br/>
              3. 적 카드 또는 적 영웅 클릭<br/>
              <span className="text-gray-400 text-xs">(소환한 턴에는 공격 불가)</span>
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-white font-bold mb-1">✨ 스킬 사용</div>
            <div>
              내 카드 클릭 → 스킬 패널에서<br/>
              <span className="text-orange-300">⚔️ 공격 스킬</span> 또는 <span className="text-blue-300">🛡 방어 스킬</span> 클릭
            </div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-white font-bold mb-1">🔵 마나</div>
            <div>매 턴 1씩 증가, 최대 10<br/>카드를 낼 때 마나 비용만큼 소모</div>
          </div>

          <div className="bg-gray-800 rounded-lg p-3">
            <div className="text-white font-bold mb-1">🟢 / 🔴 수치</div>
            <div>
              <span className="text-orange-300">주황 원 = ATK(공격력)</span> · <span className="text-green-300">초록 원 = HP(체력)</span>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-5 w-full py-2 bg-yellow-600 hover:bg-yellow-500 text-white font-bold rounded-xl transition-all"
        >
          확인
        </button>
      </div>
    </div>
  );
}
