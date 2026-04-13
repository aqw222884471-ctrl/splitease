# 分帳程式 SplitEase - 規格文件 v2

## 1. 專案概述

- **名稱**：SplitEase
- **類型**：響應式網頁應用程式
- **目標用戶**：需要分攤費用的群體（聚餐、旅行、合租等）
- **核心功能**：雙模式分帳（晚餐模式 + 完整模式）、自動計算結算

## 2. 技術堆疊

| 層面 | 技術 |
|------|------|
| 前端 | React + Vite + Tailwind CSS |
| 後端 | Node.js + Express |
| 資料庫 | Google Sheets API |
| 即時同步 | Polling (每 5 秒) |
| 部署 | Vercel (前端) + Railway (後端) |

## 3. 運作模式

### 3.1 晚餐模式 🍜
適用場景：固定一人叫晚餐、累積一週或一個月結清

**記錄方式**：
- 召集人輸入「外送費」
- 逐一輸入成員點餐金額（誰點多少付多少）
- 外送費均分（外送費 ÷ 人數）

**計算邏輯**：
```
本次應付 = 個人餐點金額 + (外送費 ÷ 人數)
累積欠款 = Σ 每次應付
```

**結算功能**：
- 顯示每人累積欠款
- 支援「週結」/「月結」提醒
- 一鍵結清（清除記錄）

### 3.2 完整模式 📊
適用場景：旅行分攤、多筆支出、自定義分攤比例

功能與 v1 相同，保留完整分帳功能：
- 任意人記錄支出
- 分攤方式：均分/自訂比例/指定人
- 顯示結算路徑

## 4. 資料結構

### 4.1 Projects（專案總表）
| 欄位 | 類型 | 說明 |
|------|------|------|
| projectId | string | 唯一識別碼 (UUID) |
| name | string | 專案名稱 |
| mode | string | 模式：dinner / full |
| inviteCode | string | 6位數邀請碼 |
| createdAt | timestamp | 建立時間 |
| currency | string | 幣別（預設 TWD）|
| hostId | string | 召集人 ID（晚餐模式）|

### 4.2 {projectId}_Participants（參與者）
| 欄位 | 類型 | 說明 |
|------|------|------|
| participantId | string | 唯一識別碼 |
| name | string | 顯示名稱 |
| joinedAt | timestamp | 加入時間 |

### 4.3 {projectId}_Expenses（支出）
| 欄位 | 類型 | 說明 |
|------|------|------|
| expenseId | string | 唯一識別碼 |
| mode | string | dinner / full |
| payerId | string | 付款人 ID（full 模式用）|
| description | string | 項目說明 |
| amount | number | 總金額 |
| dinnerItems | JSON | 晚餐項目（dinner 模式用）|
| deliveryFee | number | 外送費（dinner 模式用）|
| splitType | string | average/custom/percentage（full 模式用）|
| splitData | JSON | 分攤比例數據 |
| createdAt | timestamp | 消費時間 |
| createdBy | string | 記錄人 |

### 4.4 dinnerItems 結構（晚餐模式）
```json
[
  { "participantId": "xxx", "name": "A", "amount": 150 },
  { "participantId": "xxx", "name": "B", "amount": 200 }
]
```

### 4.5 {projectId}_Settlement（結算）
| 欄位 | 類型 | 說明 |
|------|------|------|
| fromId | string | 欠款人 ID |
| toId | string | 收款人 ID |
| amount | number | 應付金額 |

## 5. API 端點

### 5.1 專案管理
- `POST /api/projects` - 建立新專案（可選模式）
- `GET /api/projects/:projectId` - 取得專案資訊
- `GET /api/projects/join/:inviteCode` - 用邀請碼加入專案

### 5.2 參與者
- `POST /api/projects/:projectId/participants` - 新增參與者
- `GET /api/projects/:projectId/participants` - 取得參與者列表
- `DELETE /api/projects/:projectId/participants/:participantId` - 移除參與者

### 5.3 支出
- `GET /api/projects/:projectId/expenses` - 取得所有支出
- `POST /api/projects/:projectId/expenses` - 新增支出（支援兩種模式）
- `DELETE /api/projects/:projectId/expenses/:expenseId` - 刪除支出

### 5.4 晚餐模式專用
- `GET /api/projects/:projectId/balance` - 取得晚餐模式餘額
- `POST /api/projects/:projectId/settle` - 結清（晚餐模式）

### 5.5 結算（完整模式）
- `GET /api/projects/:projectId/settlement` - 計算並取得結算結果

## 6. 前端頁面

### 6.1 首頁（Home）
- SplitEase Logo
- 我的專案列表（顯示名稱 + 模式 + 當前欠款）
- [建立新專案] 按鈕
- [輸入邀請碼加入] 按鈕

### 6.2 建立專案（CreateProject）
- 選擇模式：
  - 🍜 晚餐模式（快速度記、週結月結）
  - 📊 完整模式（旅行分攤、複雜分帳）
- 輸入專案名稱
- 輸入你的暱稱
- 選擇幣別
- [建立] 按鈕 → 顯示邀請碼

### 6.3 加入專案（JoinProject）
- 輸入 6 位數邀請碼
- 輸入你的暱稱
- [加入] 按鈕

### 6.4 專案儀表板（ProjectDashboard）

**晚餐模式**：
- 顯示「當前欠款 NT$xxx」
- [新增點單] 按鈕
- 點單歷史（日期 + 金額）
- [查看結算] 按鈕

**完整模式**：
- 專案名稱 + 邀請碼
- 參與者列表
- [新增支出] 按鈕
- 支出明細列表
- [查看結算] 按鈕

### 6.5 新增點單（AddDinnerOrder - 晚餐模式）
- 輸入外送費
- 成員點餐 清單：
  - [成員A] 輸入金額
  - [成員B] 輸入金額
  - ...
- [確認新增] 按鈕

### 6.6 新增支出（AddExpense - 完整模式）
- 選擇付款人
- 輸入項目說明
- 輸入金額
- 選擇分攤方式
- [確認新增] 按鈕

### 6.7 結算結果

**晚餐模式**：
- 每人累積欠款對照表
- 設定結清日（週結/月結）
- [一鍵結清] 按鈕

**完整模式**：
- 最佳還款路徑
- 每人已墊付 vs 應分攤
- [一鍵結清] 按鈕

## 7. UI/UX 設計

### 7.1 色彩方案
- 主色：#6366F1（Indigo）
- 晚餐模式強調色：#F59E0B（Orange）
- 背景：#F8FAFC
- 卡片：#FFFFFF
- 文字：#1E293B
- 成功：#10B981
- 警告：#F59E0B

### 7.2 響應式斷點
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 7.3 交互設計
- 模式切換有視覺區分（晚餐用橙色 icon）
- 卡片有輕微圓角 (12px)
- 載入時有 skeleton loading
- 錯誤訊息用 Toast 提示

## 8.待實現功能

- [ ] Google Sheets 整合
- [ ] 匯出 CSV
- [ ] 週期性結清提醒通知

---

**文件版本**：v2.0
**建立日期**：2026-04-13