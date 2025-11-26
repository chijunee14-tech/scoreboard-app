// ==========================================
// Component: Tennis Review Mode (History)
// ==========================================
const TennisReviewMode = ({ matchData, matchId, appId }) => {
    const { useState, useEffect } = React;
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showPDFModal, setShowPDFModal] = useState(false);
    const [showSnapshotModal, setShowSnapshotModal] = useState(false);
    const [showAdvancedStats, setShowAdvancedStats] = useState(false);

    const exportToCSV = () => {
        // 處理欄位中的逗號和引號，避免 CSV 格式錯誤
        const escapeCSV = (str) => {
            if (typeof str !== 'string') str = String(str);
            if (str.includes(',') || str.includes('"') || str.includes('\n')) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        
        // 準備統計數據
        const statsA = matchData.stats?.teamA || {};
        const statsB = matchData.stats?.teamB || {};
        
        // 準備 CSV 標題
        const headers = ['時間', '事件', '詳情', '當時比分 (Set | Pt)', '盤數詳情', '小分', '發球方', '破發點', '破發成功'];
        
        // 準備 CSV 資料行
        const rows = history.map(item => {
            let time = '--:--:--';
            try {
                if (item.timestamp?.toDate) {
                    time = item.timestamp.toDate().toLocaleString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                } else if (item.timestamp) {
                    time = new Date(item.timestamp).toLocaleString('zh-TW', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    });
                }
            } catch (e) {
                console.error('Timestamp parsing error:', e);
            }
            
            // 提取詳細分數資訊
            const detailed = item.detailedScore || {};
            const setsDetail = detailed.setsA && detailed.setsB ? 
                `${matchData.teamA}: ${detailed.setsA.join('-')} | ${matchData.teamB}: ${detailed.setsB.join('-')}` : '';
            const pointDetail = detailed.pointA && detailed.pointB ? 
                `${detailed.pointA} - ${detailed.pointB}` : '';
            const serverName = detailed.server === 'A' ? matchData.teamA : 
                              detailed.server === 'B' ? matchData.teamB : '';
            const breakPoint = detailed.wasBreakPoint ? '是' : '否';
            const breakSuccess = detailed.wasBreak ? '是' : '否';
            
            return [
                escapeCSV(time),
                escapeCSV(item.action || ''),
                escapeCSV(item.detail || ''),
                escapeCSV(item.scoreSnapshot || ''),
                escapeCSV(setsDetail),
                escapeCSV(pointDetail),
                escapeCSV(serverName),
                escapeCSV(breakPoint),
                escapeCSV(breakSuccess)
            ].join(',');
        });
        
        // 計算破發點轉換率
        const breakPointConversionA = statsA.breakPointsTotal > 0 ? 
            `${statsA.breakPointsWon || 0}/${statsA.breakPointsTotal} (${Math.round(((statsA.breakPointsWon || 0) / statsA.breakPointsTotal) * 100)}%)` : '0/0 (0%)';
        const breakPointConversionB = statsB.breakPointsTotal > 0 ? 
            `${statsB.breakPointsWon || 0}/${statsB.breakPointsTotal} (${Math.round(((statsB.breakPointsWon || 0) / statsB.breakPointsTotal) * 100)}%)` : '0/0 (0%)';
        
        // 組合 CSV 內容（加入 BOM 以支援 Excel 正確顯示中文）
        const csvContent = '\uFEFF' + [
            `比賽名稱: ${matchData.title}`,
            `選手 A: ${matchData.teamA}`,
            `選手 B: ${matchData.teamB}`,
            `賽制: ${MATCH_MODES[matchData.matchType]?.name || matchData.matchType}`,
            `最終比分: ${matchData.setsA.join('-')} vs ${matchData.setsB.join('-')}`,
            `比賽狀態: ${matchData.winner ? `完賽 (勝者: ${matchData.winner === 'A' ? matchData.teamA : matchData.teamB})` : '進行中'}`,
            '',
            '=== 比賽統計 ===',
            `統計項目,${matchData.teamA},${matchData.teamB}`,
            `Aces,${statsA.aces || 0},${statsB.aces || 0}`,
            `雙發失誤,${statsA.doubleFaults || 0},${statsB.doubleFaults || 0}`,
            `致勝球,${statsA.winners || 0},${statsB.winners || 0}`,
            `非受迫性失誤,${statsA.unforcedErrors || 0},${statsB.unforcedErrors || 0}`,
            `破發點轉換率,${breakPointConversionA},${breakPointConversionB}`,
            '',
            '=== 比賽紀錄 ===',
            headers.join(','),
            ...rows
        ].join('\n');
        
        // 建立並下載檔案
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        // 生成檔案名稱（包含比賽名稱和日期）
        const date = new Date().toISOString().split('T')[0];
        const fileName = `${matchData.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_')}_${date}.csv`;
        
        link.setAttribute('href', url);
        link.setAttribute('download', fileName);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    useEffect(() => {
        // 從子集合即時監聽 history
        // 注意：移除 orderBy 以避免需要索引，改為在客戶端排序
        console.log('Setting up history listener for match:', matchId);
        const historyCollectionRef = db.collection('artifacts')
            .doc(appId)
            .collection('public')
            .doc('data')
            .collection('matches')
            .doc(matchId)
            .collection('history');
        
        console.log('History collection path:', historyCollectionRef.path);
        
        const unsubscribe = historyCollectionRef
            .limit(100) // 只載入最近 100 筆
            .onSnapshot(
                snapshot => {
                    console.log('History snapshot received:', snapshot.size, 'documents');
                    console.log('Snapshot empty?', snapshot.empty);
                    console.log('Snapshot metadata:', snapshot.metadata);
                    
                    const historyData = snapshot.docs.map(doc => {
                        const data = doc.data();
                        console.log('History item:', doc.id, data);
                        return {
                            id: doc.id,
                            ...data
                        };
                    });
                    // 在客戶端排序（最新的在前）
                    historyData.sort((a, b) => {
                        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : 0;
                        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : 0;
                        return timeB - timeA;
                    });
                    setHistory(historyData);
                    setLoading(false);
                },
                error => {
                    console.error('Error loading history:', error);
                    console.error('Error code:', error.code);
                    console.error('Error message:', error.message);
                    setLoading(false);
                }
            );
        
        return () => unsubscribe();
    }, [matchId, appId]);

    const reversedHistory = history;

    return (
        <div className="p-4 max-w-4xl mx-auto">
            {/* 基礎統計面板 */}
            <TennisStatsPanel matchData={matchData} />
            
            {/* 進階數據分析面板 */}
            {showAdvancedStats && <AdvancedStatsPanel matchData={matchData} history={history} />}
            
            <div className="bg-slate-800 rounded-xl p-6 shadow-lg border border-slate-700">
                <div className="flex justify-between items-center mb-6 border-b border-slate-700 pb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-green-400"><i className="fas fa-history mr-2"></i>比賽紀錄</h2>
                        <div className="text-white text-lg mt-1">{matchData.title}</div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <div className="text-sm text-slate-400">當前局數</div>
                            <div className="font-bold text-xl">{matchData.setsA.join('-')} vs {matchData.setsB.join('-')}</div>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowAdvancedStats(!showAdvancedStats)}
                                className={`px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition ${
                                    showAdvancedStats ? 'bg-purple-600 hover:bg-purple-500' : 'bg-slate-700 hover:bg-slate-600'
                                } text-white`}
                                title="進階數據分析"
                            >
                                <i className="fas fa-chart-line"></i>
                                <span className="hidden sm:inline">進階</span>
                            </button>
                            <button 
                                onClick={() => setShowSnapshotModal(true)}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition"
                                title="比分截圖分享"
                            >
                                <i className="fas fa-camera"></i>
                                <span className="hidden sm:inline">截圖</span>
                            </button>
                            <button 
                                onClick={() => setShowPDFModal(true)}
                                className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition"
                                title="匯出 PDF 報告"
                            >
                                <i className="fas fa-file-pdf"></i>
                                <span className="hidden sm:inline">PDF</span>
                            </button>
                            <button 
                                onClick={exportToCSV}
                                disabled={history.length === 0}
                                className="bg-green-600 hover:bg-green-500 disabled:bg-slate-600 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition"
                                title="匯出為 CSV 檔案"
                            >
                                <i className="fas fa-file-csv"></i>
                                <span className="hidden sm:inline">CSV</span>
                            </button>
                        </div>
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-8 text-slate-400">
                        <i className="fas fa-spinner fa-spin text-2xl mb-2"></i>
                        <div>載入中...</div>
                    </div>
                ) : reversedHistory.length === 0 ? (
                    <div className="text-center text-slate-500 py-10">尚無紀錄</div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-700 text-slate-400 text-sm">
                                    <th className="py-2 px-3">時間</th>
                                    <th className="py-2 px-3">事件</th>
                                    <th className="py-2 px-3">詳情</th>
                                    <th className="py-2 px-3 text-right">當時比分 (Set | Pt)</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {reversedHistory.map((item, idx) => {
                                    let time = '--:--:--';
                                    try {
                                        if (item.timestamp?.toDate) {
                                            time = item.timestamp.toDate().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                                        } else if (item.timestamp) {
                                            time = new Date(item.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'});
                                        }
                                    } catch (e) {
                                        console.error('Timestamp parsing error:', e);
                                    }
                                    
                                    // 提取詳細分數資訊用於顯示
                                    const detailed = item.detailedScore || {};
                                    const hasDetailedInfo = detailed.setsA && detailed.setsB;
                                    
                                    return (
                                        <tr key={idx} className="border-b border-slate-700/50 hover:bg-slate-700/30 transition">
                                            <td className="py-3 px-3 font-mono text-slate-500">{time}</td>
                                            <td className="py-3 px-3 text-white">
                                                <span className={`px-2 py-1 rounded text-xs font-bold ${item.action.includes('Match') ? 'bg-yellow-900 text-yellow-400' : (item.action.includes('Set') ? 'bg-green-900 text-green-400' : 'bg-slate-700')}`}>
                                                    {item.action}
                                                </span>
                                                {detailed.wasBreakPoint && <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-orange-900 text-orange-400" title="破發點">BP</span>}
                                                {detailed.wasBreak && <span className="ml-2 px-2 py-1 rounded text-xs font-bold bg-red-900 text-red-400" title="破發成功">BREAK</span>}
                                            </td>
                                            <td className="py-3 px-3 text-slate-300">
                                                <div>{item.detail}</div>
                                                {hasDetailedInfo && (
                                                    <div className="text-xs text-slate-500 mt-1">
                                                        {detailed.server && <span className="mr-2">發球: {detailed.server === 'A' ? matchData.teamA : matchData.teamB}</span>}
                                                        {detailed.isTieBreak && <span className="text-red-400 font-bold">搶七</span>}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="py-3 px-3 text-right font-mono text-yellow-500">{item.scoreSnapshot}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            
            {/* PDF 匯出模態框 */}
            {showPDFModal && <PDFExportModal matchData={matchData} matchId={matchId} history={history} onClose={() => setShowPDFModal(false)} />}
            
            {/* 截圖分享模態框 */}
            {showSnapshotModal && <ScoreSnapshotModal matchData={matchData} onClose={() => setShowSnapshotModal(false)} />}
        </div>
    );
};
