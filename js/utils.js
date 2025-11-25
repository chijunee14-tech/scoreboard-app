// ==========================================
// Tennis Logic & Utilities
// ==========================================

// Match Mode Definitions
const MATCH_MODES = {
    'tiebreak': { name: '搶十決勝 (Tie-break Only)', sets: 1, targetGames: 0, tiebreakTarget: 10 },
    '1set':     { name: '單盤決勝 (1 Set)', sets: 1, targetGames: 6, tiebreakTarget: 7 },
    '3set':     { name: '三盤兩勝 (Best of 3)', sets: 3, targetGames: 6, tiebreakTarget: 7 },
    '5set':     { name: '五盤三勝 (Best of 5)', sets: 5, targetGames: 6, tiebreakTarget: 7 },
};

/**
 * Format tennis point display
 * @param {number} pA - Player A's points
 * @param {number} pB - Player B's points
 * @param {boolean} isTieBreak - Whether it's a tie-break
 * @returns {string} Formatted point string
 */
const formatTennisPoint = (pA, pB, isTieBreak) => {
    if (isTieBreak) return pA; // 搶七直接顯示數字
    
    // Deuce Logic (3 = 40分)
    if (pA >= 3 && pB >= 3) {
        if (pA === pB) return '40'; // Deuce 雙方顯示 40
        if (pA > pB) return 'AD';   // 領先者顯示 AD
        return '';                  // 落後者顯示 空白
    }

    // Normal Scoring
    switch(pA) {
        case 0: return '0';
        case 1: return '15';
        case 2: return '30';
        case 3: return '40';
        default: return '0';
    }
};
