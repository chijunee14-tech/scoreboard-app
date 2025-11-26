# scoreboard-app

## 網球專業記分板系統

### 核心功能
- ✅ 多種比賽模式（搶十、單盤、三盤、五盤）
- ✅ 三種操作界面（裁判台、大螢幕顯示、歷史紀錄）
- ✅ 自動計分邏輯（包含 Deuce、Tiebreak）
- ✅ 發球權自動切換
- ✅ Undo 復原功能（最多 20 步）
- ✅ 參與者管理系統
- ✅ 密碼保護功能
- ✅ Firebase 即時同步

### 🆕 第一階段新功能

#### 1. 📊 專業統計數據系統
- **Ace 球記錄** - 快速記錄每位選手的發球直得
- **雙發失誤統計** - 追蹤雙發失誤次數
- **致勝球記錄** - 記錄主動得分的致勝球
- **非受迫性失誤** - 追蹤選手失誤情況
- **破發點轉換率** - 自動計算破發成功率
- **視覺化長條圖** - 即時比較兩位選手的數據

#### 2. ⏱️ 比賽計時器
- **自動計時** - 從比賽開始自動計時
- **暫停/恢復功能** - 可暫停計時（如雨延、醫療暫停）
- **即時顯示** - 裁判模式顯示比賽時長（HH:MM:SS）
- **時間追蹤** - 記錄比賽總時長和暫停時間

#### 3. 📱 QR Code 分享功能
- **一鍵生成 QR Code** - 自動生成比賽觀看連結
- **掃碼即看** - 觀眾掃描後立即查看即時比分
- **URL 複製** - 可直接複製分享連結
- **自動進入顯示模式** - 觀眾端自動進入大螢幕模式
- **即時同步** - 比分變化即時更新到所有觀眾設備

### 🚀 第二階段新功能（最新）

#### 4. 📊 進階數據分析系統
- **一發/二發得分率** - 詳細追蹤發球表現統計
- **發球局/接發球局得分** - 自動記錄保發和破發成功次數
- **得分走勢圖** - 視覺化顯示比賽動態（最近 30 分）
- **動能指標** - 即時顯示最近 5 分的動能變化
- **分頁式界面** - 總覽、發球分析、動能分析三大分頁
- **圓形進度圖** - 直觀展示各項數據百分比
- **總得分統計** - 自動累計雙方總得分

#### 5. 📄 PDF 賽後報告匯出
- **專業報告格式** - 包含完整比賽資訊和統計數據
- **自動表格生成** - 使用 jsPDF-AutoTable 生成專業表格
- **多頁面支持** - 自動分頁處理大量數據
- **統計數據表** - 詳細的 Aces、雙誤、致勝球等統計
- **比賽時間軸** - 記錄最近 20 條比賽事件
- **進度條顯示** - 生成過程即時反饋
- **一鍵下載** - 自動命名並下載 PDF 文件

#### 6. 📸 比分截圖分享
- **精美比分卡片** - 自動生成 1200x630 社交媒體尺寸
- **自動截圖** - 使用 html2canvas 高解析度渲染
- **快速統計展示** - 卡片包含主要統計數據
- **漸層背景設計** - 專業視覺效果
- **一鍵下載圖片** - PNG 格式高畫質輸出
- **複製到剪貼簿** - 快速貼上到其他應用
- **社交媒體分享** - 支援 Facebook、Twitter、LINE 直接分享
- **即時預覽** - 生成前預覽最終效果

### 使用方式

#### 裁判模式
1. 點擊「新增賽事」創建比賽
2. 使用「得分 +1」按鈕記錄分數
3. 使用頂部快捷按鈕記錄統計（Ace、雙誤、致勝、失誤）
4. 查看計時器了解比賽時長
5. 點擊「統計」按鈕查看詳細數據
6. 點擊「快速截圖」生成比分卡片分享

#### 分享比賽
1. 點擊右上角「分享」按鈕
2. 顯示 QR Code 供觀眾掃描
3. 或複製連結直接分享

#### 查看統計與匯出
1. **基礎統計**: 紀錄模式自動顯示
2. **進階分析**: 點擊「進階」按鈕查看詳細數據
3. **PDF 報告**: 點擊「PDF」按鈕匯出完整報告
4. **比分截圖**: 點擊「截圖」按鈕生成分享卡片
5. **CSV 匯出**: 點擊「CSV」按鈕下載詳細記錄

### 技術架構
- **前端**: React 18 + Tailwind CSS
- **後端**: Firebase Firestore (即時資料庫)
- **認證**: Firebase Anonymous Auth
- **QR Code**: QRCode.js
- **PDF 生成**: jsPDF + jsPDF-AutoTable
- **截圖生成**: html2canvas
- **圖示**: Font Awesome 6

### 數據結構

#### Match Document
```javascript
{
  title: string,
  teamA: string,
  teamB: string,
  matchType: 'tiebreak' | '1set' | '3set' | '5set',
  scoreA: number,
  scoreB: number,
  setsA: number[],
  setsB: number[],
  currentSetIndex: number,
  isTieBreak: boolean,
  server: 'A' | 'B',
  winner: 'A' | 'B' | null,
  password: string | null,
  createdAt: timestamp,
  timing: {
    startTime: timestamp,
    isPaused: boolean,
    pausedTime: number,
    lastPauseStart: timestamp | null
  },
  stats: {
    teamA: {
      aces: number,
      doubleFaults: number,
      winners: number,
      unforcedErrors: number,
      breakPointsWon: number,
      breakPointsTotal: number,
      totalPoints: number,
      firstServeWon: number,
      firstServeTotal: number,
      secondServeWon: number,
      secondServeTotal: number,
      serviceGamesWon: number,
      returnGamesWon: number
    },
    teamB: { ... }
  },
  undoStack: Array
}
```

### 下一步規劃
- 🎯 語音播報系統（得分提示音）
- 🎯 選手資料庫擴充（照片、排名）
- 🎯 賽事排程管理
- 🎯 AI 語音辨識計分
- 🎯 自訂主題配色
- 🎯 快捷鍵操作支援
