const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

if (typeof global.spliteaseDB === 'undefined') {
  global.spliteaseDB = { projects: {}, participants: {}, expenses: {} };
}
const db = global.spliteaseDB;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const projectId = req.query.id || req.url.split('/')[4];
  
  const participants = db.participants[projectId] || [];
  const expenses = db.expenses[projectId] || [];

  // Calculate balances
  const paidMap = {};
  participants.forEach(p => { paidMap[p.participantId] = 0; });
  expenses.forEach(e => { if (paidMap[e.payerId] !== undefined) paidMap[e.payerId] += e.amount; });

  const shareMap = {};
  participants.forEach(p => { shareMap[p.participantId] = 0; });
  expenses.forEach(e => { 
    if (e.splitType === 'average' && participants.length > 0) { 
      const share = e.amount / participants.length; 
      participants.forEach(p => { shareMap[p.participantId] += share; }); 
    } 
  });

  const balances = {};
  participants.forEach(p => { balances[p.participantId] = paidMap[p.participantId] - shareMap[p.participantId]; });

  // Calculate settlements
  const settlements = [];
  const debtors = [], creditors = [];
  participants.forEach(p => { 
    if (balances[p.participantId] < -0.01) debtors.push({ id: p.participantId, amount: -balances[p.participantId] }); 
    else if (balances[p.participantId] > 0.01) creditors.push({ id: p.participantId, amount: balances[p.participantId] }); 
  });

  let i = 0, j = 0;
  while (i < debtors.length && j < creditors.length) { 
    const amount = Math.min(debtors[i].amount, creditors[j].amount); 
    if (amount > 0.01) settlements.push({ fromId: debtors[i].id, toId: creditors[j].id, amount: Math.round(amount * 100) / 100 }); 
    debtors[i].amount -= amount; 
    creditors[j].amount -= amount; 
    if (debtors[i].amount < 0.01) i++; 
    if (creditors[j].amount < 0.01) j++; 
  }

  res.status(200).json({ 
    balances: participants.map(p => ({ 
      participantId: p.participantId, 
      name: p.name, 
      paid: Math.round(paidMap[p.participantId] * 100) / 100, 
      shouldPay: Math.round(shareMap[p.participantId] * 100) / 100, 
      balance: Math.round(balances[p.participantId] * 100) / 100 
    })), 
    settlements 
  });
}