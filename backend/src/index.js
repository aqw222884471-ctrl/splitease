import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { v4 as uuidv4 } from 'uuid'
import { google } from 'googleapis'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../')))

// CORS 設定
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}
app.use(cors(corsOptions))

// Google Sheets 配置
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

let auth
try {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT)
  auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  })
} catch (e) {
  console.log('⚠️ Google Sheets API 未配置，使用記憶體模式')
}

// 記憶體存儲
const inMemoryDB = {
  projects: {},
  participants: {},
  expenses: {},
  settlements: {}
}

// 工具函數
function generateInviteCode() {
  return Math.random().toString(36).substring(2, 8).toUpperCase()
}

// API 端點

// 1. 建立新專案（支援模式選擇）
app.post('/api/projects', (req, res) => {
  const { name, currency = 'TWD', mode = 'full', hostName } = req.body
  const projectId = uuidv4()
  const inviteCode = generateInviteCode()

  inMemoryDB.projects[projectId] = {
    projectId,
    name,
    mode,
    inviteCode,
    currency,
    createdAt: new Date().toISOString()
  }

  const hostParticipant = {
    participantId: uuidv4(),
    name: hostName,
    isHost: true,
    joinedAt: new Date().toISOString()
  }
  inMemoryDB.participants[projectId] = [hostParticipant]
  inMemoryDB.expenses[projectId] = []

  if (mode === 'dinner') {
    inMemoryDB.projects[projectId].hostId = hostParticipant.participantId
    inMemoryDB.projects[projectId].dinnerBalance = {}
  }

  res.json({ 
    projectId, 
    inviteCode, 
    name,
    mode,
    participantId: hostParticipant.participantId 
  })
})

// 2. 取得專案資訊
app.get('/api/projects/:projectId', (req, res) => {
  const { projectId } = req.params
  const project = inMemoryDB.projects[projectId]
  if (!project) {
    return res.status(404).json({ error: '專案不存在' })
  }
  res.json(project)
})

// 3. 用邀請碼取得專案
app.get('/api/projects/join/:inviteCode', (req, res) => {
  const { inviteCode } = req.params
  const project = Object.values(inMemoryDB.projects).find(p => p.inviteCode === inviteCode)
  if (!project) {
    return res.status(404).json({ error: '邀請碼無效' })
  }
  res.json({ 
    projectId: project.projectId, 
    name: project.name,
    mode: project.mode 
  })
})

// 4. 新增參與者
app.post('/api/projects/:projectId/participants', (req, res) => {
  const { projectId } = req.params
  const { name } = req.body
  
  if (!inMemoryDB.projects[projectId]) {
    return res.status(404).json({ error: '專案不存在' })
  }

  const participant = {
    participantId: uuidv4(),
    name,
    isHost: false,
    joinedAt: new Date().toISOString()
  }
  
  inMemoryDB.participants[projectId].push(participant)
  res.json(participant)
})

// 5. 取得參與者列表
app.get('/api/projects/:projectId/participants', (req, res) => {
  const { projectId } = req.params
  const participants = inMemoryDB.participants[projectId] || []
  res.json(participants)
})

// 6. 新增晚餐模式支出
app.post('/api/projects/:projectId/dinner-expenses', (req, res) => {
  const { projectId } = req.params
  const { deliveryFee = 0, items, createdBy } = req.body

  const project = inMemoryDB.projects[projectId]
  if (!project) {
    return res.status(404).json({ error: '專案不存在' })
  }

  if (project.mode !== 'dinner') {
    return res.status(400).json({ error: '此專案不是晚餐模式' })
  }

  const participants = inMemoryDB.participants[projectId]
  const deliveryPerPerson = deliveryFee / participants.length

  const expenseItems = items.map(item => {
    const amount = parseFloat(item.amount)
    const totalOwed = amount + deliveryPerPerson
    
    if (!project.dinnerBalance) project.dinnerBalance = {}
    if (!project.dinnerBalance[item.participantId]) {
      project.dinnerBalance[item.participantId] = 0
    }
    project.dinnerBalance[item.participantId] += totalOwed

    return {
      participantId: item.participantId,
      amount: amount,
      deliveryShare: deliveryPerPerson,
      totalOwed: totalOwed
    }
  })

  const expense = {
    expenseId: uuidv4(),
    mode: 'dinner',
    deliveryFee: parseFloat(deliveryFee),
    items: expenseItems,
    createdAt: new Date().toISOString(),
    createdBy: createdBy || 'unknown'
  }

  inMemoryDB.expenses[projectId].push(expense)
  res.json(expense)
})

// 7. 取得所有支出
app.get('/api/projects/:projectId/expenses', (req, res) => {
  const { projectId } = req.params
  const expenses = inMemoryDB.expenses[projectId] || []
  res.json(expenses)
})

// 8. 晚餐模式餘額
app.get('/api/projects/:projectId/balance', (req, res) => {
  const { projectId } = req.params
  const project = inMemoryDB.projects[projectId]
  
  if (!project) {
    return res.status(404).json({ error: '專案不存在' })
  }

  const participants = inMemoryDB.participants[projectId] || []
  const expenses = inMemoryDB.expenses[projectId] || []
  
  const balance = {}
  participants.forEach(p => {
    balance[p.participantId] = {
      name: p.name,
      isHost: p.isHost,
      totalOwed: 0,
      totalPaid: 0
    }
  })

  if (project.mode === 'dinner' && project.dinnerBalance) {
    participants.forEach(p => {
      balance[p.participantId].totalOwed = project.dinnerBalance[p.participantId] || 0
      balance[p.participantId].totalPaid = project.dinnerBalance[p.participantId] || 0
    })
  }

  const balanceList = Object.entries(balance).map(([participantId, data]) => ({
    participantId,
    ...data,
    balance: data.isHost ? data.totalPaid - data.totalOwed : data.totalOwed - data.totalPaid
  }))

  res.json({
    mode: project.mode,
    hostId: project.hostId,
    balances: balanceList,
    totalExpenses: expenses.reduce((sum, e) => {
      if (e.mode === 'dinner') {
        return sum + e.items.reduce((s, i) => s + i.totalOwed, 0)
      }
      return sum + (e.amount || 0)
    }, 0)
  })
})

// 9. 結清
app.post('/api/projects/:projectId/settle', (req, res) => {
  const { projectId } = req.params
  const project = inMemoryDB.projects[projectId]
  
  if (!project) {
    return res.status(404).json({ error: '專案不存在' })
  }

  if (project.mode === 'dinner') {
    inMemoryDB.expenses[projectId] = inMemoryDB.expenses[projectId].filter(e => e.mode !== 'dinner')
    project.dinnerBalance = {}
  } else {
    inMemoryDB.expenses[projectId] = []
  }
  
  res.json({ success: true, message: '已結清所有帳務' })
})

const PORT = process.env.PORT || 3000

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.listen(PORT, () => {
  console.log(`🚀 SplitEase 運行在 http://localhost:${PORT}`)
})