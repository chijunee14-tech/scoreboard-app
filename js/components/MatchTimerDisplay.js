// ==========================================
// Component: Match Timer Display
// ==========================================
const MatchTimerDisplay = ({ matchData }) => {
    const { useState, useEffect } = React;
    const [elapsedTime, setElapsedTime] = useState(0);

    useEffect(() => {
        if (!matchData.timing || matchData.winner) {
            // 如果沒有計時資料或已完賽，不計時
            return;
        }

        const interval = setInterval(() => {
            if (!matchData.timing.isPaused) {
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
        
        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (matchData.winner) {
        return null; // 已完賽不顯示計時
    }

    return (
        <span className="text-yellow-400 font-mono text-sm flex items-center">
            <i className="fas fa-clock mr-1"></i>
            {formatTime(elapsedTime)}
        </span>
    );
};
