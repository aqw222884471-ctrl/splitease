import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function AddDinnerOrder() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [participants, setParticipants] = useState([])
  const [deliveryFee, setDeliveryFee] = useState('')
  const [items, setItems] = useState({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        const data = await api.getParticipants(projectId)
        setParticipants(data)
        // 初始化每人的金額
        const initialItems = {}
        data.forEach(p => {
          initialItems[p.participantId] = ''
        })
        setItems(initialItems)
      } catch (error) {
        alert('載入失敗')
        navigate(`/project/${projectId}`)
      }
    }
    fetchParticipants()
  }, [projectId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    
    // 檢查是否有輸入任何金額
    const hasItem = Object.values(items).some(v => v && parseFloat(v) > 0)
    if (!hasItem) {
      alert('請至少輸入一人點餐金額')
      return
    }

    setLoading(true)
    try {
      // 整理成 API 需要的格式
      const orderItems = participants
        .map(p => ({
          participantId: p.participantId,
          amount: parseFloat(items[p.participantId]) || 0
        }))
        .filter(i => i.amount > 0)

      await api.addDinnerExpense(projectId, {
        deliveryFee: parseFloat(deliveryFee) || 0,
        items: orderItems,
        createdBy: localStorage.getItem('splitease_participant')
      })

      alert('✅ 點單已記錄！')
      navigate(`/project/${projectId}`)
    } catch (error) {
      console.error(error)
      alert('記錄失敗，請稍後再試')
    }
    setLoading(false)
  }

  // 計算預覽
  const getPreview = () => {
    const deliveryPerPerson = (parseFloat(deliveryFee) || 0) / participants.length
    const previews = participants.map(p => {
      const amount = parseFloat(items[p.participantId]) || 0
      return {
        name: p.name,
        foodAmount: amount,
        deliveryShare: deliveryPerPerson,
        total: amount + deliveryPerPerson
      }
    })
    return previews
  }

  const previews = getPreview()

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col">
      <div className="bg-orange-500 text-white p-4">
        <button 
          onClick={() => navigate(`/project/${projectId}`)} 
          className="text-white/80 text-sm mb-2"
        >
          ← 返回
        </button>
        <h1 className="text-xl font-bold">🍜 新增點單</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-4 space-y-4">
        {/* 外送費 */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            🚴 外送費（均分）
          </label>
          <input
            type="number"
            value={deliveryFee}
            onChange={(e) => setDeliveryFee(e.target.value)}
            placeholder="0"
            className="input"
          />
          <p className="text-xs text-gray-500 mt-1">
            外送費會÷{participants.length}人 = NT$ {(parseFloat(deliveryFee) || 0) / participants.length} /人
          </p>
        </div>

        {/* 成員點餐 */}
        <div className="card">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            🍽️ 點餐金額
          </label>
          {participants.map(p => (
            <div key={p.participantId} className="flex items-center gap-3 mb-3">
              <div className="flex-1">
                <span className={`font-medium ${p.isHost ? 'text-orange-600' : ''}`}>
                  {p.name} {p.isHost && '👑'}
                </span>
              </div>
              <div className="w-28">
                <input
                  type="number"
                  value={items[p.participantId]}
                  onChange={(e) => setItems({
                    ...items,
                    [p.participantId]: e.target.value
                  })}
                  placeholder="0"
                  className="input text-right"
                />
              </div>
            </div>
          ))}
        </div>

        {/* 預覽 */}
        {previews.some(p => p.total > 0) && (
          <div className="card bg-orange-50 border border-orange-200">
            <h4 className="font-medium text-orange-700 mb-2">📝 本次預覽</h4>
            <div className="space-y-2">
              {previews.filter(p => p.total > 0).map(p => (
                <div key={p.name} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-medium">
                    餐 {p.foodAmount} + 外送 {p.deliveryShare.toFixed(0)} = NT$ {p.total.toFixed(0)}
                  </span>
                </div>
              ))}
              <div className="border-t border-orange-200 pt-2 mt-2 flex justify-between font-bold">
                <span>合計</span>
                <span>NT$ {previews.reduce((s, p) => s + p.total, 0).toFixed(0)}</span>
              </div>
            </div>
          </div>
        )}

        <button 
          type="submit" 
          disabled={loading}
          className="btn-primary w-full py-3 bg-orange-500 hover:bg-orange-600"
        >
          {loading ? '儲存中...' : '✅ 確認記錄'}
        </button>
      </form>
    </div>
  )
}