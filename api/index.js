import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
app.use(cors())
app.use(express.json())

// 記憶體存儲
const inMemoryDB = {
  projects: {},
  participants: {},
  expenses: {}
}

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

app.post('/api/projects', (req, res) => {
  const { name, currency = 'TWD', mode = 'full', hostName } = req.body
  const projectId = uuidv4()
  const inviteCode = generateInviteCode()

  const hostParticipant = {
    participantId: uuidv4(),
    name: hostName,
    isHost: true,
    joinedAt: new Date().toISOString()
  }

  inMemoryDB.projects[projectId] = { projectId, name, mode, inviteCode, currency, createdAt: new Date().toISOString() }
  inMemoryDB.participants[projectId] = [hostParticipant]
  inMemoryDB.expenses[projectId] = []

  if (mode === 'dinner') {
    inMemoryDB.projects[projectId].dinnerBalance = {}
  }

  res.json({ projectId, inviteCode, name, mode, participantId: hostParticipant.participantId })
})

app.get('/api/projects/:projectId', (req, res) => {
  const project = inMemoryDB.projects[req.params.projectId]
  if (!project) return res.status(404).json({ error: '專案不存在' })
  res.json(project)
})

app.get('/api/projects/join/:inviteCode', (req, res) => {
  const project = Object.values(inMemoryDB.projects).find(p => p.inviteCode === req.params.inviteCode)
  if (!project) return res.status(404).json({ error: '邀請碼無效' })
  res.json({ projectId: project.projectId, name: project.name, mode: project.mode })
})

app.post('/api/projects/:projectId/participants', (req, res) => {
  if (!inMemoryDB.projects[req.params.projectId]) return res.status(404).json({ error: '專案不存在' })
  const participant = { participantId: uuidv4(), name: req.body.name, isHost: false, joinedAt: new Date().toISOString() }
  inMemoryDB.participants[req.params.projectId].push(participant)
  res.json(participant)
})

app.get('/api/projects/:projectId/participants', (req, res) => {
  res.json(inMemoryDB.participants[req.params.projectId] || [])
})

app.post('/api/projects/:projectId/dinner-expenses', (req, res) => {
  const { projectId } = req.params
  const { deliveryFee = 0, items } = req.body
  const project = inMemoryDB.projects[projectId]
  if (!project) return res.status(404).json({ error: '專案不存在' })
  if (project.mode !== 'dinner') return res.status(400).json({ error: '此專案不是晚餐模式' })

  const participants = inMemoryDB.participants[projectId]
  const deliveryPerPerson = deliveryFee / participants.length

  const expenseItems = items.map(item => {
    const amount = parseFloat(item.amount)
    const totalOwed = amount + deliveryPerPerson
    if (!project.dinnerBalance) project.dinnerBalance = {}
    project.dinnerBalance[item.participantId] = (project.dinnerBalance[item.participantId] || 0) + totalOwed
    return { participantId: item.participantId, amount, deliveryShare: deliveryPerPerson, totalOwed }
  })

  inMemoryDB.expenses[projectId].push({
    expenseId: uuidv4(), mode: 'dinner', deliveryFee,
    items: expenseItems, createdAt: new Date().toISOString()
  })
  res.json({ success: true })
})

app.get('/api/projects/:projectId/expenses', (req, res) => {
  res.json(inMemoryDB.expenses[req.params.projectId] || [])
})

app.get('/api/projects/:projectId/balance', (req, res) => {
  const project = inMemoryDB.projects[req.params.projectId]
  if (!project) return res.status(404).json({ error: '專案不存在' })
  
  const participants = inMemoryDB.participants[req.params.projectId] || []
  const balance = {}
  participants.forEach(p => {
    balance[p.participantId] = {
      name: p.name, isHost: p.isHost,
      totalOwed: project.dinnerBalance?.[p.participantId] || 0,
      totalPaid: project.dinnerBalance?.[p.participantId] || 0
    }
  })
  
  const balances = Object.entries(balance).map(([id, data]) => ({
    participantId: id, ...data,
    balance: data.isHost ? data.totalPaid - data.totalOwed : data.totalOwed - data.totalPaid
  }))
  
  res.json({ balances, totalExpenses: inMemoryDB.expenses[req.params.projectId]?.reduce((s,e) => s + e.items?.reduce((a,i) => a + i.totalOwed, 0), 0) || 0 })
})

app.post('/api/projects/:projectId/settle', (req, res) => {
  const project = inMemoryDB.projects[req.params.projectId]
  if (project?.mode === 'dinner') {
    project.dinnerBalance = {}
    inMemoryDB.expenses[req.params.projectId] = []
  }
  res.json({ success: true })
})

export default app