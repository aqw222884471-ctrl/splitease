import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api'

export default function AddExpense() {
  const { projectId } = useParams()
  const navigate = useNavigate()
  const [participants, setParticipants] = useState([])
  const [payerId, setPayerId] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [splitType, setSplitType] = useState('all') // 'all' = everyone, 'custom' = select
  const [selectedUsers, setSelectedUsers] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchParticipants = async () => {
      const data = await api.getParticipants(projectId)
      setParticipants(data)
      setSelectedUsers(data.map(p => p.participantId)) // Default: all selected
      if (data.length > 0) {
        const myId = localStorage.getItem('splitease_participant')
        setPayerId(myId || data[0].participantId)
      }
    }
    fetchParticipants()
  }, [projectId])

  const handleToggleUser = (participantId) => {
    if (selectedUsers.includes(participantId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== participantId))
    } else {
      setSelectedUsers([...selectedUsers, participantId])
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!payerId || !description || !amount) return
    if (splitType === 'custom' && selectedUsers.length === 0) {
      alert('請至少選擇一位分攤者')
      return
    }
    
    setLoading(true)
    try {
      await api.addExpense(projectId, {
        payerId,
        description,
        amount: parseFloat(amount),
        splitType,
        splitData: {},
        splitUsers: splitType === 'custom' ? selectedUsers : null
      })
      navigate(`/project/${projectId}`)
    } catch (error) {
      alert('新增失敗，請稍後再試')
    }
    setLoading(false)
  }

  // Calculate split preview
  const getSplitPreview = () => {
    const num = splitType === 'all' ? participants.length : selectedUsers.length
    if (num === 0 || !amount) return 'NT$0'
    const perPerson = (parseFloat(amount) || 0) / num
    return `NT$${perPerson.toFixed(0)}/人`
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4">
      <button onClick={() => navigate(`/project/${projectId}`)} className="text-gray-500 mb-4">← 返回</button>
      
      <h2 className="text-2xl font-bold mb-6">新增支出</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">付款人</label>
          <select
            value={payerId}
            onChange={(e) => setPayerId(e.target.value)}
            className="input"
          >
            {participants.map(p => (
              <option key={p.participantId} value={p.participantId}>{p.name}</option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">項目說明</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="例如：晚餐、計程車、門票"
            className="input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            min="0"
            step="0.01"
            className="input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">分攤方式</label>
          <select
            value={splitType}
            onChange={(e) => setSplitType(e.target.value)}
            className="input"
          >
            <option value="all">🌟 全員平均分攤</option>
            <option value="custom">👥 自訂分攤人員</option>
          </select>
          
          {splitType === 'all' && (
            <p className="text-sm text-gray-500 mt-1">
              💡 由 {participants.length} 人平均分攤
            </p>
          )}
        </div>
        
        {/* Custom user selection */}
        {splitType === 'custom' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">選擇分攤者</label>
            <div className="space-y-2">
              {participants.map(p => (
                <label 
                  key={p.participantId}
                  className={`flex items-center p-3 rounded-lg border cursor-pointer ${
                    selectedUsers.includes(p.participantId) 
                      ? 'border-primary bg-indigo-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(p.participantId)}
                    onChange={() => handleToggleUser(p.participantId)}
                    className="mr-3"
                  />
                  <span>{p.name}</span>
                </label>
              ))}
            </div>
            {selectedUsers.length > 0 && amount && (
              <p className="text-sm text-gray-500 mt-2">
                💡 每人应付：{getSplitPreview()}
              </p>
            )}
          </div>
        )}
        
        <button 
          type="submit" 
          disabled={loading || !payerId || !description || !amount || (splitType === 'custom' && selectedUsers.length === 0)}
          className="btn-primary w-full py-3"
        >
          {loading ? '新增中...' : '確認新增'}
        </button>
      </form>
    </div>
  )
}