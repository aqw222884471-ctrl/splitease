import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import api from '../api'

export default function ProjectDashboard() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [project, setProject] = useState(null)
  const [participants, setParticipants] = useState([])
  const [expenses, setExpenses] = useState([])
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const [currentParticipantId, setCurrentParticipantId] = useState(null)

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
      setCurrentParticipantId(localStorage.getItem('splitease_participant'))
      
      // 如果是晚餐模式，獲取餘額
      if (projectData.mode === 'dinner') {
        const balanceData = await api.getDinnerBalance(projectId)
        setBalance(balanceData)
      }
    } catch (error) {
      console.error(error)
      alert('專案不存在或已刪除')
      navigate('/')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [projectId])

  // 晚餐模式：取得當前用戶的欠款
  const getCurrentUserOwe = () => {
    if (!balance || !currentParticipantId) return 0
    const userBalance = balance.balances.find(b => b.participantId === currentParticipantId)
    return userBalance?.balance || 0
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="text-gray-400">載入中...</div>
      </div>
    )
  }

  const isDinnerMode = project?.mode === 'dinner'

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      {/* Header */}
      <div className={`${isDinnerMode ? 'bg-orange-500' : 'bg-primary'} text-white p-4`}>
        <button onClick={() => navigate('/')} className="text-white/80 text-sm mb-2">← 返回首頁</button>
        <div className="flex items-center gap-2">
          <span className="text-2xl">{isDinnerMode ? '🍜' : '📊'}</span>
          <h1 className="text-2xl font-bold">{project?.name}</h1>
        </div>
        <p className="text-white/80 text-sm mt-1">
          邀請碼：{project?.inviteCode}
        </p>
      </div>

      {/* 晚餐模式：顯示當前欠款 */}
      {isDinnerMode && balance && (
        <div className="bg-orange-50 p-4 border-b border-orange-100">
          <p className="text-sm text-orange-600 mb-1">你的當前欠款</p>
          <p className="text-3xl font-bold text-orange-600">
            NT$ {getCurrentUserOwe().toLocaleString()}
          </p>
          {balance.totalExpenses > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              累積總消費：NT$ {balance.totalExpenses.toLocaleString()}
            </p>
          )}
        </div>
      )}

      <div className="p-4">
        {/* 參與者 */}
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-600 mb-2">
            👥 參與者 ({participants.length})
          </h3>
          <div className="flex flex-wrap gap-2">
            {participants.map(p => (
              <div 
                key={p.participantId} 
                className={`px-3 py-1 rounded-full text-sm ${
                  p.isHost 
                    ? 'bg-orange-100 text-orange-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {p.name} {p.isHost && '👑'}
              </div>
            ))}
          </div>
        </div>

        {/* 晚餐模式操作 */}
        {isDinnerMode ? (
          <>
            <div className="flex gap-2 mb-4">
              <Link to={`/project/${projectId}/dinner`} className="flex-1">
                <button className="btn-primary w-full py-3 bg-orange-500 hover:bg-orange-600">
                  🍜 新增點單
                </button>
              </Link>
              <Link to={`/project/${projectId}/balance`} className="flex-1">
                <button className="btn-secondary w-full py-3">
                  📋 查看欠款
                </button>
              </Link>
            </div>

            {/* 晚餐模式支出列表 */}
            <div className="card">
              <h3 className="font-semibold text-gray-600 mb-2">📝 點單記錄</h3>
              {expenses.length === 0 ? (
                <p className="text-gray-400 text-center py-4">尚無點單記錄</p>
              ) : (
                <div className="space-y-3">
                  {expenses.map(expense => (
                    <div key={expense.expenseId} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                      <div className="flex justify-between">
                        <p className="text-sm text-gray-500">
                          {new Date(expense.createdAt).toLocaleDateString('zh-TW', { 
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' 
                          })}
                        </p>
                        <p className="font-bold">
                          NT$ {expense.items.reduce((s, i) => s + i.totalOwed, 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {expense.items.map(i => `${i.participantId ? participants.find(p => p.participantId === i.participantId)?.name : '?'}: NT$ ${i.totalOwed}`).join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          /* 完整模式操作 */
          <>
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

            {/* 完整模式支出列表 */}
            <div className="card">
              <h3 className="font-semibold text-gray-600 mb-2">📝 支出紀錄</h3>
              {expenses.length === 0 ? (
                <p className="text-gray-400 text-center py-4">尚無支出記錄</p>
              ) : (
                <div className="space-y-3">
                  {expenses.map(expense => {
                    const payer = participants.find(p => p.participantId === expense.payerId)
                    return (
                      <div key={expense.expenseId} className="border-b border-gray-100 last:border-0 pb-3 last:pb-0">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium">{expense.description}</p>
                            <p className="text-sm text-gray-500">
                              {payer?.name || '未知'} 支付 • {new Date(expense.createdAt).toLocaleDateString('zh-TW')}
                            </p>
                          </div>
                          <p className="font-bold text-lg">
                            {project?.currency === 'JPY' ? '¥' : project?.currency === 'USD' ? '$' : 'NT$'}
                            {expense.amount.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}