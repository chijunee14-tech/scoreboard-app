// ==========================================
// Component: Participant Selector
// ==========================================
const ParticipantSelector = ({ label, onSelect, appId, exclude = [] }) => {
    const { useState, useEffect, useMemo } = React;
    const [participants, setParticipants] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const q = db.collection('artifacts').doc(appId).collection('public').doc('data').collection('participants');
        const unsub = q.onSnapshot(snapshot => {
            const list = snapshot.docs.map(doc => doc.data().name);
            list.sort((a, b) => a.localeCompare(b));
            setParticipants(list);
            setLoading(false);
        });
        return () => unsub();
    }, [appId]);

    const filteredList = useMemo(() => {
        return participants.filter(p => 
            p.toLowerCase().includes(searchTerm.toLowerCase()) && 
            !exclude.includes(p)
        );
    }, [participants, searchTerm, exclude]);

    const handleAddNew = async () => {
        const nameToAdd = searchTerm.trim();
        if (!nameToAdd) return;
        try {
            if (!participants.includes(nameToAdd)) {
                await db.collection('artifacts').doc(appId).collection('public').doc('data').collection('participants').add({
                    name: nameToAdd,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            }
            onSelect(nameToAdd);
        } catch (err) { alert(err.message); }
    };

    return (
        <div className="flex flex-col h-full">
            <h3 className="text-xl font-bold text-blue-400 mb-4">{label}</h3>
            <div className="relative mb-4">
                <input
                    type="text"
                    placeholder="搜尋或輸入新名稱..."
                    className="w-full bg-slate-700 border border-slate-600 rounded p-3 pl-10 text-white focus:border-blue-500 focus:outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    autoFocus
                />
                <i className="fas fa-search absolute left-3 top-3.5 text-gray-400"></i>
            </div>
            <div className="flex-1 overflow-y-auto bg-slate-800 rounded border border-slate-700 p-2 min-h-[200px]">
                {searchTerm && !participants.some(p => p.toLowerCase() === searchTerm.toLowerCase()) && (
                    <button onClick={handleAddNew} className="text-left w-full p-3 bg-blue-900/30 border border-blue-500/50 rounded text-blue-300 flex items-center mb-2">
                        <div className="bg-blue-600 text-white w-6 h-6 rounded-full flex items-center justify-center mr-3"><i className="fas fa-plus text-xs"></i></div>
                        <span>新增 "{searchTerm}"</span>
                    </button>
                )}
                {filteredList.map(name => (
                    <button key={name} onClick={() => onSelect(name)} className="text-left w-full p-3 hover:bg-slate-700 rounded border-b border-slate-700/50 flex justify-between">
                        <span>{name}</span><i className="fas fa-chevron-right text-slate-500"></i>
                    </button>
                ))}
            </div>
        </div>
    );
};
