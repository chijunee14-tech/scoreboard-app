# GitHub Pages 部署說明

## 問題說明

當部署到 GitHub Pages 時，遇到 Jekyll 構建錯誤：

```
Error: Liquid syntax error (line 66): Variable '{{ width: `${percentA}' 
was not properly terminated with regexp: /\}\}/
```

### 問題原因

GitHub Pages 默認使用 Jekyll 靜態網站生成器，Jekyll 使用 Liquid 模板引擎。Liquid 會將 `{{` 和 `}}` 視為變量標記，但我們的 Markdown 文檔中包含 JavaScript/React 代碼示例，這些代碼中的花括號被誤認為是 Liquid 語法。

## 解決方案

### 方案 1：禁用 Jekyll（推薦）✅

在根目錄創建 `.nojekyll` 文件，告訴 GitHub Pages 不使用 Jekyll 處理：

```bash
# 創建空文件
touch .nojekyll
```

**優點**：
- ✅ 簡單直接
- ✅ 不需要修改文檔內容
- ✅ 避免所有 Jekyll 相關問題
- ✅ 更快的構建速度

**缺點**：
- ❌ 無法使用 Jekyll 的主題和插件功能

### 方案 2：使用 Liquid Raw 標籤

在包含 `{{ }}` 的代碼塊周圍使用 `{% raw %}` 和 `{% endraw %}`：

```markdown
{% raw %}
```javascript
const style = {{ width: `${percent}%` }};
```
{% endraw %}
```

**優點**：
- ✅ 保留 Jekyll 功能
- ✅ 可以使用主題

**缺點**：
- ❌ 需要手動包裹每個代碼塊
- ❌ 文檔維護較複雜

## 當前實施

本項目採用 **方案 1**：

1. ✅ 已創建 `.nojekyll` 文件
2. ✅ 已在 BUGFIX_REPORT.md 中使用 `{% raw %}` 標籤（作為備用）

## 驗證部署

部署後檢查：

1. **GitHub Actions 日誌**：
   - 訪問 `https://github.com/[username]/scoreboard-app/actions`
   - 查看最新的部署工作流
   - 確認沒有 Jekyll 錯誤

2. **網站訪問**：
   - 訪問 `https://[username].github.io/scoreboard-app/`
   - 檢查 index.html 是否正常加載
   - 測試應用功能

3. **Markdown 文檔**：
   - 訪問文檔頁面（如果配置了）
   - 確認代碼塊正確顯示

## GitHub Pages 配置

### 啟用 GitHub Pages

1. 進入 Repository Settings
2. 找到 "Pages" 選項
3. 配置如下：
   - **Source**: Deploy from a branch
   - **Branch**: main (或 master)
   - **Folder**: / (root)

### 自定義域名（可選）

如需使用自定義域名：

1. 在 Settings > Pages 中添加域名
2. 在根目錄創建 `CNAME` 文件：
   ```
   your-domain.com
   ```
3. 在域名提供商設置 DNS：
   ```
   Type: CNAME
   Name: www
   Value: [username].github.io
   ```

## 文件結構

```
scoreboard-app/
├── .nojekyll           # ← 禁用 Jekyll
├── index.html          # 主應用入口
├── README.md           # 項目說明
├── BUGFIX_REPORT.md    # 修復報告（含 raw 標籤）
├── TESTING_GUIDE.md    # 測試指南
├── IMPLEMENTATION_REPORT.md  # 實作報告
├── QUICK_START.md      # 快速開始
├── css/
│   └── styles.css
├── js/
│   ├── app.js
│   ├── config.js
│   ├── utils.js
│   └── components/
│       ├── AdvancedStatsPanel.js
│       ├── PDFExportModal.js
│       ├── ScoreSnapshotModal.js
│       └── ...
```

## 常見問題

### Q1: 為什麼選擇禁用 Jekyll？

**A**: 這是一個純前端應用（HTML + JavaScript），不需要 Jekyll 的服務器端渲染功能。禁用 Jekyll 可以：
- 避免 Liquid 語法衝突
- 加快部署速度
- 簡化維護

### Q2: 如果需要使用 Jekyll 主題怎麼辦？

**A**: 有兩個選擇：
1. 使用方案 2，為所有包含 `{{ }}` 的代碼塊添加 raw 標籤
2. 將文檔移到 `/docs` 目錄，主應用保持在根目錄

### Q3: .nojekyll 文件會影響什麼？

**A**: 
- ✅ 不影響：HTML、CSS、JavaScript 的正常運行
- ✅ 不影響：GitHub Pages 的靜態文件托管
- ❌ 禁用：Jekyll 主題和插件
- ❌ 禁用：Liquid 模板處理

### Q4: 如何更新部署？

**A**: 
1. 提交並推送代碼到 main 分支
2. GitHub Actions 自動觸發部署
3. 通常 1-2 分鐘後生效

```bash
git add .
git commit -m "Update application"
git push origin main
```

### Q5: 部署失敗怎麼辦？

**A**: 檢查順序：
1. 查看 GitHub Actions 日誌
2. 確認 `.nojekyll` 文件存在
3. 檢查 index.html 是否在根目錄
4. 確認沒有 Jekyll 配置文件（_config.yml）衝突

## 最佳實踐

### 部署前檢查清單

- [ ] `.nojekyll` 文件已創建
- [ ] index.html 在根目錄
- [ ] 所有資源路徑使用相對路徑
- [ ] Firebase 配置正確
- [ ] 測試所有功能正常

### 資源路徑

確保所有資源使用相對路徑：

```html
<!-- ✅ 正確 -->
<link rel="stylesheet" href="css/styles.css">
<script src="js/app.js"></script>

<!-- ❌ 錯誤 -->
<link rel="stylesheet" href="/css/styles.css">
<script src="/js/app.js"></script>
```

### CORS 和 API

如果使用外部 API（如 Firebase）：
- ✅ Firebase 自動處理 CORS
- ✅ CDN 資源通常允許跨域
- ⚠️ 自定義 API 需要配置 CORS

## 監控和維護

### 部署狀態

在 README 中添加狀態徽章：

```markdown
[![GitHub Pages](https://github.com/[username]/scoreboard-app/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/[username]/scoreboard-app/actions/workflows/pages/pages-build-deployment)
```

### 性能優化

1. **壓縮資源**：
   - 使用 CDN 版本的庫（已實現）
   - 壓縮圖片和資源

2. **緩存策略**：
   - 瀏覽器會自動緩存靜態資源
   - 更新時修改文件名或版本號

3. **加載優化**：
   - 異步加載 JavaScript
   - 延遲載入非關鍵資源

## 更新日誌

### 2025-11-26
- ✅ 添加 `.nojekyll` 文件
- ✅ 修復 BUGFIX_REPORT.md 的 Liquid 語法錯誤
- ✅ 創建部署說明文檔

## 參考資源

- [GitHub Pages 官方文檔](https://docs.github.com/en/pages)
- [Jekyll 文檔](https://jekyllrb.com/docs/)
- [Liquid 模板語言](https://shopify.github.io/liquid/)

---

**狀態**: ✅ 已解決  
**部署方式**: 靜態文件（無 Jekyll）  
**訪問方式**: https://[username].github.io/scoreboard-app/
