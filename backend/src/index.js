import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const db = { groups: {}, members: {}, bills: {} };
function genId() { return uuidv4(); }

// 群組
app.post('/api/groups', (req, res) => {
  const { name, mode = 'AA', members = [] } = req.body;
  const groupId = genId();
  const group = { id: groupId, name, mode, totalAmount: 0, createdAt: Date.now(), updatedAt: Date.now() };
  db.groups[groupId] = group;
  const memberList = members.map(m => ({ id: genId(), groupId, name: m.name }));
  db.members[groupId] = memberList;
  db.bills[groupId] = [];
  res.json({ ...group, members: memberList });
});

app.get('/api/groups', (req, res) => {
  const groups = Object.values(db.groups).map(g => {
    const members = db.members[g.id] || [];
    const bills = db.bills[g.id] || [];
    return { ...g, members, totalAmount: bills.reduce((s, b) => s + b.amount, 0) };
  });
  res.json(groups);
});

app.get('/api/groups/:id', (req, res) => {
  const group = db.groups[req.params.id];
  if (!group) return res.status(404).json({ error: '不存在' });
  res.json({ ...group, members: db.members[req.params.id] || [] });
});

// 消費
app.post('/api/groups/:groupId/bills', (req, res) => {
  const { title, amount, payerId, shares, sharedFee, splitMembers } = req.body;
  const groupId = req.params.groupId;
  const members = db.members[groupId] || [];
  const payer = members.find(m => m.id === payerId);
  
  const bill = {
    id: genId(), groupId, title, amount: parseFloat(amount), payerId,
    payerName: payer?.name || '未知', shares, sharedFee: sharedFee || 0,
    splitMembers: splitMembers || null, createdAt: Date.now()
  };
  
  if (!db.bills[groupId]) db.bills[groupId] = [];
  db.bills[groupId].push(bill);
  db.groups[groupId].totalAmount = db.bills[groupId].reduce((s, b) => s + b.amount, 0);
  res.json(bill);
});

app.get('/api/groups/:groupId/bills', (req, res) => {
  res.json(db.bills[req.params.groupId] || []);
});

// 結算
app.get('/api/groups/:groupId/settlement', (req, res) => {
  const groupId = req.params.groupId;
  const group = db.groups[groupId];
  const members = db.members[groupId] || [];
  const bills = db.bills[groupId] || [];
  
  const balances = {};
  members.forEach(m => balances[m.id] = 0);
  
  let total = 0;
  bills.forEach(b => {
    total += b.amount;
    if (group.mode === 'AA') {
      const splitList = b.splitMembers || members.map(m=>m.id);
      const split = b.amount / (splitList.length || 1);
      if (b.payerId) {
        balances[b.payerId] += b.amount;
        splitList.forEach(mid => { if (mid !== b.payerId) balances[mid] -= split; });
      }
    } else {
      if (b.shares) Object.entries(b.shares).forEach(([mid, amt]) => balances[mid] = (balances[mid] || 0) + amt);
    }
  });
  
  res.json({ balances: members.map(m => ({ id: m.id, name: m.name, balance: balances[m.id] || 0 })), total });
});

app.post('/api/groups/:groupId/settle', (req, res) => {
  const groupId = req.params.groupId;
  db.bills[groupId] = [];
  db.groups[groupId].totalAmount = 0;
  res.json({ success: true });
});

app.get('/health', (req, res) => res.json({ status: 'ok' }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`🚀 Port ${PORT}`));
