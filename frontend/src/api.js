import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = {
  // Create project (支援模式選擇)
  createProject: async (name, currency = 'TWD', mode = 'full', hostName) => {
    const res = await axios.post(`${API_BASE}/api/projects`, { name, currency, mode, hostName })
    return res.data
  },

  // Get project
  getProject: async (projectId) => {
    const res = await axios.get(`${API_BASE}/api/projects/${projectId}`)
    return res.data
  },

  // Join by invite code
  joinByCode: async (inviteCode) => {
    const res = await axios.get(`${API_BASE}/api/projects/join/${inviteCode}`)
    return res.data
  },

  // Add participant
  addParticipant: async (projectId, name) => {
    const res = await axios.post(`${API_BASE}/api/projects/${projectId}/participants`, { name })
    return res.data
  },

  // Get participants
  getParticipants: async (projectId) => {
    const res = await axios.get(`${API_BASE}/api/projects/${projectId}/participants`)
    return res.data
  },

  // Add dinner expense (晚餐模式)
  addDinnerExpense: async (projectId, { deliveryFee = 0, items, createdBy }) => {
    const res = await axios.post(`${API_BASE}/api/projects/${projectId}/dinner-expenses`, {
      deliveryFee, items, createdBy
    })
    return res.data
  },

  // Add expense (完整模式)
  addExpense: async (projectId, { payerId, description, amount, splitType = 'average', splitData = {} }) => {
    const res = await axios.post(`${API_BASE}/api/projects/${projectId}/expenses`, {
      payerId, description, amount, splitType, splitData
    })
    return res.data
  },

  // Get expenses
  getExpenses: async (projectId) => {
    const res = await axios.get(`${API_BASE}/api/projects/${projectId}/expenses`)
    return res.data
  },

  // Delete expense
  deleteExpense: async (projectId, expenseId) => {
    const res = await axios.delete(`${API_BASE}/api/projects/${projectId}/expenses/${expenseId}`)
    return res.data
  },

  // Get dinner balance (晚餐模式餘額)
  getDinnerBalance: async (projectId) => {
    const res = await axios.get(`${API_BASE}/api/projects/${projectId}/balance`)
    return res.data
  },

  // Get settlement
  getSettlement: async (projectId) => {
    const res = await axios.get(`${API_BASE}/api/projects/${projectId}/settlement`)
    return res.data
  },

  // Settle all
  settleAll: async (projectId) => {
    const res = await axios.post(`${API_BASE}/api/projects/${projectId}/settle`)
    return res.data
  }
}

export default api