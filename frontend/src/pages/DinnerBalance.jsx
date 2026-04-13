import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function DinnerBalance() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [balance, setBalance] = useState(null)
  const [loading, setLoading] = useState(true)
  const currentParticipantId = localStorage.getItem('splitease_participant')

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const data = await api.getDinnerBalance(projectId)
        setBalance(data)
      } catch (error) {
        alert('載入失敗')
      }
      setLoading(false)
    }
    fetchBalance()
  }, [projectId])

  const handleSettle = async () => {
    if (!confirm('確定要結清所有帳務嗎？這會清除所有累積的記錄。')) return
    
    setLoading(true)
    try {
      await api.settleAll(projectId)
      alert('✅ 已結清！')
      navigate(`/project/${projectId}`)
    } catch (error) {
      alert('結清失敗')
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="text-gray-400">載入中...</div>
      </div>
    )
  }

  // 找出召集人
  const host = balance?.balances.find(b => b.isHost)
  const members = balance?.balances.filter(b => !b.isHost) || []

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      <div className="bg-orange-500 text-white p-4">
        <button 
          onClick={() => navigate(`/project/${projectId}`)} 
          className="text-white/80 text-sm mb-2"
        >
          ← 返回
        </button>
        <h1 className="text-xl font-bold">📋 欠款明細</h1>
      </div>

      <div className="p-4">
        {/* 總消費 */}
        <div className="card mb-4 bg-orange-50 border border-orange-200">
          <p className="text-sm text-orange-600">累積總消費</p>
          <p className="text-2xl font-bold text-orange-600">
            NT$ {balance?.totalExpenses?.toLocaleString() || 0}
          </p>
        </div>

        {/* 欠款列表 */}
        <div className="card mb-4">
          <h3 className="font-semibold text-gray-600 mb-3">👥 欠款對照</h3>
          
          {/* 召集人（顯示已墊付） */}
          {host && (
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div>
                <span className="font-medium">{host.name}</span>
                <span className="text-xs text-gray-500 ml-2">👑 召集人</span>
              </div>
              <div className="text-right">
                <p className="text-green-600 font-medium">
                  +NT$ {host.totalOwed.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500">已墊付</p>
              </div>
            </div>
          )}

          {/* 成員（顯示欠款） */}
          {members.map(m => {
            const isCurrentUser = m.participantId === currentParticipantId
            return (
              <div 
                key={m.participantId} 
                className={`flex justify-between items-center py-3 ${
                  m.balance > 0 ? 'bg-red-50 -mx-3 px-3 rounded' : ''
                }`}
              >
                <div>
                  <span className={`font-medium ${isCurrentUser ? 'text-orange-600' : ''}`}>
                    {m.name} {isCurrentUser && '(你)'}
                  </span>
                </div>
                <div className="text-right">
                  <p className={`font-medium ${m.balance > 0 ? 'text-red-600' : 'text-gray-400'}`}>
                    {m.balance > 0 ? '-' : ''}NT$ {Math.abs(m.balance).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    {m.balance > 0 ? '待繳納' : '已結清'}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        {/* 結清按鈕 */}
        <button 
          onClick={handleSettle}
          disabled={loading}
          className="btn-primary w-full py-3 bg-green-500 hover:bg-green-600"
        >
          💚 一鍵結清
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          結清後會清除所有累積記錄
        </p>
      </div>
    </div>
  )
}