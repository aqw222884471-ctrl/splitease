import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function Settlement() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [settlement, setSettlement] = useState(null)
  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [settlementData, projectData] = await Promise.all([
          api.getSettlement(projectId),
          api.getProject(projectId)
        ])
        setSettlement(settlementData)
        setProject(projectData)
      } catch (error) {
        console.error(error)
      }
      setLoading(false)
    }
    fetchData()
  }, [projectId])

  const handleSettle = async () => {
    if (!confirm('確定要結清所有帳務嗎？這將清除所有支出記錄。')) return
    try {
      await api.settleAll(projectId)
      alert('已結清！')
      navigate(`/project/${projectId}`)
    } catch (error) {
      alert('結清失敗')
    }
  }

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex items-center justify-center">
        <div className="text-gray-400">計算中...</div>
      </div>
    )
  }

  const currencySymbol = project?.currency === 'JPY' ? '¥' : project?.currency === 'USD' ? '$' : 'NT$'

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      <div className="bg-primary text-white p-4">
        <button onClick={() => navigate(`/project/${projectId}`)} className="text-white/80 text-sm mb-2">← 返回</button>
        <h1 className="text-2xl font-bold">結算結果</h1>
      </div>

      <div className="p-4 space-y-4">
        {/* 餘額明細 */}
        <div className="card">
          <h3 className="font-semibold text-gray-600 mb-3">💵 帳務明細</h3>
          {settlement?.balances?.map(b => (
            <div key={b.participantId} className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0">
              <span className="font-medium">{b.name}</span>
              <div className="text-right text-sm">
                <div className="text-gray-500">已付: {currencySymbol}{b.paid.toLocaleString()}</div>
                <div className="text-gray-500">應付: {currencySymbol}{b.shouldPay.toLocaleString()}</div>
                <div className={b.balance >= 0 ? 'text-success font-medium' : 'text-red-500 font-medium'}>
                  {b.balance >= 0 ? '+' : ''}{currencySymbol}{b.balance.toLocaleString()}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 還款路徑 */}
        <div className="card">
          <h3 className="font-semibold text-gray-600 mb-3">🔄 還款建議</h3>
          {settlement?.settlements?.length === 0 ? (
            <p className="text-gray-400 text-center py-2">帳務已結清！🎉</p>
          ) : (
            <div className="space-y-2">
              {settlement?.settlements?.map((s, i) => {
                const from = settlement.balances.find(b => b.participantId === s.fromId)
                const to = settlement.balances.find(b => b.participantId === s.toId)
                return (
                  <div key={i} className="bg-green-50 border border-green-200 rounded-lg p-3 flex justify-between items-center">
                    <span className="font-medium text-green-800">{from?.name}</span>
                    <span className="text-green-600 mx-2">→</span>
                    <span className="font-medium text-green-800">{to?.name}</span>
                    <span className="ml-auto font-bold text-green-700">
                      {currencySymbol}{s.amount.toLocaleString()}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <button 
          onClick={handleSettle}
          className="w-full bg-red-500 text-white py-3 rounded-lg font-medium hover:bg-red-600 transition-all"
        >
          🔔 一鍵結清（清除所有記錄）
        </button>
      </div>
    </div>
  )
}