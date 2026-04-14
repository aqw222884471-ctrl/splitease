import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

// ===== 記憶體資料庫 =====
const db = { groups: {}, members: {}, bills: {} };

function genId() { return uuidv4(); }

// ===== 群組 API =====

app.post('/api/groups', (req, res) => {
  const { name, mode = 'AA', members = [] } = req.body;
  const groupId = genId();
  
  const group = { id: groupId, name, mode, totalAmount: 0, createdAt: Date.now(), updatedAt: Date.now() };
  db.groups[groupId] = group;
  
  const memberList = members.map(m => ({ id: genId(), groupId, name: m.name, color: Math.floor(Math.random() * 0xFFFFFF) }));
  db.members[groupId] = memberList;
  db.bills[groupId] = [];
  
  res.json({ ...group, members: memberList });
});

app.get('/api/groups', (req, res) => {
  const groups = Object.values(db.groups).map(g => {
    const members = db.members[g.id] || [];
    const bills = db.bills[g.id] || [];
    const totalAmount = bills.reduce((s, b) => s + b.amount, 0);
    return { ...g, members, totalAmount };
  });
  res.json(groups);
});

app.get('/api/groups/:id', (req, res) => {
  const group = db.groups[req.params.id];
  if (!group) return res.status(404).json({ error: '群組不存在' });
  const members = db.members[req.params.id] || [];
  res.json({ ...group, members });
});

app.delete('/api/groups/:id', (req, res) => {
  delete db.groups[req.params.id];
  delete db.members[req.params.id];
  delete db.bills[req.params.id];
  res.json({ success: true });
});

// ===== 成員 API =====

app.post('/api/groups/:groupId/members', (req, res) => {
  const { name } = req.body;
  const groupId = req.params.groupId;
  if (!db.groups[groupId]) return res.status(404).json({ error: '群組不存在' });
  
  const member = { id: genId(), groupId, name, color: Math.floor(Math.random() * 0xFFFFFF) };
  if (!db.members[groupId]) db.members[groupId] = [];
  db.members[groupId].push(member);
  res.json(member);
});

app.get('/api/groups/:groupId/members', (req, res) => {
  res.json(db.members[req.params.groupId] || []);
});

// ===== 消費 API =====

app.post('/api/groups/:groupId/bills', (req, res) => {
  const { title, amount, payerId, shares, sharedFee } = req.body;
  const groupId = req.params.groupId;
  
  if (!db.groups[groupId]) return res.status(404).json({ error: '群組不存在' });
  
  const members = db.members[groupId] || [];
  const payer = members.find(m => m.id === payerId);
  
  const bill = {
    id: genId(),
    groupId,
    title,
    amount: parseFloat(amount),
    payerId,
    payerName: payer?.name || '未知',
    shares: shares || null,
    sharedFee: sharedFee || 0,
    createdAt: Date.now()
  };
  
  if (!db.bills[groupId]) db.bills[groupId] = [];
  db.bills[groupId].push(bill);
  
  db.groups[groupId].totalAmount = db.bills[groupId].reduce((s, b) => s + b.amount, 0);
  db.groups[groupId].updatedAt = Date.now();
  
  res.json(bill);
});

app.get('/api/groups/:groupId/bills', (req, res) => {
  res.json(db.bills[req.params.groupId] || []);
});

// ===== 結算 API =====

app.get('/api/groups/:groupId/settlement', (req, res) => {
  const groupId = req.params.groupId;
  const group = db.groups[groupId];
  const members = db.members[groupId] || [];
  const bills = db.bills[groupId] || [];
  
  const balances = {};
  members.forEach(m => { balances[m.id] = 0; });
  
  let total = 0;
  bills.forEach(b => {
    total += b.amount;
    
    if (group.mode === 'AA') {
      const split = b.amount / members.length;
      if (b.payerId) {
        balances[b.payerId] += b.amount;
        members.forEach(m => { if (m.id !== b.payerId) balances[m.id] -= split; });
      }
    } else {
      // AB模式：每個人付自己的份 + 均分費用
      if (b.shares) {
        Object.entries(b.shares).forEach(([mid, amt]) => {
          balances[mid] = (balances[mid] || 0) + amt;
        });
      }
    }
  });
  
  const result = members.map(m => ({ id: m.id, name: m.name, balance: balances[m.id] || 0 }));
  res.json({ balances: result, total });
});

app.post('/api/groups/:groupId/settle', (req, res) => {
  const groupId = req.params.groupId;
  db.bills[groupId] = [];
  db.groups[groupId].totalAmount = 0;
  db.groups[groupId].updatedAt = Date.now();
  res.json({ success: true });
});

// ===== Health Check =====
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 SplitEase API 運行在 port ${PORT}`);
});
