require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { google } = require('googleapis');

const app = express();
app.use(cors());
app.use(express.json());

// CORS 設定 - 允許所有來源（開發用）
// 生產環境應該設定具體的 origin
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
};
app.use(cors(corsOptions));

// Google Sheets 配置
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];
const spreadsheetId = process.env.GOOGLE_SHEET_ID;

let auth;
try {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT);
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });
} catch (e) {
  console.log('⚠️ Google Sheets API 未配置，使用記憶體模式');
}

// 記憶體存儲（正式環境應替換為 Google Sheets）
const inMemoryDB = {
  projects: {},
  participants: {},
  expenses: {},
  settlements: {}
};

// 工具函數
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function updateSheet(sheetName, data) {
  if (!auth || !spreadsheetId) return;
  const sheets = google.sheets({ version: 'v4', auth });
  console.log(`📊 更新 Google Sheet: ${sheetName}`);
}

// API 端點

// 1. 建立新專案
app.post('/api/projects', (req, res) => {
  const { name, currency = 'TWD' } = req.body;
  const projectId = uuidv4();
  const inviteCode = generateInviteCode();

  inMemoryDB.projects[projectId] = {
    projectId,
    name,
    inviteCode,
    currency,
    createdAt: new Date().toISOString()
  };
  inMemoryDB.participants[projectId] = [];
  inMemoryDB.expenses[projectId] = [];
  inMemoryDB.settlements[projectId] = [];

  res.json({ projectId, inviteCode, name });
});

// 2. 取得專案資訊
app.get('/api/projects/:projectId', (req, res) => {
  const { projectId } = req.params;
  const project = inMemoryDB.projects[projectId];
  if (!project) {
    return res.status(404).json({ error: '專案不存在' });
  }
  res.json(project);
});

// 3. 用邀請碼取得專案
app.get('/api/projects/join/:inviteCode', (req, res) => {
  const { inviteCode } = req.params;
  const project = Object.values(inMemoryDB.projects).find(p => p.inviteCode === inviteCode);
  if (!project) {
    return res.status(404).json({ error: '邀請碼無效' });
  }
  res.json({ projectId: project.projectId, name: project.name });
});

// 4. 新增參與者
app.post('/api/projects/:projectId/participants', (req, res) => {
  const { projectId } = req.params;
  const { name } = req.body;
  
  if (!inMemoryDB.projects[projectId]) {
    return res.status(404).json({ error: '專案不存在' });
  }

  const participant = {
    participantId: uuidv4(),
    name,
    joinedAt: new Date().toISOString()
  };
  
  inMemoryDB.participants[projectId].push(participant);
  res.json(participant);
});

// 5. 取得參與者列表
app.get('/api/projects/:projectId/participants', (req, res) => {
  const { projectId } = req.params;
  const participants = inMemoryDB.participants[projectId] || [];
  res.json(participants);
});

// 6. 新增支出
app.post('/api/projects/:projectId/expenses', (req, res) => {
  const { projectId } = req.params;
  const { payerId, description, amount, splitType = 'average', splitData = {} } = req.body;

  if (!inMemoryDB.projects[projectId]) {
    return res.status(404).json({ error: '專案不存在' });
  }

  const expense = {
    expenseId: uuidv4(),
    payerId,
    description,
    amount: parseFloat(amount),
    splitType,
    splitData,
    createdAt: new Date().toISOString()
  };

  inMemoryDB.expenses[projectId].push(expense);
  res.json(expense);
});

// 7. 取得所有支出
app.get('/api/projects/:projectId/expenses', (req, res) => {
  const { projectId } = req.params;
  const expenses = inMemoryDB.expenses[projectId] || [];
  res.json(expenses);
});

// 8. 刪除支出
app.delete('/api/projects/:projectId/expenses/:expenseId', (req, res) => {
  const { projectId, expenseId } = req.params;
  const expenses = inMemoryDB.expenses[projectId] || [];
  const index = expenses.findIndex(e => e.expenseId === expenseId);
  
  if (index === -1) {
    return res.status(404).json({ error: '支出不存在' });
  }
  
  expenses.splice(index, 1);
  res.json({ success: true });
});

// 9. 計算結算
app.get('/api/projects/:projectId/settlement', (req, res) => {
  const { projectId } = req.params;
  const participants = inMemoryDB.participants[projectId] || [];
  const expenses = inMemoryDB.expenses[projectId] || [];

  const paidMap = {};
  participants.forEach(p => { paidMap[p.participantId] = 0; });
  
  expenses.forEach(e => {
    if (paidMap[e.payerId] !== undefined) {
      paidMap[e.payerId] += e.amount;
    }
  });

  const shareMap = {};
  participants.forEach(p => { shareMap[p.participantId] = 0; });
  
  expenses.forEach(e => {
    if (e.splitType === 'average') {
      const share = e.amount / participants.length;
      participants.forEach(p => {
        shareMap[p.participantId] += share;
      });
    } else if (e.splitType === 'custom' && e.splitData) {
      Object.entries(e.splitData).forEach(([pid, ratio]) => {
        if (shareMap[pid] !== undefined) {
          shareMap[pid] += e.amount * ratio;
        }
      });
    }
  });

  const balances = {};
  participants.forEach(p => {
    balances[p.participantId] = paidMap[p.participantId] - shareMap[p.participantId];
  });

  const settlements = [];
  const debtors = [];
  const creditors = [];

  participants.forEach(p => {
    if (balances[p.participantId] < -0.01) {
      debtors.push({ id: p.participantId, amount: -balances[p.participantId] });
    } else if (balances[p.participantId] > 0.01) {
      creditors.push({ id: p.participantId, amount: balances[p.participantId] });
    }
  });

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) {
    const debtor = debtors[i];
    const creditor = creditors[j];
    const amount = Math.min(debtor.amount, creditor.amount);
    
    if (amount > 0.01) {
      settlements.push({
        fromId: debtor.id,
        toId: creditor.id,
        amount: Math.round(amount * 100) / 100
      });
    }
    
    debtor.amount -= amount;
    creditor.amount -= amount;
    
    if (debtor.amount < 0.01) i++;
    if (creditor.amount < 0.01) j++;
  }

  res.json({
    balances: participants.map(p => ({
      participantId: p.participantId,
      name: p.name,
      paid: Math.round(paidMap[p.participantId] * 100) / 100,
      shouldPay: Math.round(shareMap[p.participantId] * 100) / 100,
      balance: Math.round(balances[p.participantId] * 100) / 100
    })),
    settlements
  });
});

// 10. 清除所有結算記錄（結清）
app.post('/api/projects/:projectId/settle', (req, res) => {
  const { projectId } = req.params;
  inMemoryDB.expenses[projectId] = [];
  res.json({ success: true, message: '已結清所有帳務' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SplitEase API 運行在 port ${PORT}`);
});
