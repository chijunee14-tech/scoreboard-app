import React, { useState, useRef } from 'react';

const PDFExportModal = ({ matchData, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const contentRef = useRef(null);

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      const element = contentRef.current;
      
      // Use html2canvas to convert HTML to image
      const canvas = await html2canvas(element, {
        scale: 2, // Higher quality
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jspdf.jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pdfWidth - 20; // 10mm margin on each side
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      let heightLeft = imgHeight;
      let position = 10;

      // Add first page
      pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
      heightLeft -= (pdfHeight - 20);

      // Add additional pages if content is too long
      while (heightLeft > 0) {
        position = heightLeft - imgHeight + 10;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 10, position, imgWidth, imgHeight);
        heightLeft -= (pdfHeight - 20);
      }

      // Save the PDF
      const fileName = `${matchData.player1Name}_vs_${matchData.player2Name}_${new Date().toLocaleDateString('zh-TW')}.pdf`;
      pdf.save(fileName);

      alert('PDF 報告已成功產生！');
    } catch (error) {
      console.error('PDF 產生錯誤:', error);
      alert('PDF 產生失敗，請稍後再試。');
    } finally {
      setIsGenerating(false);
    }
  };

  // Calculate statistics
  const stats = matchData.stats || {};
  const totalPoints = stats.totalPoints || 0;
  const aces = stats.aces || [0, 0];
  const doubleFaults = stats.doubleFaults || [0, 0];
  const winners = stats.winners || [0, 0];
  const unforcedErrors = stats.unforcedErrors || [0, 0];
  const breakPoints = stats.breakPoints || [0, 0];
  const breakPointsWon = stats.breakPointsWon || [0, 0];
  const firstServeIn = stats.firstServeIn || [0, 0];
  const firstServeTotal = stats.firstServeTotal || [0, 0];
  const firstServeWon = stats.firstServeWon || [0, 0];
  const secondServeWon = stats.secondServeWon || [0, 0];
  const secondServeTotal = firstServeTotal.map((total, i) => total - firstServeIn[i]);

  const firstServePercent = firstServeTotal.map((total, i) => 
    total > 0 ? Math.round((firstServeIn[i] / total) * 100) : 0
  );
  const firstServeWinPercent = firstServeIn.map((serveIn, i) => 
    serveIn > 0 ? Math.round((firstServeWon[i] / serveIn) * 100) : 0
  );
  const secondServeWinPercent = secondServeTotal.map((total, i) => 
    total > 0 ? Math.round((secondServeWon[i] / total) * 100) : 0
  );
  const breakPointPercent = breakPoints.map((bp, i) => 
    bp > 0 ? Math.round((breakPointsWon[i] / bp) * 100) : 0
  );

  // Format duration
  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    const minutes = Math.floor(ms / 60000);
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}時${mins}分` : `${mins}分`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center z-10">
          <h2 className="text-2xl font-bold text-gray-800">PDF 賽後報告</h2>
          <div className="flex gap-2">
            <button
              onClick={generatePDF}
              disabled={isGenerating}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? '產生中...' : '下載 PDF'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition"
            >
              關閉
            </button>
          </div>
        </div>

        {/* PDF Content Preview */}
        <div ref={contentRef} className="bg-white p-8">
          {/* Title */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">網球比賽報告</h1>
            <p className="text-gray-600">
              {new Date(matchData.startTime).toLocaleDateString('zh-TW', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                weekday: 'long'
              })}
            </p>
          </div>

          {/* Match Summary */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">比賽結果</h2>
            <div className="grid grid-cols-3 gap-4 items-center">
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-800">{matchData.player1Name}</p>
                <p className="text-sm text-gray-600">{matchData.player1Team || '個人'}</p>
              </div>
              <div className="text-center">
                <p className="text-4xl font-bold text-blue-600">
                  {matchData.sets[0]} - {matchData.sets[1]}
                </p>
                <p className="text-sm text-gray-600 mt-1">局數</p>
              </div>
              <div className="text-left">
                <p className="text-2xl font-bold text-gray-800">{matchData.player2Name}</p>
                <p className="text-sm text-gray-600">{matchData.player2Team || '個人'}</p>
              </div>
            </div>
          </div>

          {/* Set Scores */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">各盤比分</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">選手</th>
                    {matchData.history.map((_, index) => (
                      <th key={index} className="border border-gray-300 px-4 py-2 text-center">
                        第 {index + 1} 盤
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-semibold">
                      {matchData.player1Name}
                    </td>
                    {matchData.history.map((set, index) => (
                      <td key={index} className="border border-gray-300 px-4 py-2 text-center text-lg">
                        {set.games[0]}
                        {set.tiebreak && set.tiebreak[0] !== undefined && (
                          <sup className="text-sm text-gray-600"> ({set.tiebreak[0]})</sup>
                        )}
                      </td>
                    ))}
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-semibold">
                      {matchData.player2Name}
                    </td>
                    {matchData.history.map((set, index) => (
                      <td key={index} className="border border-gray-300 px-4 py-2 text-center text-lg">
                        {set.games[1]}
                        {set.tiebreak && set.tiebreak[1] !== undefined && (
                          <sup className="text-sm text-gray-600"> ({set.tiebreak[1]})</sup>
                        )}
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Match Information */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">比賽資訊</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">比賽時間</p>
                <p className="text-lg font-semibold text-gray-800">
                  {formatDuration(matchData.duration)}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">比賽類型</p>
                <p className="text-lg font-semibold text-gray-800">
                  {matchData.bestOf === 3 ? '三盤兩勝' : '五盤三勝'}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">首發球員</p>
                <p className="text-lg font-semibold text-gray-800">
                  {matchData.firstServer === 0 ? matchData.player1Name : matchData.player2Name}
                </p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600">總分數</p>
                <p className="text-lg font-semibold text-gray-800">{totalPoints} 分</p>
              </div>
            </div>
          </div>

          {/* Statistics Table */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">技術統計</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">統計項目</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">{matchData.player1Name}</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">{matchData.player2Name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">Aces</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{aces[0]}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{aces[1]}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">雙發失誤</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{doubleFaults[0]}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{doubleFaults[1]}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">致勝球</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{winners[0]}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{winners[1]}</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">非受迫性失誤</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{unforcedErrors[0]}</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">{unforcedErrors[1]}</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">破發點</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {breakPointsWon[0]}/{breakPoints[0]} ({breakPointPercent[0]}%)
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {breakPointsWon[1]}/{breakPoints[1]} ({breakPointPercent[1]}%)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Serve Statistics */}
          <div className="mb-8">
            <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">發球統計</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 px-4 py-2 text-left">項目</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">{matchData.player1Name}</th>
                    <th className="border border-gray-300 px-4 py-2 text-center">{matchData.player2Name}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">一發進球率</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {firstServeIn[0]}/{firstServeTotal[0]} ({firstServePercent[0]}%)
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {firstServeIn[1]}/{firstServeTotal[1]} ({firstServePercent[1]}%)
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2">一發得分率</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {firstServeWon[0]}/{firstServeIn[0]} ({firstServeWinPercent[0]}%)
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {firstServeWon[1]}/{firstServeIn[1]} ({firstServeWinPercent[1]}%)
                    </td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2">二發得分率</td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {secondServeWon[0]}/{secondServeTotal[0]} ({secondServeWinPercent[0]}%)
                    </td>
                    <td className="border border-gray-300 px-4 py-2 text-center font-semibold">
                      {secondServeWon[1]}/{secondServeTotal[1]} ({secondServeWinPercent[1]}%)
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Set Timeline */}
          {matchData.history && matchData.history.length > 0 && (
            <div className="mb-8">
              <h2 className="text-xl font-bold text-gray-800 mb-4 border-b-2 border-blue-600 pb-2">比賽時間軸</h2>
              <div className="space-y-3">
                {matchData.history.map((set, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-gray-800">第 {index + 1} 盤</span>
                      <span className="text-gray-600">
                        {set.games[0]} - {set.games[1]}
                        {set.tiebreak && ` (搶七 ${set.tiebreak[0]}-${set.tiebreak[1]})`}
                      </span>
                      <span className="text-sm text-gray-500">
                        {formatDuration(set.duration)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 mt-8 pt-4 border-t">
            <p>報告產生時間：{new Date().toLocaleString('zh-TW')}</p>
            <p className="mt-1">Tennis Scoreboard App - 專業網球計分系統</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PDFExportModal;
