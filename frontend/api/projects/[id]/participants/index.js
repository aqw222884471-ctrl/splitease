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
  
  if (!db.projects[projectId]) {
    return res.status(404).json({ error: '專案不存在' });
  }

  if (req.method === 'POST') {
    const { name } = req.body || {};
    const participant = { participantId: generateId(), name, joinedAt: new Date().toISOString() };
    db.participants[projectId] = db.participants[projectId] || [];
    db.participants[projectId].push(participant);
    return res.status(200).json(participant);
  }

  // GET
  return res.status(200).json(db.participants[projectId] || []);
}