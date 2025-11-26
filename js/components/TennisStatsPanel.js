// ==========================================
// Component: Tennis Statistics Panel
// ==========================================
const TennisStatsPanel = ({ matchData }) => {
    const statsA = matchData.stats?.teamA || { aces: 0, doubleFaults: 0, winners: 0, unforcedErrors: 0, breakPointsWon: 0, breakPointsTotal: 0 };
    const statsB = matchData.stats?.teamB || { aces: 0, doubleFaults: 0, winners: 0, unforcedErrors: 0, breakPointsWon: 0, breakPointsTotal: 0 };

    const StatBar = ({ label, valueA, valueB, iconClass }) => {
        const total = valueA + valueB || 1;
        const percentA = (valueA / total) * 100;
        const percentB = (valueB / total) * 100;

        return (
            <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                    <span className="text-blue-400 font-bold text-sm">{valueA}</span>
                    <span className="text-slate-400 text-xs flex items-center">
                        <i className={`${iconClass} mr-2`}></i>
                        {label}
                    </span>
                    <span className="text-green-400 font-bold text-sm">{valueB}</span>
                </div>
                <div className="flex h-3 bg-slate-800 rounded-full overflow-hidden">
                    <div className="bg-blue-500 transition-all duration-500" style={{ width: `${percentA}%` }}></div>
                    <div className="bg-green-500 transition-all duration-500" style={{ width: `${percentB}%` }}></div>
                </div>
            </div>
        );
    };

    const calculateBreakPointConversion = (won, total) => {
        if (total === 0) return '0%';
        return `${won}/${total} (${Math.round((won / total) * 100)}%)`;
    };

    return (
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-700 mb-4">
            <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-4 flex items-center">
                <i className="fas fa-chart-bar mr-2"></i>
                比賽統計
            </h3>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                {/* 選手名稱標題 */}
                <div className="col-span-1 lg:col-span-2 flex justify-between text-center mb-2">
                    <div className="flex-1 text-blue-400 font-bold truncate">{matchData.teamA}</div>
                    <div className="flex-1"></div>
                    <div className="flex-1 text-green-400 font-bold truncate">{matchData.teamB}</div>
                </div>

                {/* 統計長條圖 */}
                <div className="col-span-1 lg:col-span-2">
                    <StatBar label="Aces" valueA={statsA.aces} valueB={statsB.aces} iconClass="fas fa-bolt" />
                    <StatBar label="雙發失誤" valueA={statsA.doubleFaults} valueB={statsB.doubleFaults} iconClass="fas fa-times-circle" />
                    <StatBar label="致勝球" valueA={statsA.winners} valueB={statsB.winners} iconClass="fas fa-star" />
                    <StatBar label="非受迫性失誤" valueA={statsA.unforcedErrors} valueB={statsB.unforcedErrors} iconClass="fas fa-exclamation-triangle" />
                </div>
            </div>

            {/* 破發點轉換率 */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                <div className="text-slate-400 text-xs uppercase mb-3 text-center">破發點轉換率</div>
                <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                        <div className="text-blue-400 font-bold text-sm mb-1">{matchData.teamA}</div>
                        <div className="text-white text-lg font-mono">
                            {calculateBreakPointConversion(statsA.breakPointsWon, statsA.breakPointsTotal)}
                        </div>
                    </div>
                    <div>
                        <div className="text-green-400 font-bold text-sm mb-1">{matchData.teamB}</div>
                        <div className="text-white text-lg font-mono">
                            {calculateBreakPointConversion(statsB.breakPointsWon, statsB.breakPointsTotal)}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
