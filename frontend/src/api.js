import axios from 'axios'

const API_BASE = import.meta.env.VITE_API_URL || ''

const api = {
  // Create project
  createProject: async (name, currency = 'TWD') => {
    const res = await axios.post(`${API_BASE}/api/projects`, { name, currency })
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

  // Add expense
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

  // Get all projects (from localStorage for now)
  getAllProjects: () => {
    return []
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
