// ==========================================
// Component: Create Match Modal/Wizard
// ==========================================
const CreateMatchModal = ({ onClose, onComplete, appId, user }) => {
    const { useState } = React;
    const [step, setStep] = useState(1); 
    const [data, setData] = useState({ title: '', matchType: '3set', teamA: '', teamB: '', password: '' });

    const createMatch = async () => {
        try {
            // 初始化網球數據結構
            const initialMatchData = {
                title: data.title,
                matchType: data.matchType,
                teamA: data.teamA,
                teamB: data.teamB,
                scoreA: 0, 
                scoreB: 0,
                setsA: [0], 
                setsB: [0],
                currentSetIndex: 0,
                isTieBreak: data.matchType === 'tiebreak', 
                server: 'A', 
                winner: null,
                undoStack: [], // 新增 undo stack (限制大小)
                password: data.password || null,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: user.uid,
                sport: 'tennis'
            };

            const docRef = await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('matches').add(initialMatchData);
            onComplete(docRef.id);
        } catch (err) { alert("建立失敗: " + err.message); }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700 flex flex-col max-h-[90vh]">
                <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
                    <h2 className="text-lg font-bold text-white">建立網球比賽</h2>
                    <button onClick={onClose}><i className="fas fa-times text-slate-400"></i></button>
                </div>
                <div className="flex h-1 bg-slate-700">
                    <div className="bg-yellow-500 transition-all duration-300" style={{ width: `${(step/5)*100}%` }}></div>
                </div>
                <div className="p-6 flex-1 overflow-y-auto">
                    {step === 1 && (
                        <form onSubmit={(e) => { e.preventDefault(); if(data.title.trim()) setStep(2); }}>
                            <h3 className="text-xl font-bold text-blue-400 mb-4">步驟 1: 比賽標題</h3>
                            <input className="w-full bg-slate-700 border border-slate-600 rounded p-3 text-white mb-6" autoFocus value={data.title} onChange={e => setData({...data, title: e.target.value})} placeholder="例: 溫布頓決賽" />
                            <button type="submit" disabled={!data.title.trim()} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded font-bold">下一步</button>
                        </form>
                    )}
                    {step === 2 && (
                        <div>
                            <h3 className="text-xl font-bold text-blue-400 mb-4">步驟 2: 選擇賽制</h3>
                            <div className="space-y-3">
                                {Object.entries(MATCH_MODES).map(([key, mode]) => (
                                    <button key={key} onClick={() => { setData({...data, matchType: key}); setStep(3); }}
                                        className={`w-full text-left p-4 rounded border ${data.matchType === key ? 'bg-blue-900/50 border-blue-500 ring-1 ring-blue-500' : 'bg-slate-700 border-slate-600 hover:bg-slate-600'}`}>
                                        <div className="font-bold">{mode.name}</div>
                                        <div className="text-xs text-slate-400 mt-1">
                                            {key === 'tiebreak' ? '一局定勝負 (搶10)' : `${mode.sets === 1 ? '一盤決勝' : `最多 ${mode.sets} 盤`} · 6局制`}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}
                    {step === 3 && <ParticipantSelector label="步驟 3: 主隊/選手 A" appId={appId} onSelect={(name) => { setData({...data, teamA: name}); setStep(4); }} />}
                    {step === 4 && <ParticipantSelector label="步驟 4: 客隊/選手 B" appId={appId} exclude={[data.teamA]} onSelect={(name) => { setData({...data, teamB: name}); setStep(5); }} />}
                    {step === 5 && (
                        <div>
                            <h3 className="text-xl font-bold text-blue-400 mb-4">步驟 5: 確認與密碼</h3>
                            <div className="bg-slate-900 p-4 rounded border border-slate-700 mb-4 text-sm space-y-2">
                                <div className="flex justify-between"><span className="text-slate-400">賽制</span><span>{MATCH_MODES[data.matchType].name}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">選手 A</span><span className="font-bold text-white">{data.teamA}</span></div>
                                <div className="flex justify-between"><span className="text-slate-400">選手 B</span><span className="font-bold text-white">{data.teamB}</span></div>
                            </div>
                            <input className="w-full bg-slate-700 border border-slate-600 rounded p-3 text-white mb-6" placeholder="裁判密碼 (選填)" value={data.password} onChange={e => setData({...data, password: e.target.value})} />
                            <button onClick={createMatch} className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded font-bold shadow-lg">建立比賽</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
