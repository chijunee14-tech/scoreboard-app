// ==========================================
// Component: Tennis Referee Mode
// ==========================================

/**
 * 檢查當前是否為破發點
 * @param {number} scoreA - A 的分數
 * @param {number} scoreB - B 的分數
 * @param {string} server - 當前發球方 ('A' or 'B')
 * @param {boolean} isTieBreak - 是否為搶七
 * @returns {Object} { isBreakPoint: boolean, receiverTeam: string }
 */
const checkIfBreakPoint = (scoreA, scoreB, server, isTieBreak) => {
    // 搶七局不算破發點（沒有明確的發球局概念）
    if (isTieBreak) return { isBreakPoint: false, receiverTeam: null };
    
    const receiver = server === 'A' ? 'B' : 'A';
    const serverScore = server === 'A' ? scoreA : scoreB;
    const receiverScore = server === 'A' ? scoreB : scoreA;
    
    // 破發點條件：接發球方再得一分就能贏得這局
    // 1. 接發球方 >= 3 分且領先 1 分以上（包括 40-30, 40-15, 40-0, AD）
    if (receiverScore >= 3 && receiverScore - serverScore >= 1) {
        return { isBreakPoint: true, receiverTeam: receiver };
    }
    
    return { isBreakPoint: false, receiverTeam: null };
};

const TennisRefereeMode = ({ matchData, matchId, appId }) => {
    const { useState, useEffect } = React;
    const [elapsedTime, setElapsedTime] = useState(0);
    const [showStatsModal, setShowStatsModal] = useState(false);

    // 計時器邏輯
    useEffect(() => {
        const interval = setInterval(() => {
            if (matchData.timing && !matchData.timing.isPaused && !matchData.winner) {
                const now = Date.now();
                const startTime = matchData.timing.startTime?.toMillis?.() || matchData.timing.startTime || now;
                const pausedTime = matchData.timing.pausedTime || 0;
                setElapsedTime(Math.floor((now - startTime - pausedTime) / 1000));
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [matchData.timing, matchData.winner]);

    const formatTime = (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const togglePause = async () => {
        const isPaused = matchData.timing?.isPaused || false;
        const now = Date.now();
        
        if (isPaused) {
            // 恢復計時
            const pauseStart = matchData.timing.lastPauseStart || now;
            const pausedDuration = now - pauseStart;
            await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('matches').doc(matchId).update({
                'timing.isPaused': false,
                'timing.pausedTime': (matchData.timing.pausedTime || 0) + pausedDuration,
                'timing.lastPauseStart': null
            });
        } else {
            // 暫停計時
            await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('matches').doc(matchId).update({
                'timing.isPaused': true,
                'timing.lastPauseStart': now
            });
        }
    };

    // 處理統計並自動計分
    const handleStatAndPoint = async (statType, team) => {
        if (matchData.winner) return;
        
        // 判斷誰得分
        let winner;
        if (statType === 'aces') {
            // Ace: 發球方得分
            winner = matchData.server;
        } else if (statType === 'doubleFaults') {
            // 雙發失誤: 接球方得分
            winner = matchData.server === 'A' ? 'B' : 'A';
        } else if (statType === 'winners') {
            // 致勝球: 該隊得分
            winner = team === 'teamA' ? 'A' : 'B';
        } else if (statType === 'unforcedErrors') {
            // 失誤: 對方得分
            winner = team === 'teamA' ? 'B' : 'A';
        }
        
        // 自動計分（同時更新統計）
        if (winner) {
            await handlePoint(winner, statType, team);
        }
    };
    
    const handlePoint = async (winner, statType = null, statTeam = null) => {
        if (matchData.winner) return;

        const d = { ...matchData };
        
        // 如果有統計類型，先更新統計數據到本地副本
        if (statType && statTeam) {
            if (!d.stats) d.stats = { teamA: {}, teamB: {} };
            if (!d.stats[statTeam]) d.stats[statTeam] = {};
            
            const currentValue = d.stats[statTeam][statType] || 0;
            d.stats[statTeam][statType] = currentValue + 1;
        }
        
        // 1. 檢查當前是否為破發點 (在得分前檢查)
        const isBreakPoint = checkIfBreakPoint(d.scoreA, d.scoreB, d.server, d.isTieBreak);
        
        // 1.1 如果當前是破發點，先記錄破發點機會
        if (isBreakPoint.isBreakPoint) {
            const receiverTeam = isBreakPoint.receiverTeam === 'A' ? 'teamA' : 'teamB';
            
            // 確保 stats 結構存在
            if (!d.stats) d.stats = { teamA: {}, teamB: {} };
            if (!d.stats[receiverTeam]) d.stats[receiverTeam] = {};
            
            const currentTotal = d.stats[receiverTeam].breakPointsTotal || 0;
            d.stats[receiverTeam].breakPointsTotal = currentTotal + 1;
        }
        
        // 1.2 建立當前狀態的快照 (Snapshot) 用於 Undo（包含統計數據）
        const snapshot = {
            scoreA: d.scoreA,
            scoreB: d.scoreB,
            setsA: [...d.setsA], // Copy array
            setsB: [...d.setsB], // Copy array
            currentSetIndex: d.currentSetIndex,
            isTieBreak: d.isTieBreak,
            server: d.server,
            winner: d.winner,
            // 深拷貝統計數據
            stats: {
                teamA: { ...(matchData.stats?.teamA || {}) },
                teamB: { ...(matchData.stats?.teamB || {}) }
            }
        };

        // 限制 undoStack 大小為最近 20 步
        const currentStack = d.undoStack || [];
        const undoStack = [...currentStack.slice(-19), snapshot];

        const mode = MATCH_MODES[d.matchType];
        const setIdx = d.currentSetIndex;
        const isTb = d.isTieBreak;

        // 2. 增加分數
        if (winner === 'A') d.scoreA++;
        else d.scoreB++;

        // 2.1 處理 Tiebreak 發球規則（第一球後，每兩球換發球）
        if (isTb || d.matchType === 'tiebreak') {
            const totalPoints = d.scoreA + d.scoreB;
            // 第1球後換發球，之後每2球換發球（1, 3, 5, 7...）
            if (totalPoints === 1 || (totalPoints > 1 && (totalPoints - 1) % 2 === 0)) {
                d.server = d.server === 'A' ? 'B' : 'A';
            }
        }

        let gameWon = false;
        let setWon = false;
        let matchWon = false;

        // 3. 判斷是否贏得這局 (Game)
        if (isTb) {
            const target = d.matchType === 'tiebreak' ? mode.tiebreakTarget : 7;
            if ((winner === 'A' ? d.scoreA : d.scoreB) >= target && Math.abs(d.scoreA - d.scoreB) >= 2) {
                gameWon = true;
            }
        } else {
            if ((winner === 'A' ? d.scoreA : d.scoreB) >= 4 && Math.abs(d.scoreA - d.scoreB) >= 2) {
                gameWon = true;
            }
        }

        if (gameWon) {
            // 在重置分數前，檢查是否發生破發
            const wasBreak = (d.server !== winner);
            
            // 如果這是破發點且破發成功，記錄破發成功
            if (isBreakPoint.isBreakPoint && wasBreak && isBreakPoint.receiverTeam === winner) {
                const receiverTeam = isBreakPoint.receiverTeam === 'A' ? 'teamA' : 'teamB';
                const currentWon = d.stats[receiverTeam].breakPointsWon || 0;
                d.stats[receiverTeam].breakPointsWon = currentWon + 1;
            }
            
            d.scoreA = 0;
            d.scoreB = 0;
            
            if (d.matchType === 'tiebreak') {
                matchWon = true;
                setWon = true;
                d.setsA[setIdx] = winner === 'A' ? 1 : 0;
                d.setsB[setIdx] = winner === 'B' ? 1 : 0;
            } else {
                if (winner === 'A') d.setsA[setIdx]++;
                else d.setsB[setIdx]++;

                const gamesA = d.setsA[setIdx];
                const gamesB = d.setsB[setIdx];

                if (d.isTieBreak) {
                    setWon = true;
                    d.isTieBreak = false;
                } else {
                    if ((winner === 'A' ? gamesA : gamesB) >= mode.targetGames && Math.abs(gamesA - gamesB) >= 2) {
                        setWon = true;
                    } else if (gamesA === 6 && gamesB === 6) {
                        d.isTieBreak = true;
                    }
                }
                // 非 tiebreak 模式，每局結束後換發球
                if (!d.isTieBreak) {
                    d.server = d.server === 'A' ? 'B' : 'A';
                }
            }

            if (setWon) {
                let setsWonA = 0;
                let setsWonB = 0;
                d.setsA.forEach((s, i) => { if (s > d.setsB[i]) setsWonA++; else if (d.setsB[i] > s) setsWonB++; });
                
                const setsToWin = Math.ceil(mode.sets / 2);
                if (setsWonA >= setsToWin || setsWonB >= setsToWin) {
                    matchWon = true;
                    d.winner = setsWonA > setsWonB ? 'A' : 'B';
                } else {
                    d.currentSetIndex++;
                    d.setsA.push(0);
                    d.setsB.push(0);
                    d.isTieBreak = false;
                }
            }
        }

        // 4. Log History to subcollection (非阻塞式寫入)
        // 建立詳細描述
        let detailText = `${winner === 'A' ? d.teamA : d.teamB} wins point`;
        if (statType) {
            const statLabels = {
                'aces': 'Ace',
                'doubleFaults': '雙發失誤',
                'winners': '致勝球',
                'unforcedErrors': '非受迫性失誤'
            };
            detailText = `${winner === 'A' ? d.teamA : d.teamB} wins point (${statLabels[statType]})`;
        }
        
        const log = {
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            action: matchWon ? 'Match Finished' : (setWon ? 'Set Finished' : (gameWon ? 'Game Finished' : 'Point')),
            detail: detailText,
            scoreSnapshot: `Set:${d.setsA.join('-')}/${d.setsB.join('-')} | Pt:${formatTennisPoint(d.scoreA, d.scoreB, d.isTieBreak)}-${formatTennisPoint(d.scoreB, d.scoreA, d.isTieBreak)}`,
            // 詳細分數資訊
            detailedScore: {
                setsA: [...d.setsA],
                setsB: [...d.setsB],
                scoreA: d.scoreA,
                scoreB: d.scoreB,
                pointA: formatTennisPoint(d.scoreA, d.scoreB, d.isTieBreak),
                pointB: formatTennisPoint(d.scoreB, d.scoreA, d.isTieBreak),
                currentSetIndex: d.currentSetIndex,
                isTieBreak: d.isTieBreak,
                server: d.server,
                wasBreakPoint: isBreakPoint.isBreakPoint,
                wasBreak: gameWon && (d.server !== winner),
                statType: statType || null
            }
        };

        console.log('Creating history log:', log);
        console.log('Match ID:', matchId);
        console.log('App ID:', appId);

        // 5. Update Firestore (批次操作)
        const batch = db.batch();
        
        // 更新主文件 (不含 history)
        const matchRef = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('matches').doc(matchId);
        console.log('Match ref path:', matchRef.path);
        batch.update(matchRef, {
            scoreA: d.scoreA,
            scoreB: d.scoreB,
            setsA: d.setsA,
            setsB: d.setsB,
            currentSetIndex: d.currentSetIndex,
            isTieBreak: d.isTieBreak,
            server: d.server,
            winner: d.winner || null,
            stats: d.stats,
            undoStack: undoStack,
            lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
        });
        
        // 新增歷史記錄到子集合
        const historyRef = matchRef.collection('history').doc();
        batch.set(historyRef, log);
        
        console.log('Committing batch with history to:', historyRef.path);
        await batch.commit();
        console.log('Batch committed successfully');
    };

    // Undo Function
    const undoLastPoint = async () => {
        if (!matchData.undoStack || matchData.undoStack.length === 0) {
            alert("已經是最早的狀態，無法復原。");
            return;
        }
        
        const previousState = matchData.undoStack[matchData.undoStack.length - 1];
        const newStack = matchData.undoStack.slice(0, -1); // Pop

        try {
            // 1. 取得最新的 history 記錄
            const historyRef = db.collection('artifacts')
                .doc(appId)
                .collection('public')
                .doc('data')
                .collection('matches')
                .doc(matchId)
                .collection('history');
            
            const latestHistorySnapshot = await historyRef
                .orderBy('timestamp', 'desc')
                .limit(1)
                .get();
            
            // 2. 使用批次操作更新比賽狀態和刪除記錄
            const batch = db.batch();
            
            // 更新比賽狀態
            const matchRef = db.collection('artifacts')
                .doc(appId)
                .collection('public')
                .doc('data')
                .collection('matches')
                .doc(matchId);
            
            // 還原包含統計數據的完整狀態
            batch.update(matchRef, {
                scoreA: previousState.scoreA,
                scoreB: previousState.scoreB,
                setsA: previousState.setsA,
                setsB: previousState.setsB,
                currentSetIndex: previousState.currentSetIndex,
                isTieBreak: previousState.isTieBreak,
                server: previousState.server,
                winner: previousState.winner,
                stats: previousState.stats || { teamA: {}, teamB: {} },  // 還原統計數據
                undoStack: newStack
            });
            
            // 刪除最新的 history 記錄
            if (!latestHistorySnapshot.empty) {
                const latestHistoryDoc = latestHistorySnapshot.docs[0];
                batch.delete(latestHistoryDoc.ref);
            }
            
            await batch.commit();
        } catch (error) {
            console.error('Undo error:', error);
            alert('復原失敗：' + error.message);
        }
    };

    // 手動換發球
    const toggleServer = async () => {
        await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('matches').doc(matchId).update({
            server: matchData.server === 'A' ? 'B' : 'A'
        });
    };

     const deleteMatch = async () => {
        if(!confirm("⚠️ 危險操作：您確定要「永久刪除」這場比賽嗎？")) return;
        if (matchData.password) {
            if (prompt("請輸入密碼：") !== matchData.password) return alert("密碼錯誤");
        }
        await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('matches').doc(matchId).delete();
    };

    const ptA = formatTennisPoint(matchData.scoreA, matchData.scoreB, matchData.isTieBreak);
    const ptB = formatTennisPoint(matchData.scoreB, matchData.scoreA, matchData.isTieBreak);

    return (
        <div className="p-2 sm:p-4 max-w-4xl mx-auto">
            <div className="bg-slate-800 rounded-xl p-3 sm:p-6 shadow-lg border border-slate-700">
                <div className="flex justify-between items-start mb-3 sm:mb-6">
                    <div>
                        <h2 className="text-base sm:text-xl font-bold text-yellow-400">裁判台</h2>
                        <h3 className="text-sm sm:text-base text-white font-bold truncate">{matchData.title}</h3>
                        <div className="text-xs text-slate-400 mt-1">
                            {MATCH_MODES[matchData.matchType]?.name}
                            {matchData.isTieBreak && <span className="ml-2 text-red-400 font-bold animate-pulse">● TIE-BREAK</span>}
                            {matchData.winner && <span className="ml-2 text-green-400 font-bold">● 完賽</span>}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        {/* 計時器顯示 */}
                        <div className="bg-slate-900 px-3 py-2 rounded border border-slate-700 flex items-center gap-2">
                            <i className="fas fa-clock text-yellow-400"></i>
                            <span className="font-mono text-white font-bold text-sm sm:text-base">{formatTime(elapsedTime)}</span>
                            <button onClick={togglePause} className="ml-2 text-xs px-2 py-1 bg-slate-700 hover:bg-slate-600 rounded">
                                <i className={`fas fa-${matchData.timing?.isPaused ? 'play' : 'pause'}`}></i>
                            </button>
                        </div>
                        {matchData.password && <span className="text-xs bg-red-900/50 text-red-300 px-2 py-1 rounded border border-red-800"><i className="fas fa-lock mr-1"></i>Protected</span>}
                    </div>
                </div>

                {/* Ace 和雙發失誤按鈕 - 保持在上方 */}
                <div className="grid grid-cols-2 gap-2 mb-4">
                    <button 
                        onClick={() => handleStatAndPoint('aces', matchData.server === 'A' ? 'teamA' : 'teamB')} 
                        disabled={!!matchData.winner}
                        className="bg-yellow-600 hover:bg-yellow-500 active:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded text-sm sm:text-base flex items-center justify-center gap-2 font-bold shadow-lg touch-manipulation">
                        <i className="fas fa-bolt"></i>
                        <span>Ace ({matchData.server === 'A' ? matchData.teamA : matchData.teamB} 得分)</span>
                    </button>
                    <button 
                        onClick={() => handleStatAndPoint('doubleFaults', matchData.server === 'A' ? 'teamA' : 'teamB')} 
                        disabled={!!matchData.winner}
                        className="bg-red-600 hover:bg-red-500 active:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded text-sm sm:text-base flex items-center justify-center gap-2 font-bold shadow-lg touch-manipulation">
                        <i className="fas fa-times-circle"></i>
                        <span>雙誤 ({matchData.server === 'A' ? matchData.teamB : matchData.teamA} 得分)</span>
                    </button>
                </div>

                {/* Main Scoreboard Area */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-8">
                    {/* Player A */}
                    <div className={`relative p-3 sm:p-6 rounded-xl border-2 transition ${matchData.winner === 'A' ? 'border-yellow-500 bg-yellow-900/20' : 'border-slate-600 bg-slate-900'} flex flex-col items-center`}>
                        {matchData.server === 'A' && !matchData.winner && <i className="fas fa-baseball-ball absolute top-2 sm:top-4 left-2 sm:left-4 text-yellow-400 animate-bounce text-sm sm:text-base"></i>}
                        <h3 className="player-name-referee font-bold text-white mb-2 truncate w-full text-center">{matchData.teamA}</h3>
                        
                        {/* 致勝和失誤按鈕 - 選手 A */}
                        <div className="w-full grid grid-cols-2 gap-2 mb-3">
                            <button 
                                onClick={() => handleStatAndPoint('winners', 'teamA')} 
                                disabled={!!matchData.winner}
                                className="bg-green-700 hover:bg-green-600 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-2 rounded text-xs sm:text-sm flex flex-col items-center justify-center shadow touch-manipulation">
                                <i className="fas fa-star mb-1"></i>
                                <span>致勝</span>
                            </button>
                            <button 
                                onClick={() => handleStatAndPoint('unforcedErrors', 'teamA')} 
                                disabled={!!matchData.winner}
                                className="bg-orange-700 hover:bg-orange-600 active:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-2 rounded text-xs sm:text-sm flex flex-col items-center justify-center shadow touch-manipulation">
                                <i className="fas fa-exclamation-triangle mb-1"></i>
                                <span>失誤</span>
                            </button>
                        </div>
                        
                        <div className="score-display leading-none font-mono font-bold text-blue-400 my-2">{ptA !== '' && ptA !== null && ptA !== undefined ? ptA : '\u00A0'}</div>
                        <button onClick={() => handlePoint('A')} disabled={!!matchData.winner} className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-base sm:text-xl shadow-lg btn-press touch-manipulation">
                            得分 +1
                        </button>
                    </div>

                    {/* Player B */}
                    <div className={`relative p-3 sm:p-6 rounded-xl border-2 transition ${matchData.winner === 'B' ? 'border-yellow-500 bg-yellow-900/20' : 'border-slate-600 bg-slate-900'} flex flex-col items-center`}>
                        {matchData.server === 'B' && !matchData.winner && <i className="fas fa-baseball-ball absolute top-2 sm:top-4 left-2 sm:left-4 text-yellow-400 animate-bounce text-sm sm:text-base"></i>}
                        <h3 className="player-name-referee font-bold text-white mb-2 truncate w-full text-center">{matchData.teamB}</h3>
                        
                        {/* 致勝和失誤按鈕 - 選手 B */}
                        <div className="w-full grid grid-cols-2 gap-2 mb-3">
                            <button 
                                onClick={() => handleStatAndPoint('winners', 'teamB')} 
                                disabled={!!matchData.winner}
                                className="bg-green-700 hover:bg-green-600 active:bg-green-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-2 rounded text-xs sm:text-sm flex flex-col items-center justify-center shadow touch-manipulation">
                                <i className="fas fa-star mb-1"></i>
                                <span>致勝</span>
                            </button>
                            <button 
                                onClick={() => handleStatAndPoint('unforcedErrors', 'teamB')} 
                                disabled={!!matchData.winner}
                                className="bg-orange-700 hover:bg-orange-600 active:bg-orange-800 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 px-2 rounded text-xs sm:text-sm flex flex-col items-center justify-center shadow touch-manipulation">
                                <i className="fas fa-exclamation-triangle mb-1"></i>
                                <span>失誤</span>
                            </button>
                        </div>
                        
                        <div className="score-display leading-none font-mono font-bold text-blue-400 my-2">{ptB !== '' && ptB !== null && ptB !== undefined ? ptB : '\u00A0'}</div>
                        <button onClick={() => handlePoint('B')} disabled={!!matchData.winner} className="w-full py-3 sm:py-4 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-bold text-base sm:text-xl shadow-lg btn-press touch-manipulation">
                            得分 +1
                        </button>
                    </div>
                </div>

                {/* Sets Detail */}
                <div className="bg-slate-900 p-2 sm:p-4 rounded-lg mb-3 sm:mb-6 overflow-x-auto">
                    <table className="w-full text-center border-collapse">
                        <thead>
                            <tr className="text-slate-500 text-xs uppercase">
                                <th className="text-left p-1 sm:p-2 text-xs sm:text-sm">Player</th>
                                {matchData.setsA.map((_, i) => <th key={i} className="p-1 sm:p-2 w-8 sm:w-12 text-xs sm:text-sm">S{i+1}</th>)}
                            </tr>
                        </thead>
                        <tbody className="font-mono text-base sm:text-lg">
                            <tr className="border-b border-slate-800">
                                <td className="text-left p-1 sm:p-2 font-bold text-white text-sm sm:text-base truncate max-w-[100px]">{matchData.teamA}</td>
                                {matchData.setsA.map((s, i) => <td key={i} className={`p-1 sm:p-2 ${i === matchData.currentSetIndex ? 'text-yellow-400' : 'text-slate-400'}`}>{s}</td>)}
                            </tr>
                            <tr>
                                <td className="text-left p-1 sm:p-2 font-bold text-white text-sm sm:text-base truncate max-w-[100px]">{matchData.teamB}</td>
                                {matchData.setsB.map((s, i) => <td key={i} className={`p-1 sm:p-2 ${i === matchData.currentSetIndex ? 'text-yellow-400' : 'text-slate-400'}`}>{s}</td>)}
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 justify-between items-stretch pt-3 sm:pt-4 border-t border-slate-700">
                    <button onClick={undoLastPoint} className="flex-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white py-2 sm:py-2 rounded shadow flex items-center justify-center text-sm sm:text-base touch-manipulation">
                        <i className="fas fa-undo mr-1 sm:mr-2"></i> 上一步
                    </button>
                    <button onClick={toggleServer} className="flex-1 bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-white py-2 sm:py-2 rounded shadow flex items-center justify-center text-sm sm:text-base touch-manipulation">
                        <i className="fas fa-exchange-alt mr-1 sm:mr-2"></i> 換發球
                    </button>
                    <button onClick={() => setShowStatsModal(!showStatsModal)} className="flex-1 bg-blue-900/50 hover:bg-blue-800/50 active:bg-blue-700/50 text-blue-300 py-2 sm:py-2 rounded shadow flex items-center justify-center text-sm sm:text-base touch-manipulation">
                        <i className="fas fa-chart-bar mr-1 sm:mr-2"></i> 統計
                    </button>
                    <button onClick={deleteMatch} className="flex-1 bg-red-900/50 hover:bg-red-800/50 active:bg-red-700/50 text-red-300 py-2 sm:py-2 rounded shadow flex items-center justify-center text-sm sm:text-base touch-manipulation">
                        <i className="fas fa-trash mr-1 sm:mr-2"></i> 刪除
                    </button>
                </div>
            </div>

            {/* 統計面板 */}
            {showStatsModal && <TennisStatsPanel matchData={matchData} />}
        </div>
    );
};
