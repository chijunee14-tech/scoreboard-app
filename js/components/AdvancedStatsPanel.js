// ==========================================
// Component: Advanced Statistics Panel
// ==========================================
const AdvancedStatsPanel = ({ matchData, history = [] }) => {
    const { useState } = React;
    const [activeTab, setActiveTab] = useState('overview');

    const statsA = matchData.stats?.teamA || {};
    const statsB = matchData.stats?.teamB || {};

    // 計算一發/二發得分率
    const calculateServeStats = (team) => {
        const stats = team === 'A' ? statsA : statsB;
        const firstServeWon = stats.firstServeWon || 0;
        const firstServeTotal = stats.firstServeTotal || 0;
        const secondServeWon = stats.secondServeWon || 0;
        const secondServeTotal = stats.secondServeTotal || 0;
        
        const firstServeRate = firstServeTotal > 0 ? Math.round((firstServeWon / firstServeTotal) * 100) : 0;
        const secondServeRate = secondServeTotal > 0 ? Math.round((secondServeWon / secondServeTotal) * 100) : 0;
        
        return { firstServeWon, firstServeTotal, firstServeRate, secondServeWon, secondServeTotal, secondServeRate };
    };

    const serveStatsA = calculateServeStats('A');
    const serveStatsB = calculateServeStats('B');

    // 計算關鍵分轉換率
    const calculateKeyPoints = (team) => {
        const stats = team === 'A' ? statsA : statsB;
        const breakPoints = stats.breakPointsTotal || 0;
        const breakPointsWon = stats.breakPointsWon || 0;
        const breakRate = breakPoints > 0 ? Math.round((breakPointsWon / breakPoints) * 100) : 0;
        
        return { breakPoints, breakPointsWon, breakRate };
    };

    const keyPointsA = calculateKeyPoints('A');
    const keyPointsB = calculateKeyPoints('B');

    // 計算得分走勢（從歷史記錄中提取）
    const calculateMomentum = () => {
        if (!history || history.length === 0) return [];
        
        const momentum = [];
        let scoreA = 0;
        let scoreB = 0;
        
        // 只取最近 30 分
        const recentHistory = history.slice(-30);
        
        recentHistory.forEach((item, index) => {
            if (item.action === 'POINT_WON') {
                if (item.detail && item.detail.includes(matchData.teamA)) {
                    scoreA++;
                } else if (item.detail && item.detail.includes(matchData.teamB)) {
                    scoreB++;
                }
                momentum.push({
                    index: index + 1,
                    scoreA,
                    scoreB,
                    diff: scoreA - scoreB
                });
            }
        });
        
        return momentum;
    };

    const momentum = calculateMomentum();

    // 動能指標（最近 5 分）
    const calculateCurrentMomentum = () => {
        if (momentum.length < 5) return { teamA: 0, teamB: 0 };
        
        const recent = momentum.slice(-5);
        const startDiff = recent[0].diff;
        const endDiff = recent[recent.length - 1].diff;
        const change = endDiff - startDiff;
        
        return {
            teamA: change > 0 ? change : 0,
            teamB: change < 0 ? Math.abs(change) : 0
        };
    };

    const currentMomentum = calculateCurrentMomentum();

    // 統計長條圖組件 - 使用中央對比式設計
    const StatBar = ({ label, valueA, valueB, maxValue = null }) => {
        const total = valueA + valueB || 1;
        const percentA = (valueA / total) * 100;
        const percentB = (valueB / total) * 100;

        return (
            <div className="mb-4">
                <div className="text-slate-400 text-xs mb-2">{label}</div>
                <div className="flex items-center gap-3">
                    <span className="text-blue-400 font-bold text-sm w-8 text-right">{valueA}</span>
                    <div className="flex-1 flex h-4 bg-slate-900 rounded-full overflow-hidden">
                        <div 
                            className="bg-blue-500 transition-all duration-500" 
                            style={{ width: `${percentA}%` }}
                        ></div>
                        <div 
                            className="bg-green-500 transition-all duration-500" 
                            style={{ width: `${percentB}%` }}
                        ></div>
                    </div>
                    <span className="text-green-400 font-bold text-sm w-8 text-left">{valueB}</span>
                </div>
            </div>
        );
    };

    // 百分比環形圖
    const CircularProgress = ({ percentage, color, label }) => {
        const radius = 40;
        const circumference = 2 * Math.PI * radius;
        const offset = circumference - (percentage / 100) * circumference;

        return (
            <div className="flex flex-col items-center">
                <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        className="text-slate-700"
                    />
                    <circle
                        cx="48"
                        cy="48"
                        r={radius}
                        stroke="currentColor"
                        strokeWidth="8"
                        fill="none"
                        strokeDasharray={circumference}
                        strokeDashoffset={offset}
                        className={color}
                        style={{ transition: 'stroke-dashoffset 0.5s ease' }}
                    />
                    <text
                        x="48"
                        y="48"
                        textAnchor="middle"
                        dy="0.3em"
                        fill="#ffffff"
                        className="text-lg font-bold"
                        transform="rotate(90 48 48)"
                        style={{ fontSize: '18px', fontWeight: 'bold' }}
                    >
                        {percentage}%
                    </text>
                </svg>
                <div className="text-white text-xs mt-2 text-center font-semibold">{label}</div>
            </div>
        );
    };

    return (
        <div className="bg-slate-800 rounded-xl p-4 sm:p-6 shadow-lg border border-slate-700">
            <h3 className="text-lg sm:text-xl font-bold text-yellow-400 mb-4 flex items-center">
                <i className="fas fa-chart-line mr-2"></i>
                進階數據分析
            </h3>

            {/* 分頁選單 */}
            <div className="flex gap-2 mb-4 overflow-x-auto">
                <button
                    onClick={() => setActiveTab('overview')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                        activeTab === 'overview' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                >
                    <i className="fas fa-chart-pie mr-2"></i>總覽
                </button>
                <button
                    onClick={() => setActiveTab('serve')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                        activeTab === 'serve' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                >
                    <i className="fas fa-baseball-ball mr-2"></i>發球分析
                </button>
                <button
                    onClick={() => setActiveTab('momentum')}
                    className={`px-4 py-2 rounded-lg whitespace-nowrap transition ${
                        activeTab === 'momentum' ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                    }`}
                >
                    <i className="fas fa-chart-area mr-2"></i>動能分析
                </button>
            </div>

            {/* 選手名稱標題 */}
            <div className="grid grid-cols-2 gap-4 mb-4 text-center">
                <div className="text-blue-400 font-bold truncate">{matchData.teamA}</div>
                <div className="text-green-400 font-bold truncate">{matchData.teamB}</div>
            </div>

            {/* 總覽頁面 */}
            {activeTab === 'overview' && (
                <div>
                    <StatBar label="總得分" valueA={statsA.totalPoints || 0} valueB={statsB.totalPoints || 0} />
                    <StatBar label="Aces" valueA={statsA.aces || 0} valueB={statsB.aces || 0} />
                    <StatBar label="雙發失誤" valueA={statsA.doubleFaults || 0} valueB={statsB.doubleFaults || 0} />
                    <StatBar label="致勝球" valueA={statsA.winners || 0} valueB={statsB.winners || 0} />
                    <StatBar label="非受迫性失誤" valueA={statsA.unforcedErrors || 0} valueB={statsB.unforcedErrors || 0} />
                    
                    {/* 關鍵分轉換率 */}
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mt-4">
                        <div className="text-slate-400 text-xs uppercase mb-3 text-center">破發點轉換率</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <CircularProgress
                                    percentage={keyPointsA.breakRate}
                                    color="text-blue-500"
                                    label={`${keyPointsA.breakPointsWon}/${keyPointsA.breakPoints}`}
                                />
                            </div>
                            <div className="text-center">
                                <CircularProgress
                                    percentage={keyPointsB.breakRate}
                                    color="text-green-500"
                                    label={`${keyPointsB.breakPointsWon}/${keyPointsB.breakPoints}`}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 發球分析頁面 */}
            {activeTab === 'serve' && (
                <div>
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-4">
                        <div className="text-slate-400 text-xs uppercase mb-3 text-center">一發得分率</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <CircularProgress
                                    percentage={serveStatsA.firstServeRate}
                                    color="text-blue-500"
                                    label={`${serveStatsA.firstServeWon}/${serveStatsA.firstServeTotal}`}
                                />
                            </div>
                            <div className="text-center">
                                <CircularProgress
                                    percentage={serveStatsB.firstServeRate}
                                    color="text-green-500"
                                    label={`${serveStatsB.firstServeWon}/${serveStatsB.firstServeTotal}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                        <div className="text-slate-400 text-xs uppercase mb-3 text-center">二發得分率</div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="text-center">
                                <CircularProgress
                                    percentage={serveStatsA.secondServeRate}
                                    color="text-blue-500"
                                    label={`${serveStatsA.secondServeWon}/${serveStatsA.secondServeTotal}`}
                                />
                            </div>
                            <div className="text-center">
                                <CircularProgress
                                    percentage={serveStatsB.secondServeRate}
                                    color="text-green-500"
                                    label={`${serveStatsB.secondServeWon}/${serveStatsB.secondServeTotal}`}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="mt-4">
                        <StatBar label="發球局得分" valueA={statsA.serviceGamesWon || 0} valueB={statsB.serviceGamesWon || 0} />
                        <StatBar label="接發球局得分" valueA={statsA.returnGamesWon || 0} valueB={statsB.returnGamesWon || 0} />
                    </div>
                </div>
            )}

            {/* 動能分析頁面 */}
            {activeTab === 'momentum' && (
                <div>
                    {/* 當前動能指標 */}
                    <div className="bg-slate-900 p-4 rounded-lg border border-slate-700 mb-4">
                        <div className="text-slate-400 text-xs uppercase mb-3 text-center">
                            當前動能 <span className="text-xs text-slate-500">(最近 5 分)</span>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="flex-1 flex items-center justify-end gap-2">
                                <span className="text-blue-400 font-bold">{matchData.teamA}</span>
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-6 rounded ${
                                                i < currentMomentum.teamA ? 'bg-blue-500' : 'bg-slate-700'
                                            }`}
                                        ></div>
                                    ))}
                                </div>
                            </div>
                            <div className="text-slate-600 text-xs">VS</div>
                            <div className="flex-1 flex items-center gap-2">
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-2 h-6 rounded ${
                                                i < currentMomentum.teamB ? 'bg-green-500' : 'bg-slate-700'
                                            }`}
                                        ></div>
                                    ))}
                                </div>
                                <span className="text-green-400 font-bold">{matchData.teamB}</span>
                            </div>
                        </div>
                    </div>

                    {/* 得分走勢圖 */}
                    {momentum.length > 0 ? (
                        <div className="bg-slate-900 p-4 rounded-lg border border-slate-700">
                            <div className="text-slate-400 text-xs uppercase mb-3 text-center">得分走勢圖</div>
                            <div className="h-48 relative">
                                <svg className="w-full h-full">
                                    {/* 中線 */}
                                    <line
                                        x1="0"
                                        y1="50%"
                                        x2="100%"
                                        y2="50%"
                                        stroke="currentColor"
                                        strokeWidth="1"
                                        className="text-slate-700"
                                    />
                                    
                                    {/* 走勢線 */}
                                    {momentum.map((point, index) => {
                                        if (index === 0) return null;
                                        const prevPoint = momentum[index - 1];
                                        const x1 = `${(index - 1) / (momentum.length - 1) * 100}%`;
                                        const x2 = `${index / (momentum.length - 1) * 100}%`;
                                        const maxDiff = Math.max(...momentum.map(p => Math.abs(p.diff)), 1);
                                        const y1 = 50 - (prevPoint.diff / maxDiff) * 40;
                                        const y2 = 50 - (point.diff / maxDiff) * 40;
                                        
                                        return (
                                            <line
                                                key={index}
                                                x1={x1}
                                                y1={`${y1}%`}
                                                x2={x2}
                                                y2={`${y2}%`}
                                                stroke="currentColor"
                                                strokeWidth="2"
                                                className={point.diff > 0 ? 'text-blue-500' : 'text-green-500'}
                                            />
                                        );
                                    })}
                                    
                                    {/* 數據點 */}
                                    {momentum.map((point, index) => {
                                        const x = `${index / (momentum.length - 1) * 100}%`;
                                        const maxDiff = Math.max(...momentum.map(p => Math.abs(p.diff)), 1);
                                        const y = 50 - (point.diff / maxDiff) * 40;
                                        
                                        return (
                                            <circle
                                                key={index}
                                                cx={x}
                                                cy={`${y}%`}
                                                r="3"
                                                fill="currentColor"
                                                className={point.diff > 0 ? 'text-blue-400' : point.diff < 0 ? 'text-green-400' : 'text-slate-500'}
                                            />
                                        );
                                    })}
                                </svg>
                            </div>
                            <div className="flex justify-between mt-2 text-xs text-slate-500">
                                <span>開始</span>
                                <span>最近 {momentum.length} 分</span>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-slate-900 p-8 rounded-lg border border-slate-700 text-center text-slate-500">
                            <i className="fas fa-chart-line text-4xl mb-2"></i>
                            <div>暫無足夠數據顯示走勢圖</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
