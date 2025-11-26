// ==========================================
// Main App Component
// ==========================================
const App = () => {
    const { useState, useEffect } = React;
    const [user, setUser] = useState(null);
    const [view, setView] = useState('home'); 
    const [currentMatchId, setCurrentMatchId] = useState(null);
    const [mode, setMode] = useState('referee'); 
    const [isCreatingMatch, setIsCreatingMatch] = useState(false);
    const [showQRCode, setShowQRCode] = useState(false);
    
    const [matches, setMatches] = useState([]);
    const [currentMatchData, setCurrentMatchData] = useState(null);

    useEffect(() => { auth.onAuthStateChanged(u => setUser(u)); }, []);

    // 檢查 URL 參數，自動進入比賽
    useEffect(() => {
        if (!user) return;
        const urlParams = new URLSearchParams(window.location.search);
        const matchId = urlParams.get('match');
        const urlMode = urlParams.get('mode');
        
        if (matchId) {
            setCurrentMatchId(matchId);
            setMode(urlMode || 'display');
            setView('match');
        }
    }, [user]);

    useEffect(() => {
        if (!user || view !== 'home') return;
        const q = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('matches')
                    .orderBy('createdAt', 'desc').limit(20);
        const unsub = q.onSnapshot(snap => setMatches(snap.docs.map(doc => ({id: doc.id, ...doc.data()}))));
        return () => unsub();
    }, [user, view]);

    useEffect(() => {
        if (!user || view !== 'match' || !currentMatchId) return;
        const unsub = db.collection('artifacts').doc(APP_ID).collection('public').doc('data').collection('matches').doc(currentMatchId)
                        .onSnapshot(doc => {
                            if(doc.exists) setCurrentMatchData(doc.data());
                            else { alert("比賽不存在"); setView('home'); }
                        });
        return () => unsub();
    }, [user, view, currentMatchId]);

    const enterMatch = (id, targetMode = 'referee') => {
        const match = matches.find(m => m.id === id);
        if (targetMode === 'referee' && match?.password) {
            if (prompt("請輸入密碼：") !== match.password) return alert("密碼錯誤");
        }
        setCurrentMatchId(id);
        setMode(targetMode);
        setView('match');
    };

    const switchMode = (newMode) => {
        if (newMode === 'referee' && currentMatchData?.password) {
            if (prompt("請輸入密碼解鎖：") !== currentMatchData.password) return alert("密碼錯誤");
        }
        setMode(newMode);
    };

    if (!user) return <div className="h-screen flex items-center justify-center">Loading...</div>;

    if (view === 'home') {
        return (
            <div className="min-h-screen bg-slate-900 p-6">
                <header className="max-w-4xl mx-auto flex justify-between items-center mb-10">
                    <h1 className="text-3xl font-bold text-white tracking-wider flex items-center">
                        <i className="fas fa-baseball-ball text-yellow-400 mr-3"></i>
                        Tennis Pro Score
                    </h1>
                    <button onClick={() => setIsCreatingMatch(true)} className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-bold shadow-lg transform hover:scale-105 transition">
                        <i className="fas fa-plus mr-2"></i>新增賽事
                    </button>
                </header>

                {isCreatingMatch && (
                    <CreateMatchModal 
                        onClose={() => setIsCreatingMatch(false)}
                        appId={APP_ID} user={user}
                        onComplete={(id) => { setIsCreatingMatch(false); enterMatch(id); }}
                    />
                )}

                <main className="max-w-4xl mx-auto grid gap-4">
                    {matches.map(m => (
                        <div key={m.id} className="bg-slate-800 p-4 rounded-lg flex items-center justify-between border border-slate-700 hover:border-blue-500 transition">
                            <div className="flex-1">
                                <div className="text-blue-400 font-bold">{m.title}</div>
                                <div className="text-xl text-white font-bold my-1">
                                    {m.teamA} <span className="text-slate-500 text-sm mx-1">vs</span> {m.teamB}
                                </div>
                                <div className="text-xs flex items-center gap-2">
                                    <span className="text-slate-500">{MATCH_MODES[m.matchType]?.name}</span>
                                    <span className="text-slate-500">•</span>
                                    {m.winner ? (
                                        <span className="text-slate-500">已完賽</span>
                                    ) : m.timing?.isPaused ? (
                                        <span className="text-yellow-400 font-semibold animate-pulse flex items-center">
                                            <i className="fas fa-pause-circle mr-1"></i>
                                            暫停
                                        </span>
                                    ) : (
                                        <span className="status-live font-semibold">進行中</span>
                                    )}
                                    {!m.winner && <span className="text-slate-500">•</span>}
                                    {!m.winner && <MatchTimerDisplay matchData={m} />}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => enterMatch(m.id, 'display')} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-blue-300"><i className="fas fa-tv mr-1"></i>顯示</button>
                                <button onClick={() => enterMatch(m.id, 'review')} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded text-green-300"><i className="fas fa-history mr-1"></i>紀錄</button>
                                <button onClick={() => enterMatch(m.id, 'referee')} className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded font-bold text-white">裁判台</button>
                            </div>
                        </div>
                    ))}
                </main>
            </div>
        );
    }

    if (view === 'match' && currentMatchData) {
        if (mode === 'display') {
            return (
                <div className="h-screen w-screen relative bg-black">
                    <button onClick={() => setView('home')} className="absolute top-4 left-4 text-slate-600 hover:text-white z-50"><i className="fas fa-arrow-left fa-2x"></i></button>
                    <TennisDisplayMode matchData={currentMatchData} />
                </div>
            );
        }
        return (
            <div className="min-h-screen bg-slate-900 flex flex-col">
                <nav className="bg-slate-800 p-4 border-b border-slate-700 flex justify-between">
                    <button onClick={() => setView('home')} className="text-slate-400 hover:text-white"><i className="fas fa-chevron-left mr-1"></i> 列表</button>
                    <div className="space-x-2">
                        <button onClick={() => switchMode('referee')} className={`px-4 py-1 rounded ${mode === 'referee' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>裁判</button>
                        <button onClick={() => switchMode('display')} className="px-4 py-1 rounded text-slate-400 hover:text-white">大螢幕</button>
                        <button onClick={() => switchMode('review')} className={`px-4 py-1 rounded ${mode === 'review' ? 'bg-blue-600 text-white' : 'text-slate-400'}`}>紀錄</button>
                    </div>
                    <button onClick={() => setShowQRCode(true)} className="text-slate-400 hover:text-white flex items-center gap-2">
                        <i className="fas fa-share-alt"></i>
                        <span className="hidden sm:inline">分享</span>
                    </button>
                </nav>
                
                {/* QR Code 分享模態框 */}
                {showQRCode && <QRCodeShareModal matchId={currentMatchId} onClose={() => setShowQRCode(false)} />}
                
                <div className="flex-1 overflow-y-auto">
                    {mode === 'referee' && <TennisRefereeMode matchData={currentMatchData} matchId={currentMatchId} appId={APP_ID} />}
                    {mode === 'review' && <TennisReviewMode matchData={currentMatchData} matchId={currentMatchId} appId={APP_ID} />}
                </div>
            </div>
        );
    }
    return null;
};

// ==========================================
// Render App to DOM
// ==========================================
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
