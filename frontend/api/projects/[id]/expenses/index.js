const generateId = () => Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

if (typeof global.spliteaseDB === 'undefined') {
  global.spliteaseDB = { projects: {}, participants: {}, expenses: {} };
}
const db = global.spliteaseDB;

export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const projectId = req.query.id || req.url.split('/')[4];
  
  if (!db.projects[projectId]) {
    return res.status(404).json({ error: '專案不存在' });
  }

  if (req.method === 'POST') {
    const { payerId, description, amount, splitType = 'average', splitData = {} } = req.body || {};
    const expense = { 
      expenseId: generateId(), 
      payerId, 
      description, 
      amount: parseFloat(amount), 
      splitType, 
      splitData, 
      createdAt: new Date().toISOString() 
    };
    db.expenses[projectId] = db.expenses[projectId] || [];
    db.expenses[projectId].push(expense);
    return res.status(200).json(expense);
  }

  if (req.method === 'DELETE') {
    const expenseId = req.query.expenseId || req.url.split('/')[6];
    const expenses = db.expenses[projectId] || [];
    const index = expenses.findIndex(e => e.expenseId === expenseId);
    if (index === -1) return res.status(404).json({ error: '支出不存在' });
    expenses.splice(index, 1);
    return res.status(200).json({ success: true });
  }

  return res.status(200).json(db.expenses[projectId] || []);
}