// components/PlayerSetup.tsx
interface PlayerSetupProps {
  team: number;
  p1: string;
  p2: string;
  onP1Change: (value: string) => void;
  onP2Change: (value: string) => void;
  mobile?: boolean;
}

export function PlayerSetup({ team, p1, p2, onP1Change, onP2Change, mobile }: PlayerSetupProps) {
  return (
    <div className={`space-y-${mobile ? '3' : '4'}`}>
      <div className={`flex ${mobile ? 'flex-col' : 'flex-row'} gap-${mobile ? '3' : '4'}`}>
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slot 1 {mobile && <span className="text-gray-500">(Bên trái)</span>}
          </label>
          <input
            type="text"
            value={p1}
            onChange={(e) => onP1Change(e.target.value)}
            placeholder={`Tên người chơi 1 đội ${team}`}
            className={`w-full ${mobile ? 'h-12 text-base' : 'h-10'} px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>

        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slot 2 {mobile && <span className="text-gray-500">(Bên phải)</span>}
          </label>
          <input
            type="text"
            value={p2}
            onChange={(e) => onP2Change(e.target.value)}
            placeholder={`Tên người chơi 2 đội ${team}`}
            className={`w-full ${mobile ? 'h-12 text-base' : 'h-10'} px-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
          />
        </div>
      </div>

      {mobile && (
        <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span>Đội {team}</span>
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
        </div>
      )}
    </div>
  );
}