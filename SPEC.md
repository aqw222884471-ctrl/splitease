# 分帳程式 SplitEase - 規格文件

## 1. 專案概述

- **名稱**：SplitEase
- **類型**：響應式網頁應用程式
- **目標用戶**：需要分攤費用的群體（聚餐、旅行、合租等）
- **核心功能**：建立專案、記錄支出、自動計算結算、即時多人同步

## 2. 技術堆疊

| 層面 | 技術 |
|------|------|
| 前端 | React + Vite + Tailwind CSS |
| 後端 | Node.js + Express |
| 資料庫 | Google Sheets API |
| 即時同步 | Polling (每 5 秒) |
| 部署 | Vercel (前端) + Railway (後端) |

## 3. Google Sheets 資料結構

### 3.1 Projects（專案總表）
| 欄位 | 類型 | 說明 |
|------|------|------|
| projectId | string | 唯一識別碼 (UUID) |
| name | string | 專案名稱 |
| inviteCode | string | 6位數邀請碼 |
| createdAt | timestamp | 建立時間 |
| currency | string | 幣別（預設 TWD）|

### 3.2 {projectId}_Participants（參與者）
| 欄位 | 類型 | 說明 |
|------|------|------|
| odifyId | string | 唯一識別碼 |
| name | string | 顯示名稱 |
| joinedAt | timestamp | 加入時間 |

### 3.3 {projectId}_Expenses（支出）
| 欄位 | 類型 | 說明 |
|------|------|------|
| expenseId | string | 唯一識別碼 |
| payerId | string | 付款人 ID |
| description | string | 項目說明 |
| amount | number | 金額 |
| splitType | string | average/custom/percentage |
| splitData | JSON | 分攤比例數據 |
| createdAt | timestamp | 消費時間 |
| createdBy | string | 記錄人 |

### 3.4 {projectId}_Settlement（結算）
| 欄位 | 類型 | 說明 |
|------|------|------|
| fromId | string | 欠款人 ID |
| toId | string | 收款人 ID |
| amount | number | 應付金額 |

## 4. API 端點

### 4.1 專案管理
- `POST /api/projects` - 建立新專案
- `GET /api/projects/:projectId` - 取得專案資訊
- `GET /api/projects/join/:inviteCode` - 用邀請碼加入專案

### 4.2 參與者
- `POST /api/projects/:projectId/participants` - 新增參與者
- `DELETE /api/projects/:projectId/participants/:participantId` - 移除參與者

### 4.3 支出
- `GET /api/projects/:projectId/expenses` - 取得所有支出
- `POST /api/projects/:projectId/expenses` - 新增支出
- `DELETE /api/projects/:projectId/expenses/:expenseId` - 刪除支出

### 4.4 結算
- `GET /api/projects/:projectId/settlement` - 計算並取得結算結果

## 5. 前端頁面

### 5.1 首頁（Home）
- SplitEase Logo
- [建立新專案] 按鈕
- [輸入邀請碼加入] 按鈕

### 5.2 建立專案（CreateProject）
- 輸入專案名稱
- 輸入你的暱稱
- 選擇幣別
- [建立] 按鈕 → 顯示邀請碼（須複製）

### 5.3 加入專案（JoinProject）
- 輸入 6 位數邀請碼
- 輸入你的暱稱
- [加入] 按鈕

### 5.4 專案儀表板（ProjectDashboard）
- 專案名稱 + 邀請碼（可複製）
- 參與者列表（顯示名字）
- [新增支出] 按鈕
- 支出明細列表（卡片式）
- [查看結算] 按鈕

### 5.5 新增支出（AddExpense）
- 選擇付款人（下拉選單）
- 輸入項目說明
- 輸入金額
- 選擇分攤方式：
  - 平均分攤
  - 自訂比例
  - 指定人數
- [確認新增] 按鈕

### 5.6 結算結果（Settlement）
- 顯示最佳還款路徑
- 每人已墊付 vs 應分攤對照表
- [一鍵結清] 按鈕（清除所有記錄）

## 6. UI/UX 設計

### 6.1 色彩方案
- 主色：#6366F1（Indigo）
- 背景：#F8FAFC
- 卡片：#FFFFFF
- 文字：#1E293B
- 成功：#10B981
- 警告：#F59E0B

### 6.2 響應式斷點
- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 6.3 交互設計
- 按鈕 hover 有陰影效果
- 卡片有輕微圓角 (12px)
- 載入時有 skeleton loading
- 錯誤訊息用 Toast 提示

## 7. 安全考量

- 邀請碼可重設
- 沒有登入系統，僅靠瀏覽器 localStorage 存 participantId
- Google Sheets API 必須通過 OAuth 2.0

## 8. 待實現功能（v2）

- [ ] 匯出 CSV/PDF
- [ ] 貨幣換算
- [ ] 週期性分帳（每月租金）
- [ ] 記帳分類統計圖表

---

**文件版本**：v1.0
**建立日期**：2026-03-22