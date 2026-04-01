import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function ProjectDashboard() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [participants, setParticipants] = useState([])
  const [expenses, setExpenses] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddParticipant, setShowAddParticipant] = useState(false)
  const [newParticipantName, setNewParticipantName] = useState('')

  const fetchData = async () => {
    try {
      const [projectData, participantsData, expensesData] = await Promise.all([
        api.getProject(projectId),
        api.getParticipants(projectId),
        api.getExpenses(projectId)
      ])
      setProject(projectData)
      setParticipants(participantsData)
      setExpenses(expensesData)
    } catch (error) {
      alert('專案不存在或已刪除')
      navigate('/')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  const handleDeleteExpense = async (expenseId) => {
    if (!confirm('確定要刪除這筆支出嗎？')) return
    try {
      await api.deleteExpense(projectId, expenseId)
      fetchData()
    } catch (error) {
      alert('刪除失敗')
    }
  }

  const handleAddParticipant = async (e) => {
    e.preventDefault()
    if (!newParticipantName.trim()) return
    
    try {
      await api.addParticipant(projectId, newParticipantName.trim())
      setNewParticipantName('')
      setShowAddParticipant(false)
      fetchData()
    } catch (error) {
      alert('新增失敗')
    }
  }

  const handleDeleteParticipant = async (participantId, participantName) => {
    if (!confirm(`確定要移除「${participantName}」嗎？`)) return
    
    const hasExpense = expenses.some(e => e.payerId === participantId)
    if (hasExpense) {
      alert('此人仍有支出紀錄，無法移除')
      return
    }
    
    try {
      const participantsData = localStorage.getItem('splitease_participants')
      const participants = participantsData ? JSON.parse(participantsData) : {}
      participants[projectId] = participants[projectId].filter(p => p.participantId !== participantId)
      localStorage.setItem('splitease_participants', JSON.stringify(participants))
      fetchData()
    } catch (error) {
      alert('移除失敗')
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="text-gray-400">載入中...</div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className="bg-primary text-white p-4">
        <button onClick={() => navigate('/')} className="text-white/80 text-sm mb-2">← 返回首頁</button>
        <h1 className="text-2xl font-bold">{project?.name}</h1>
      </div>

      {/* Participants */}
      <div className="p-4">
        <div className="card mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-gray-600">👥 參與者 ({participants.length})</h3>
            <button 
              onClick={() => setShowAddParticipant(!showAddParticipant)}
              className="text-primary text-sm font-medium"
            >
              + 新增
            </button>
          </div>
          
          {showAddParticipant && (
            <form onSubmit={handleAddParticipant} className="mb-3 flex gap-2">
              <input
                type="text"
                value={newParticipantName}
                onChange={(e) => setNewParticipantName(e.target.value)}
                placeholder="輸入名字"
                className="input flex-1"
              />
              <button type="submit" className="btn-primary px-3">
                新增
              </button>
            </form>
          )}
          
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <div key={p.participantId} className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full text-sm flex items-center gap-1">
                {p.name}
                <button 
                  onClick={() => handleDeleteParticipant(p.participantId, p.name)}
                  className="text-indigo-400 hover:text-red-500 ml-1"
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          {participants.length === 0 && (
            <p className="text-gray-400 text-sm">尚無參與者，請先新增！</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-2 mb-4">
          <Link to={`/project/${projectId}/expense`} className="flex-1">
            <button className="btn-primary w-full py-2">
              💰 新增支出
            </button>
          </Link>
          <Link to={`/project/${projectId}/settlement`} className="flex-1">
            <button className="btn-secondary w-full py-2">
              📊 結算
            </button>
          </Link>
        </div>

        {/* Expenses */}
        <div className="card">
          <h3 className="font-semibold text-gray-600 mb-2">📝 支出紀錄</h3>
          {expenses.length === 0 ? (
            <p className="text-gray-400 text-center py-4">尚無支出記錄</p>
          ) : (
            <div className="space-y-3">
              {expenses.map(expense => {
                const payer = participants.find(p => p.participantId === expense.payerId)
                const splitInfo = expense.splitType === 'all' 
                  ? '全員分攤' 
                  : (expense.splitUsers?.length > 0 
                      ? `${expense.splitUsers?.map(id => participants.find(p => p.participantId === id)?.name).join(', ')}`
                      : '平均分攤')
                return (
                  <div key={expense.expenseId} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{expense.description}</p>
                        <p className="text-sm text-gray-500">
                          {payer?.name || '未知'} 支付 • {new Date(expense.createdAt).toLocaleDateString('zh-TW')}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          💁 分攤：{splitInfo}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg">
                          {project?.currency === 'JPY' ? '¥' : project?.currency === 'USD' ? '$' : 'NT$'}
                          {expense.amount.toLocaleString()}
                        </p>
                        <button 
                          onClick={() => handleDeleteExpense(expense.expenseId)}
                          className="text-red-500 text-xs"
                        >
                          刪除
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}