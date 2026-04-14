# SplitEase - 完整規格說明書

## 1. 產品概述

| 項目 | 內容 |
|------|------|
| **產品名稱** | SplitEase |
| **產品類型** | 分帳 Web App |
| **目標用戶** | 需要分攤費用的群體（聚餐、旅行、合租等）|
| **核心功能** | AA制（大家平分）+ AB制（各付各的）|
| **部署** | Vercel (前端) + Railway (後端) |

---

## 2. 技術架構

### 2.1 後端
| 項目 | 內容 |
|------|------|
| 語言 | Node.js |
| 框架 | Express |
| 資料庫 | SQLite（本地端）/ MySQL（Railway）|
| 部署 | Railway |

### 2.2 前端
| 項目 | 內容 |
|------|------|
| 語言 | React |
| 建構工具 | Vite |
| CSS | Tailwind CSS |
| 部署 | Vercel |

### 2.3 API 通訊
- RESTful API
- JSON 格式

---

## 3. 資料模型

### 3.1 群組 (Group)
```javascript
{
  id: string,           // UUID
  name: string,          // 群組名稱
  mode: string,          // 'AA' | 'AB'
  currency: string,      // 'TWD' (預設)
  createdAt: timestamp,
  updatedAt: timestamp
}
```

### 3.2 成員 (Member)
```javascript
{
  id: string,           // UUID
  groupId: string,      // 關聯的群組ID
  name: string,         // 成員名稱
  color: number,        // 顏色代碼
  createdAt: timestamp
}
```

### 3.3 消費 (Bill)
```javascript
{
  id: string,           // UUID
  groupId: string,      // 關聯的群組ID
  title: string,       // 消費項目
  amount: number,      // 金額
  payerId: string,      // 付款人ID
  payerName: string,   // 付款人名稱
  shares: object,       // AB模式：{ memberId: amount }
  createdAt: timestamp
}
```

---

## 4. API 端點

### 4.1 群組
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/groups` | 建立新群組 |
| GET | `/api/groups` | 取得所有群組 |
| GET | `/api/groups/:id` | 取得單一群組 |
| DELETE | `/api/groups/:id` | 刪除群組 |

### 4.2 成員
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/groups/:groupId/members` | 新增成員 |
| GET | `/api/groups/:groupId/members` | 取得成員列表 |
| DELETE | `/api/groups/:groupId/members/:id` | 刪除成員 |

### 4.3 消費
| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/api/groups/:groupId/bills` | 新增消費 |
| GET | `/api/groups/:groupId/bills` | 取得消費列表 |
| DELETE | `/api/groups/:groupId/bills/:id` | 刪除消費 |

### 4.4 結算
| 方法 | 路徑 | 說明 |
|------|------|------|
| GET | `/api/groups/:groupId/settlement` | 取得結算資料 |
| POST | `/api/groups/:groupId/settle` | 一鍵結清 |

---

## 5. 功能清單

### 5.1 首頁
- [x] 顯示群組列表
- [x] 顯示群組名稱、成員數、總金額
- [x] 建立新群組按鈕

### 5.2 建立群組
- [x] 輸入群組名稱
- [x] 選擇 AA/AB 模式
- [x] 新增成員（可多個）
- [x] 建立按鈕

### 5.3 群組詳情
- [x] 顯示群組名稱與模式
- [x] 顯示成員列表
- [x] 顯示消費紀錄列表
- [x] 新增消費按鈕
- [x] 結算按鈕
- [x] 刪除群組

### 5.4 新增消費（AA模式）
- [x] 輸入消費項目
- [x] 輸入金額
- [x] 選擇誰付錢
- [x] 自動計算每人分攤金額
- [x] 儲存

### 5.5 新增消費（AB模式）
- [x] 選擇誰吃了
- [x] 各別輸入金額
- [x] 儲存

### 5.6 結算
- [x] 顯示總金額
- [x] 顯示每人應付/應收金額
- [x] 一鍵結清（清除消費紀錄）
- [x] 刪除群組

---

## 6. UI/UX 設計

### 6.1 配色
| 用途 | 顏色 |
|------|------|
| 主色 | #6366F1（Indigo） |
| AA模式 | #EF4444（紅） |
| AB模式 | #22C55E（綠） |
| 背景 | #F8FAFC |
| 卡片 | #FFFFFF |
| 文字 | #1E293B |

### 6.2 RWD
- 手機優先（Mobile-first）
- 最大寬度：420px
- 底部浮動按鈕

### 6.3 設計重點
- 大觸控區域（48px+）
- 清晰視覺區分 AA/AB
- 單手操作友善

---

## 7. 部署設定

### 7.1 Vercel（前端正向代理）
- 靜態部署
- API 路由轉發到後端

### 7.2 Railway（後端）
- Node.js 環境
- SQLite 資料庫

---

## 8. 待完成

- [ ] Railway 部署
- [ ] Vercel + Railway 串接
- [ ] 生產環境網域綁定
