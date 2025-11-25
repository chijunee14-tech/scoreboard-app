// ==========================================
// Component: Tennis Display Mode (Big Screen)
// ==========================================
const TennisDisplayMode = ({ matchData }) => {
    const ptA = formatTennisPoint(matchData.scoreA, matchData.scoreB, matchData.isTieBreak);
    const ptB = formatTennisPoint(matchData.scoreB, matchData.scoreA, matchData.isTieBreak);

    return (
        <div className="h-full flex flex-col items-center justify-center bg-black p-2 sm:p-4">
             <div className="text-slate-500 text-lg sm:text-2xl md:text-3xl font-bold mb-4 sm:mb-8 uppercase tracking-wider sm:tracking-[0.5em] text-center">
                {matchData.title}
            </div>

            <div className="w-full max-w-7xl bg-slate-900 border-2 sm:border-4 border-slate-700 rounded-lg overflow-hidden shadow-2xl">
                {/* Header Row */}
                <div className="tennis-grid bg-slate-800 text-slate-400 font-bold text-xs sm:text-base md:text-xl py-2 sm:py-4 border-b border-slate-700">
                    <div className="pl-2 sm:pl-4 md:pl-8 flex items-center text-xs sm:text-sm md:text-base">PLAYER</div>
                    {[0,1,2,3,4].map(i => (
                        <div key={i} className="text-center flex items-center justify-center text-xs sm:text-sm md:text-base">
                            {i < matchData.setsA.length ? `S${i+1}` : ''}
                        </div>
                    ))}
                    <div className="text-center bg-slate-700 text-white flex items-center justify-center text-xs sm:text-sm md:text-base">PT</div>
                </div>

                {/* Player A Row */}
                <div className="tennis-grid py-2 border-b border-slate-800 items-center h-24 sm:h-32 md:h-48">
                    <div className="pl-2 sm:pl-4 md:pl-8 player-name-display font-bold text-white flex items-center gap-2 sm:gap-4 truncate">
                        <span className="truncate">{matchData.teamA}</span>
                        {matchData.server === 'A' && !matchData.winner && <div className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-yellow-400 shadow-[0_0_10px_yellow] flex-shrink-0"></div>}
                    </div>
                    {[0,1,2,3,4].map(i => (
                        <div key={i} className={`text-center set-score-display font-mono font-bold ${i === matchData.currentSetIndex ? 'text-white' : 'text-slate-600'}`}>
                            {matchData.setsA[i] !== undefined ? matchData.setsA[i] : ''}
                        </div>
                    ))}
                    <div className="bg-black/30 h-full flex items-center justify-center px-1">
                        <span className={`display-score font-mono font-bold ${matchData.isTieBreak ? 'text-red-500' : 'text-yellow-400'}`}>
                            {ptA}
                        </span>
                    </div>
                </div>

                {/* Player B Row */}
                <div className="tennis-grid py-2 items-center h-24 sm:h-32 md:h-48">
                    <div className="pl-2 sm:pl-4 md:pl-8 player-name-display font-bold text-white flex items-center gap-2 sm:gap-4 truncate">
                        <span className="truncate">{matchData.teamB}</span>
                        {matchData.server === 'B' && !matchData.winner && <div className="w-2 h-2 sm:w-3 sm:h-3 md:w-4 md:h-4 rounded-full bg-yellow-400 shadow-[0_0_10px_yellow] flex-shrink-0"></div>}
                    </div>
                    {[0,1,2,3,4].map(i => (
                        <div key={i} className={`text-center set-score-display font-mono font-bold ${i === matchData.currentSetIndex ? 'text-white' : 'text-slate-600'}`}>
                            {matchData.setsB[i] !== undefined ? matchData.setsB[i] : ''}
                        </div>
                    ))}
                    <div className="bg-black/30 h-full flex items-center justify-center px-1">
                        <span className={`display-score font-mono font-bold ${matchData.isTieBreak ? 'text-red-500' : 'text-yellow-400'}`}>
                            {ptB}
                        </span>
                    </div>
                </div>
            </div>
            
            {matchData.isTieBreak && <div className="mt-3 sm:mt-6 text-red-500 text-base sm:text-xl md:text-2xl font-bold animate-pulse">TIE-BREAK</div>}
            {matchData.winner && <div className="mt-3 sm:mt-6 text-yellow-400 text-xl sm:text-2xl md:text-4xl font-bold text-center px-2">WINNER: {matchData.winner === 'A' ? matchData.teamA : matchData.teamB}</div>}
        </div>
    );
};
