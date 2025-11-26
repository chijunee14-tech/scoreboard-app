// ==========================================
// Component: QR Code Share Modal
// ==========================================
const QRCodeShareModal = ({ matchId, onClose }) => {
    const { useEffect, useRef } = React;
    const qrCodeRef = useRef(null);
    
    // 生成觀看 URL
    const viewUrl = `${window.location.origin}${window.location.pathname}?match=${matchId}&mode=display`;
    
    useEffect(() => {
        // 清空之前的 QR Code
        if (qrCodeRef.current) {
            qrCodeRef.current.innerHTML = '';
            
            // 生成新的 QR Code
            new QRCode(qrCodeRef.current, {
                text: viewUrl,
                width: 256,
                height: 256,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.H
            });
        }
    }, [viewUrl]);
    
    const copyToClipboard = () => {
        navigator.clipboard.writeText(viewUrl).then(() => {
            alert('連結已複製到剪貼簿！');
        }).catch(err => {
            console.error('複製失敗:', err);
        });
    };
    
    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl shadow-2xl max-w-md w-full border border-slate-700">
                <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
                    <h2 className="text-lg font-bold text-white flex items-center">
                        <i className="fas fa-qrcode mr-2 text-blue-400"></i>
                        分享比賽
                    </h2>
                    <button onClick={onClose} className="text-slate-400 hover:text-white">
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                
                <div className="p-6">
                    <p className="text-slate-300 text-sm mb-4 text-center">
                        掃描 QR Code 或使用連結即時查看比分
                    </p>
                    
                    {/* QR Code 容器 */}
                    <div className="flex justify-center mb-6 bg-white p-4 rounded-lg">
                        <div ref={qrCodeRef}></div>
                    </div>
                    
                    {/* URL 顯示 */}
                    <div className="bg-slate-900 p-3 rounded border border-slate-700 mb-4">
                        <div className="flex items-center gap-2">
                            <input 
                                type="text" 
                                value={viewUrl} 
                                readOnly 
                                className="flex-1 bg-transparent text-slate-300 text-xs sm:text-sm outline-none"
                            />
                            <button 
                                onClick={copyToClipboard}
                                className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                                <i className="fas fa-copy"></i>
                                <span className="hidden sm:inline">複製</span>
                            </button>
                        </div>
                    </div>
                    
                    {/* 說明 */}
                    <div className="text-xs text-slate-400 space-y-1">
                        <p><i className="fas fa-info-circle mr-2"></i>觀眾可以透過此連結查看即時比分</p>
                        <p><i className="fas fa-tv mr-2"></i>自動進入大螢幕顯示模式</p>
                        <p><i className="fas fa-sync mr-2"></i>比分會即時同步更新</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
