// ==========================================
// Component: PDF Export Modal
// ==========================================
const PDFExportModal = ({ matchData, matchId, onClose, history = [] }) => {
    const { useState } = React;
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState(0);

    const generatePDF = async () => {
        setIsGenerating(true);
        setProgress(10);

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // 載入中文字體（使用內建支援）
            doc.setFont('helvetica');
            
            let yPos = 20;
            const pageWidth = doc.internal.pageSize.getWidth();
            const pageHeight = doc.internal.pageSize.getHeight();
            const margin = 20;

            // 標題
            doc.setFontSize(24);
            doc.setTextColor(37, 99, 235); // Blue
            doc.text('Tennis Match Report', pageWidth / 2, yPos, { align: 'center' });
            yPos += 15;

            setProgress(20);

            // 比賽資訊框
            doc.setFillColor(248, 250, 252);
            doc.roundedRect(margin, yPos, pageWidth - 2 * margin, 40, 3, 3, 'F');
            
            doc.setFontSize(12);
            doc.setTextColor(51, 65, 85);
            yPos += 10;
            doc.text(`Match: ${matchData.title}`, margin + 5, yPos);
            yPos += 8;
            doc.text(`Type: ${MATCH_MODES[matchData.matchType]?.name || matchData.matchType}`, margin + 5, yPos);
            yPos += 8;
            doc.text(`Date: ${new Date().toLocaleDateString('zh-TW')}`, margin + 5, yPos);
            yPos += 8;
            doc.text(`Status: ${matchData.winner ? 'Completed' : 'In Progress'}`, margin + 5, yPos);
            yPos += 15;

            setProgress(30);

            // 比分區塊
            doc.setFontSize(16);
            doc.setTextColor(37, 99, 235);
            doc.text('Final Score', margin, yPos);
            yPos += 10;

            // 選手 A
            doc.setFontSize(14);
            doc.setTextColor(59, 130, 246); // Blue
            doc.text(matchData.teamA, margin + 5, yPos);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(matchData.setsA.join(' - '), pageWidth - margin - 40, yPos, { align: 'right' });
            yPos += 10;

            // 選手 B
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(14);
            doc.setTextColor(34, 197, 94); // Green
            doc.text(matchData.teamB, margin + 5, yPos);
            doc.setFontSize(20);
            doc.setFont('helvetica', 'bold');
            doc.text(matchData.setsB.join(' - '), pageWidth - margin - 40, yPos, { align: 'right' });
            yPos += 15;

            setProgress(40);

            // 勝者標記
            if (matchData.winner) {
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(12);
                doc.setTextColor(234, 179, 8); // Yellow
                const winner = matchData.winner === 'A' ? matchData.teamA : matchData.teamB;
                doc.text(`Winner: ${winner}`, margin + 5, yPos);
                yPos += 15;
            }

            setProgress(50);

            // 統計表格
            doc.setFontSize(16);
            doc.setTextColor(37, 99, 235);
            doc.text('Match Statistics', margin, yPos);
            yPos += 10;

            const statsA = matchData.stats?.teamA || {};
            const statsB = matchData.stats?.teamB || {};

            // 準備統計表格數據
            const statsData = [
                ['Statistic', matchData.teamA, matchData.teamB],
                ['Aces', statsA.aces || 0, statsB.aces || 0],
                ['Double Faults', statsA.doubleFaults || 0, statsB.doubleFaults || 0],
                ['Winners', statsA.winners || 0, statsB.winners || 0],
                ['Unforced Errors', statsA.unforcedErrors || 0, statsB.unforcedErrors || 0],
                ['Total Points', statsA.totalPoints || 0, statsB.totalPoints || 0],
            ];

            // 破發點轉換率
            const breakConvA = statsA.breakPointsTotal > 0 
                ? `${statsA.breakPointsWon || 0}/${statsA.breakPointsTotal} (${Math.round(((statsA.breakPointsWon || 0) / statsA.breakPointsTotal) * 100)}%)`
                : '0/0 (0%)';
            const breakConvB = statsB.breakPointsTotal > 0 
                ? `${statsB.breakPointsWon || 0}/${statsB.breakPointsTotal} (${Math.round(((statsB.breakPointsWon || 0) / statsB.breakPointsTotal) * 100)}%)`
                : '0/0 (0%)';
            statsData.push(['Break Points', breakConvA, breakConvB]);

            // 一發得分率
            if (statsA.firstServeTotal || statsB.firstServeTotal) {
                const firstServeA = statsA.firstServeTotal > 0 
                    ? `${statsA.firstServeWon || 0}/${statsA.firstServeTotal} (${Math.round(((statsA.firstServeWon || 0) / statsA.firstServeTotal) * 100)}%)`
                    : '0/0 (0%)';
                const firstServeB = statsB.firstServeTotal > 0 
                    ? `${statsB.firstServeWon || 0}/${statsB.firstServeTotal} (${Math.round(((statsB.firstServeWon || 0) / statsB.firstServeTotal) * 100)}%)`
                    : '0/0 (0%)';
                statsData.push(['1st Serve Win Rate', firstServeA, firstServeB]);
            }

            // 二發得分率
            if (statsA.secondServeTotal || statsB.secondServeTotal) {
                const secondServeA = statsA.secondServeTotal > 0 
                    ? `${statsA.secondServeWon || 0}/${statsA.secondServeTotal} (${Math.round(((statsA.secondServeWon || 0) / statsA.secondServeTotal) * 100)}%)`
                    : '0/0 (0%)';
                const secondServeB = statsB.secondServeTotal > 0 
                    ? `${statsB.secondServeWon || 0}/${statsB.secondServeTotal} (${Math.round(((statsB.secondServeWon || 0) / statsB.secondServeTotal) * 100)}%)`
                    : '0/0 (0%)';
                statsData.push(['2nd Serve Win Rate', secondServeA, secondServeB]);
            }

            setProgress(60);

            // 使用 autoTable 插件生成表格
            doc.autoTable({
                startY: yPos,
                head: [statsData[0]],
                body: statsData.slice(1),
                theme: 'grid',
                headStyles: {
                    fillColor: [37, 99, 235],
                    textColor: [255, 255, 255],
                    fontStyle: 'bold',
                    halign: 'center'
                },
                bodyStyles: {
                    halign: 'center'
                },
                columnStyles: {
                    0: { fontStyle: 'bold', halign: 'left' },
                    1: { textColor: [59, 130, 246] },
                    2: { textColor: [34, 197, 94] }
                },
                margin: { left: margin, right: margin }
            });

            yPos = doc.lastAutoTable.finalY + 15;

            setProgress(70);

            // 如果有歷史記錄，添加新頁面
            if (history && history.length > 0) {
                doc.addPage();
                yPos = 20;

                doc.setFontSize(16);
                doc.setTextColor(37, 99, 235);
                doc.text('Match Timeline', margin, yPos);
                yPos += 10;

                // 準備歷史記錄表格（只取最近 20 條）
                const recentHistory = history.slice(-20);
                const historyData = [['Time', 'Event', 'Score']];

                recentHistory.forEach(item => {
                    let time = '--:--';
                    try {
                        if (item.timestamp?.toDate) {
                            time = item.timestamp.toDate().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
                        } else if (item.timestamp) {
                            time = new Date(item.timestamp).toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
                        }
                    } catch (e) {
                        console.error('Timestamp parsing error:', e);
                    }

                    historyData.push([
                        time,
                        `${item.action || ''} ${item.detail || ''}`.trim(),
                        item.scoreSnapshot || ''
                    ]);
                });

                doc.autoTable({
                    startY: yPos,
                    head: [historyData[0]],
                    body: historyData.slice(1),
                    theme: 'striped',
                    headStyles: {
                        fillColor: [37, 99, 235],
                        textColor: [255, 255, 255],
                        fontStyle: 'bold'
                    },
                    columnStyles: {
                        0: { cellWidth: 25 },
                        1: { cellWidth: 'auto' },
                        2: { cellWidth: 40, halign: 'center' }
                    },
                    margin: { left: margin, right: margin }
                });

                setProgress(90);
            }

            // 頁尾資訊
            const totalPages = doc.internal.getNumberOfPages();
            for (let i = 1; i <= totalPages; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(148, 163, 184);
                doc.text(
                    `Page ${i} of ${totalPages}`,
                    pageWidth / 2,
                    pageHeight - 10,
                    { align: 'center' }
                );
                doc.text(
                    `Generated by Tennis Pro Score - ${new Date().toLocaleString('zh-TW')}`,
                    pageWidth / 2,
                    pageHeight - 5,
                    { align: 'center' }
                );
            }

            setProgress(100);

            // 儲存 PDF
            const fileName = `${matchData.title.replace(/[^a-zA-Z0-9]/g, '_')}_Report_${Date.now()}.pdf`;
            doc.save(fileName);

            setTimeout(() => {
                setIsGenerating(false);
                setProgress(0);
                onClose();
            }, 500);

        } catch (error) {
            console.error('PDF generation error:', error);
            alert('PDF 生成失敗，請稍後再試');
            setIsGenerating(false);
            setProgress(0);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-xl p-6 max-w-md w-full border border-slate-700 shadow-2xl">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <i className="fas fa-file-pdf text-red-500 mr-2"></i>
                        匯出 PDF 報告
                    </h3>
                    {!isGenerating && (
                        <button onClick={onClose} className="text-slate-400 hover:text-white">
                            <i className="fas fa-times fa-lg"></i>
                        </button>
                    )}
                </div>

                {!isGenerating ? (
                    <div>
                        <div className="bg-slate-900 p-4 rounded-lg mb-4">
                            <div className="text-slate-300 text-sm mb-3">報告將包含：</div>
                            <ul className="text-slate-400 text-sm space-y-2">
                                <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    完整比賽資訊和最終比分
                                </li>
                                <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    詳細統計數據表格
                                </li>
                                <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    破發點轉換率分析
                                </li>
                                <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    發球得分率統計
                                </li>
                                <li className="flex items-center">
                                    <i className="fas fa-check text-green-500 mr-2"></i>
                                    比賽時間軸 (最近 20 條)
                                </li>
                            </ul>
                        </div>

                        <div className="flex gap-3">
                            <button
                                onClick={onClose}
                                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-semibold"
                            >
                                取消
                            </button>
                            <button
                                onClick={generatePDF}
                                className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-500 text-white rounded-lg transition font-semibold flex items-center justify-center"
                            >
                                <i className="fas fa-download mr-2"></i>
                                生成 PDF
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <div className="mb-4">
                            <i className="fas fa-spinner fa-spin text-blue-500 text-4xl"></i>
                        </div>
                        <div className="text-white text-lg font-semibold mb-3">正在生成 PDF...</div>
                        <div className="bg-slate-900 rounded-full h-3 overflow-hidden mb-2">
                            <div
                                className="bg-blue-500 h-full transition-all duration-300"
                                style={{ width: `${progress}%` }}
                            ></div>
                        </div>
                        <div className="text-slate-400 text-sm">{progress}%</div>
                    </div>
                )}
            </div>
        </div>
    );
};
