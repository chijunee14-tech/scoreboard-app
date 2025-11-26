// ==========================================
// Component: Score Snapshot Modal
// ==========================================
const ScoreSnapshotModal = ({ matchData, onClose }) => {
    const { useState, useRef, useEffect } = React;
    const [isGenerating, setIsGenerating] = useState(false);
    const [snapshotUrl, setSnapshotUrl] = useState(null);
    const snapshotRef = useRef(null);

    const generateSnapshot = async () => {
        setIsGenerating(true);

        try {
            const element = snapshotRef.current;
            if (!element) return;

            // 使用 html2canvas 截圖
            const canvas = await html2canvas(element, {
                backgroundColor: '#0f172a',
                scale: 2, // 提高解析度
                logging: false,
                width: 1200,
                height: 630, // 適合社交媒體的尺寸 (1200x630)
            });

            // 轉換為圖片 URL
            const url = canvas.toDataURL('image/png');
            setSnapshotUrl(url);
        } catch (error) {
            console.error('Snapshot generation error:', error);
            alert('截圖生成失敗，請稍後再試');
        } finally {
            setIsGenerating(false);
        }
    };

    const downloadSnapshot = () => {
        if (!snapshotUrl) return;

        const link = document.createElement('a');
        link.download = `${matchData.title.replace(/[^a-zA-Z0-9]/g, '_')}_Score_${Date.now()}.png`;
        link.href = snapshotUrl;
        link.click();
    };

    const copyToClipboard = async () => {
        if (!snapshotUrl) return;

        try {
            const response = await fetch(snapshotUrl);
            const blob = await response.blob();
            await navigator.clipboard.write([
                new ClipboardItem({ 'image/png': blob })
            ]);
            alert('已複製到剪貼簿！可直接貼上到社交媒體');
        } catch (error) {
            console.error('Copy to clipboard error:', error);
            alert('複製失敗，請使用下載功能');
        }
    };

    const shareToSocialMedia = (platform) => {
        if (!snapshotUrl) return;

        let url = '';
        const text = `${matchData.title} - ${matchData.teamA} vs ${matchData.teamB}`;

        switch (platform) {
            case 'twitter':
                url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
                break;
            case 'facebook':
                url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.href)}`;
                break;
            case 'line':
                url = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(window.location.href)}`;
                break;
        }

        if (url) {
            window.open(url, '_blank', 'width=600,height=400');
        }
    };

    useEffect(() => {
        // 自動生成截圖
        setTimeout(() => generateSnapshot(), 100);
    }, []);

    const statsA = matchData.stats?.teamA || {};
    const statsB = matchData.stats?.teamB || {};

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-slate-800 rounded-xl p-6 max-w-4xl w-full border border-slate-700 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <i className="fas fa-camera text-blue-500 mr-2"></i>
                        比分截圖分享
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <i className="fas fa-times fa-lg"></i>
                    </button>
                </div>

                {/* 截圖預覽區域 */}
                <div className="bg-slate-900 rounded-lg p-4 mb-4">
                    {isGenerating ? (
                        <div className="text-center py-20">
                            <i className="fas fa-spinner fa-spin text-blue-500 text-4xl mb-4"></i>
                            <div className="text-white text-lg">正在生成截圖...</div>
                        </div>
                    ) : snapshotUrl ? (
                        <div className="text-center">
                            <img src={snapshotUrl} alt="Score Snapshot" className="rounded-lg mx-auto max-w-full" />
                        </div>
                    ) : (
                        <div className="text-center py-20 text-slate-500">
                            <i className="fas fa-exclamation-triangle text-4xl mb-4"></i>
                            <div>生成失敗</div>
                        </div>
                    )}
                </div>

                {/* 隱藏的截圖源 */}
                <div style={{ position: 'absolute', left: '-9999px', top: '-9999px' }}>
                    <div
                        ref={snapshotRef}
                        style={{
                            width: '1200px',
                            height: '630px',
                            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                            padding: '60px',
                            fontFamily: 'Arial, sans-serif',
                            position: 'relative',
                        }}
                    >
                        {/* 背景裝飾 */}
                        <div style={{
                            position: 'absolute',
                            top: '0',
                            left: '0',
                            width: '100%',
                            height: '100%',
                            opacity: '0.1',
                            background: 'radial-gradient(circle at 20% 50%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 80% 50%, #22c55e 0%, transparent 50%)',
                        }}></div>

                        {/* Logo 和標題 */}
                        <div style={{ position: 'relative', zIndex: '1', marginBottom: '40px', textAlign: 'center' }}>
                            <div style={{ fontSize: '24px', color: '#eab308', fontWeight: 'bold', marginBottom: '10px' }}>
                                🎾 TENNIS PRO SCORE
                            </div>
                            <div style={{ fontSize: '32px', color: '#ffffff', fontWeight: 'bold' }}>
                                {matchData.title}
                            </div>
                            <div style={{ fontSize: '16px', color: '#94a3b8', marginTop: '10px' }}>
                                {MATCH_MODES[matchData.matchType]?.name || matchData.matchType}
                                {matchData.winner && ' • 已完賽'}
                            </div>
                        </div>

                        {/* 比分顯示 */}
                        <div style={{
                            position: 'relative',
                            zIndex: '1',
                            display: 'grid',
                            gridTemplateColumns: '1fr auto 1fr',
                            gap: '40px',
                            alignItems: 'center',
                            marginBottom: '40px',
                        }}>
                            {/* 選手 A */}
                            <div style={{ textAlign: 'right' }}>
                                <div style={{ fontSize: '36px', color: '#3b82f6', fontWeight: 'bold', marginBottom: '10px' }}>
                                    {matchData.teamA}
                                </div>
                                <div style={{ fontSize: '64px', color: '#ffffff', fontWeight: 'bold', lineHeight: '1' }}>
                                    {matchData.setsA.join(' - ')}
                                </div>
                            </div>

                            {/* VS */}
                            <div style={{
                                fontSize: '32px',
                                color: '#64748b',
                                fontWeight: 'bold',
                                padding: '0 20px',
                            }}>
                                VS
                            </div>

                            {/* 選手 B */}
                            <div style={{ textAlign: 'left' }}>
                                <div style={{ fontSize: '36px', color: '#22c55e', fontWeight: 'bold', marginBottom: '10px' }}>
                                    {matchData.teamB}
                                </div>
                                <div style={{ fontSize: '64px', color: '#ffffff', fontWeight: 'bold', lineHeight: '1' }}>
                                    {matchData.setsB.join(' - ')}
                                </div>
                            </div>
                        </div>

                        {/* 勝者標記 */}
                        {matchData.winner && (
                            <div style={{
                                position: 'relative',
                                zIndex: '1',
                                textAlign: 'center',
                                marginBottom: '30px',
                            }}>
                                <div style={{
                                    display: 'inline-block',
                                    padding: '10px 30px',
                                    background: 'linear-gradient(135deg, #eab308 0%, #f59e0b 100%)',
                                    borderRadius: '50px',
                                    fontSize: '20px',
                                    color: '#000000',
                                    fontWeight: 'bold',
                                }}>
                                    🏆 Winner: {matchData.winner === 'A' ? matchData.teamA : matchData.teamB}
                                </div>
                            </div>
                        )}

                        {/* 快速統計 */}
                        <div style={{
                            position: 'relative',
                            zIndex: '1',
                            display: 'grid',
                            gridTemplateColumns: 'repeat(4, 1fr)',
                            gap: '20px',
                            marginTop: '30px',
                        }}>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '5px' }}>Aces</div>
                                <div style={{ fontSize: '24px', color: '#ffffff', fontWeight: 'bold' }}>
                                    {statsA.aces || 0} - {statsB.aces || 0}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '5px' }}>雙誤</div>
                                <div style={{ fontSize: '24px', color: '#ffffff', fontWeight: 'bold' }}>
                                    {statsA.doubleFaults || 0} - {statsB.doubleFaults || 0}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '5px' }}>致勝球</div>
                                <div style={{ fontSize: '24px', color: '#ffffff', fontWeight: 'bold' }}>
                                    {statsA.winners || 0} - {statsB.winners || 0}
                                </div>
                            </div>
                            <div style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: '14px', color: '#94a3b8', marginBottom: '5px' }}>失誤</div>
                                <div style={{ fontSize: '24px', color: '#ffffff', fontWeight: 'bold' }}>
                                    {statsA.unforcedErrors || 0} - {statsB.unforcedErrors || 0}
                                </div>
                            </div>
                        </div>

                        {/* 頁尾 */}
                        <div style={{
                            position: 'absolute',
                            bottom: '20px',
                            left: '0',
                            right: '0',
                            textAlign: 'center',
                            fontSize: '14px',
                            color: '#64748b',
                        }}>
                            Generated by Tennis Pro Score • {new Date().toLocaleDateString('zh-TW')}
                        </div>
                    </div>
                </div>

                {/* 操作按鈕 */}
                {snapshotUrl && !isGenerating && (
                    <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={downloadSnapshot}
                                className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition font-semibold flex items-center justify-center"
                            >
                                <i className="fas fa-download mr-2"></i>
                                下載圖片
                            </button>
                            <button
                                onClick={copyToClipboard}
                                className="px-4 py-3 bg-green-600 hover:bg-green-500 text-white rounded-lg transition font-semibold flex items-center justify-center"
                            >
                                <i className="fas fa-copy mr-2"></i>
                                複製圖片
                            </button>
                        </div>

                        <div className="border-t border-slate-700 pt-3">
                            <div className="text-slate-400 text-sm mb-2 text-center">分享到社交媒體</div>
                            <div className="grid grid-cols-3 gap-3">
                                <button
                                    onClick={() => shareToSocialMedia('facebook')}
                                    className="px-4 py-2 bg-blue-700 hover:bg-blue-600 text-white rounded-lg transition flex items-center justify-center"
                                >
                                    <i className="fab fa-facebook mr-2"></i>
                                    Facebook
                                </button>
                                <button
                                    onClick={() => shareToSocialMedia('twitter')}
                                    className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white rounded-lg transition flex items-center justify-center"
                                >
                                    <i className="fab fa-twitter mr-2"></i>
                                    Twitter
                                </button>
                                <button
                                    onClick={() => shareToSocialMedia('line')}
                                    className="px-4 py-2 bg-green-500 hover:bg-green-400 text-white rounded-lg transition flex items-center justify-center"
                                >
                                    <i className="fab fa-line mr-2"></i>
                                    LINE
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
