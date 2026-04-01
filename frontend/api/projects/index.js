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

  // GET /api/projects/:id
  if (req.method === 'GET' && req.query.id) {
    const project = db.projects[req.query.id];
    if (!project) return res.status(404).json({ error: '專案不存在' });
    return res.status(200).json(project);
  }

  // POST /api/projects
  const { name, currency = 'TWD' } = req.body || {};
  const projectId = generateId();
  const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  
  db.projects[projectId] = { projectId, name, inviteCode, currency, createdAt: new Date().toISOString() };
  db.participants[projectId] = [];
  db.expenses[projectId] = [];
  
  res.status(200).json({ projectId, inviteCode, name });
}