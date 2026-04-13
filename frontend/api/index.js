// Vercel Serverless Function
import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'

const app = express()
app.use(cors())
app.use(express.json())

// In-memory storage (resets on each cold start)
const projects = {}
const participants = {}
const expenses = {}

function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

app.post('/api/projects', (req, res) => {
  const { name, currency = 'TWD', mode = 'full', hostName } = req.body
  const projectId = uuidv4()
  const inviteCode = generateInviteCode()
  const hostParticipant = { participantId: uuidv4(), name: hostName, isHost: true, joinedAt: new Date().toISOString() }

  projects[projectId] = { projectId, name, mode, inviteCode, currency, createdAt: new Date().toISOString() }
  participants[projectId] = [hostParticipant]
  expenses[projectId] = []
  if (mode === 'dinner') projects[projectId].dinnerBalance = {}

  res.json({ projectId, inviteCode, name, mode, participantId: hostParticipant.participantId })
})

app.get('/api/projects/:projectId', (req, res) => {
  const project = projects[req.params.projectId]
  if (!project) return res.status(404).json({ error: '專案不存在' })
  res.json(project)
})

app.get('/api/projects/join/:inviteCode', (req, res) => {
  const project = Object.values(projects).find(p => p.inviteCode === req.params.inviteCode)
  if (!project) return res.status(404).json({ error: '邀請碼無效' })
  res.json({ projectId: project.projectId, name: project.name, mode: project.mode })
})

app.post('/api/projects/:projectId/participants', (req, res) => {
  if (!projects[req.params.projectId]) return res.status(404).json({ error: '專案不存在' })
  const participant = { participantId: uuidv4(), name: req.body.name, isHost: false, joinedAt: new Date().toISOString() }
  participants[req.params.projectId].push(participant)
  res.json(participant)
})

app.get('/api/projects/:projectId/participants', (req, res) => {
  res.json(participants[req.params.projectId] || [])
})

app.post('/api/projects/:projectId/dinner-expenses', (req, res) => {
  const { projectId } = req.params
  const { deliveryFee = 0, items } = req.body
  const project = projects[projectId]
  if (!project) return res.status(404).json({ error: '專案不存在' })
  if (project.mode !== 'dinner') return res.status(400).json({ error: '此專案不是晚餐模式' })

  const parts = participants[projectId] || []
  const deliveryPerPerson = deliveryFee / (parts.length || 1)
  
  const expenseItems = items.map(item => {
    const amount = parseFloat(item.amount) || 0
    const totalOwed = amount + deliveryPerPerson
    if (!project.dinnerBalance) project.dinnerBalance = {}
    project.dinnerBalance[item.participantId] = (project.dinnerBalance[item.participantId] || 0) + totalOwed
    return { participantId: item.participantId, amount, deliveryShare: deliveryPerPerson, totalOwed }
  })

  expenses[projectId].push({ expenseId: uuidv4(), mode: 'dinner', deliveryFee, items: expenseItems, createdAt: new Date().toISOString() })
  res.json({ success: true })
})

app.get('/api/projects/:projectId/expenses', (req, res) => {
  res.json(expenses[req.params.projectId] || [])
})

app.get('/api/projects/:projectId/balance', (req, res) => {
  const project = projects[req.params.projectId]
  if (!project) return res.status(404).json({ error: '專案不存在' })
  
  const parts = participants[req.params.projectId] || []
  const balance = {}
  parts.forEach(p => {
    balance[p.participantId] = { 
      name: p.name, 
      isHost: p.isHost, 
      totalOwed: project.dinnerBalance?.[p.participantId] || 0, 
      totalPaid: project.dinnerBalance?.[p.participantId] || 0 
    }
  })
  
  const balances = Object.entries(balance).map(([id, data]) => ({ 
    participantId: id, 
    ...data, 
    balance: data.isHost ? data.totalPaid - data.totalOwed : data.totalOwed - data.totalPaid 
  }))
  
  res.json({ 
    balances, 
    totalExpenses: expenses[req.params.projectId]?.reduce((s, e) => s + e.items?.reduce((a, i) => a + i.totalOwed, 0), 0) || 0 
  })
})

app.post('/api/projects/:projectId/settle', (req, res) => {
  const project = projects[req.params.projectId]
  if (project?.mode === 'dinner') { 
    project.dinnerBalance = {}; 
    expenses[req.params.projectId] = [] 
  }
  res.json({ success: true })
})

export default app