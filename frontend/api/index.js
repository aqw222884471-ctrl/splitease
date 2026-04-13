import express from 'express';
import cors from 'cors';
import { v4 as uuidv4 } from 'uuid';

const app = express();
app.use(cors());
app.use(express.json());

const db = { projects: {}, participants: {}, expenses: {} };

function genCode() { return Math.random().toString(36).substring(2, 8).toUpperCase(); }

app.post('/api/projects', (req, res) => {
  const { name, mode = 'full', hostName } = req.body;
  const projectId = uuidv4();
  const host = { participantId: uuidv4(), name: hostName, isHost: true };
  db.projects[projectId] = { projectId, name, mode, inviteCode: genCode(), createdAt: new Date().toISOString() };
  db.participants[projectId] = [host];
  db.expenses[projectId] = [];
  if (mode === 'dinner') db.projects[projectId].dinnerBalance = {};
  res.json({ projectId, inviteCode: db.projects[projectId].inviteCode, name, mode, participantId: host.participantId });
});

app.get('/api/projects/join/:inviteCode', (req, res) => {
  const p = Object.values(db.projects).find(x => x.inviteCode === req.params.inviteCode);
  if (!p) return res.status(404).json({ error: '無效' });
  res.json({ projectId: p.projectId, name: p.name, mode: p.mode });
});

app.post('/api/projects/:projectId/participants', (req, res) => {
  if (!db.projects[req.params.projectId]) return res.status(404).json({ error: '專案不存在' });
  const p = { participantId: uuidv4(), name: req.body.name, isHost: false };
  db.participants[req.params.projectId].push(p);
  res.json(p);
});

app.get('/api/projects/:projectId/participants', (req, res) => {
  res.json(db.participants[req.params.projectId] || []);
});

app.post('/api/projects/:projectId/dinner-expenses', (req, res) => {
  const { projectId } = req.params;
  const { deliveryFee = 0, items } = req.body;
  const project = db.projects[projectId];
  if (!project) return res.status(404).json({ error: '專案不存在' });
  const pts = db.participants[projectId];
  const per = deliveryFee / (pts.length || 1);
  const expenseItems = items.map(i => {
    const amt = parseFloat(i.amount) || 0;
    const total = amt + per;
    if (!project.dinnerBalance) project.dinnerBalance = {};
    project.dinnerBalance[i.participantId] = (project.dinnerBalance[i.participantId] || 0) + total;
    return { participantId: i.participantId, amount: amt, deliveryShare: per, totalOwed: total };
  });
  db.expenses[projectId].push({ expenseId: uuidv4(), deliveryFee, items: expenseItems, createdAt: new Date().toISOString() });
  res.json({ success: true });
});

app.get('/api/projects/:projectId/expenses', (req, res) => {
  res.json(db.expenses[req.params.projectId] || []);
});

app.get('/api/projects/:projectId/balance', (req, res) => {
  const project = db.projects[req.params.projectId];
  if (!project) return res.status(404).json({ error: '專案不存在' });
  const pts = db.participants[req.params.projectId] || [];
  const balances = pts.map(p => ({
    participantId: p.participantId, name: p.name, isHost: p.isHost,
    totalOwed: project.dinnerBalance?.[p.participantId] || 0,
    totalPaid: project.dinnerBalance?.[p.participantId] || 0,
    balance: p.isHost ? (project.dinnerBalance?.[p.participantId] || 0) : -(project.dinnerBalance?.[p.participantId] || 0)
  }));
  const totalExpenses = db.expenses[req.params.projectId]?.reduce((s, e) => s + e.items.reduce((a, i) => a + i.totalOwed, 0), 0) || 0;
  res.json({ balances, totalExpenses });
});

app.post('/api/projects/:projectId/settle', (req, res) => {
  const project = db.projects[req.params.projectId];
  if (project?.mode === 'dinner') { project.dinnerBalance = {}; db.expenses[req.params.projectId] = []; }
  res.json({ success: true });
});

export default app;