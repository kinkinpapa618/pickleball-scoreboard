import React from "react";

interface CourtProps {
  state: any;
  names: { t1p1: string; t1p2: string; t2p1: string; t2p2: string };
  onScore: () => void;
  onFault: () => void;
  onUndo: () => void;
}

const Court: React.FC<CourtProps> = ({ state, names, onScore, onFault, onUndo }) => {
  const { score1, score2, serverTeam, serverHand, positions, winner } = state;

  // Tính toán điểm hiển thị theo chuẩn 3 số
  const servingScore = serverTeam === 1 ? score1 : score2;
  const receivingScore = serverTeam === 1 ? score2 : score1;

  // Xác định ai là người đang giao bóng để hiển thị icon
  // Quy tắc: Trong code logic, người giao bóng là người có vị trí tương ứng với điểm chẵn/lẻ
  const isPlayerServing = (playerKey: string) => {
    const teamOfPlayer = playerKey.startsWith("t1") ? 1 : 2;
    if (teamOfPlayer !== serverTeam) return false;

    // Logic xác định Server 1 hoặc Server 2 dựa trên vị trí hiện tại
    // Đơn giản hóa: Người đang đứng đúng bên phát bóng (phải nếu điểm chẵn, trái nếu điểm lẻ)
    const currentScore = teamOfPlayer === 1 ? score1 : score2;
    const isEven = currentScore % 2 === 0;
    const pos = positions[playerKey];

    // Pickleball: Điểm chẵn phát bên phải, điểm lẻ phát bên trái
    if (serverHand === 1) {
       return isEven ? pos === "right" : pos === "left";
    } else {
       // Server 2 là người còn lại
       return isEven ? pos === "left" : pos === "right";
    }
  };

  const PlayerCard = ({ id, name }: { id: string; name: string }) => (
    <div className={`flex flex-col items-center justify-center p-3 rounded-lg border-2 transition-all ${
      isPlayerServing(id) ? "border-yellow-400 bg-yellow-50 shadow-lg scale-105" : "border-slate-200 bg-white"
    }`}>
      <div className="text-xs font-bold text-slate-400 uppercase">{id.includes("p1") ? "Player 1" : "Player 2"}</div>
      <div className="font-semibold text-slate-800">{name}</div>
      {isPlayerServing(id) && (
        <span className="mt-1 text-xl animate-bounce">🎾</span>
      )}
    </div>
  );

  return (
    <div className="flex flex-col items-center w-full max-w-4xl mx-auto p-4 bg-slate-50 min-h-screen">
      
      {/* 1. Scoreboard Chuẩn 3 Số */}
      <div className="mb-8 text-center bg-slate-900 text-white p-6 rounded-2xl shadow-xl w-full">
        <div className="text-sm text-slate-400 uppercase tracking-widest mb-1 font-bold">Pickleball Score</div>
        <div className="text-6xl font-black font-mono flex justify-center items-center gap-4">
          <span className="text-blue-400">{servingScore}</span>
          <span className="text-slate-600">-</span>
          <span className="text-red-400">{receivingScore}</span>
          <span className="text-slate-600">-</span>
          <span className="text-yellow-400">{serverHand}</span>
        </div>
        <div className="mt-2 text-emerald-400 font-medium italic">
          {winner ? `WINNER: TEAM ${winner}` : `Team ${serverTeam} is Serving`}
        </div>
      </div>

      {/* 2. Sân Đấu (Mô phỏng nhìn từ trên xuống) */}
      <div className="relative w-full aspect-[2/1] bg-green-600 border-4 border-white rounded-sm shadow-2xl flex overflow-hidden">
        
        {/* Team 1 Side (Left) */}
        <div className="flex-1 border-r-2 border-white flex relative">
          {/* Non-Volley Zone (The Kitchen) */}
          <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-green-700/50 flex items-center justify-center border-l border-white/30">
            <span className="rotate-90 text-white/20 font-bold tracking-[1em]">KITCHEN</span>
          </div>
          
          {/* Players Team 1 */}
          <div className="flex flex-col justify-around w-2/3 h-full p-4">
            <div className={`h-1/2 flex items-center justify-center ${positions.t1p1 === 'left' ? 'order-1' : 'order-2'}`}>
               <PlayerCard id="t1p1" name={names.t1p1} />
            </div>
            <div className={`h-1/2 flex items-center justify-center ${positions.t1p2 === 'left' ? 'order-1' : 'order-2'}`}>
               <PlayerCard id="t1p2" name={names.t1p2} />
            </div>
          </div>
        </div>

        {/* Team 2 Side (Right) */}
        <div className="flex-1 border-l-2 border-white flex flex-row-reverse relative">
          {/* Non-Volley Zone (The Kitchen) */}
          <div className="absolute left-0 top-0 bottom-0 w-1/3 bg-green-700/50 flex items-center justify-center border-r border-white/30">
            <span className="-rotate-90 text-white/20 font-bold tracking-[1em]">KITCHEN</span>
          </div>

          {/* Players Team 2 */}
          <div className="flex flex-col justify-around w-2/3 h-full p-4">
             <div className={`h-1/2 flex items-center justify-center ${positions.t2p1 === 'right' ? 'order-1' : 'order-2'}`}>
               <PlayerCard id="t2p1" name={names.t2p1} />
            </div>
            <div className={`h-1/2 flex items-center justify-center ${positions.t2p2 === 'right' ? 'order-1' : 'order-2'}`}>
               <PlayerCard id="t2p2" name={names.t2p2} />
            </div>
          </div>
        </div>

        {/* Lưới (Net) */}
        <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-black/30 z-10 shadow-lg"></div>
      </div>

      {/* 3. Nút Điều Khiển */}
      <div className="mt-10 grid grid-cols-3 gap-4 w-full max-w-lg">
        <button 
          onClick={onUndo}
          className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-4 rounded-xl transition-all active:scale-95"
        >
          Undo
        </button>
        <button 
          onClick={onFault}
          className="bg-red-500 hover:bg-red-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95"
        >
          Fault (Lỗi)
        </button>
        <button 
          onClick={onScore}
          disabled={!!winner}
          className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-95 disabled:opacity-50"
        >
          Point (+)
        </button>
      </div>

      {/* Chú thích luật nhanh */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100 text-blue-800 text-sm">
        <strong>Lưu ý:</strong> Điểm chẵn giao bên phải, điểm lẻ giao bên trái. Chỉ đội giao bóng mới ghi được điểm.
      </div>
    </div>
  );
};

export default Court;
