import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function CreateProject() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [userName, setUserName] = useState('')
  const [currency, setCurrency] = useState('TWD')
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)

  const handleCreate = async (e) => {
    e.preventDefault()
    if (!name || !userName) return
    
    setLoading(true)
    try {
      const project = await api.createProject(name, currency)
      const participant = await api.addParticipant(project.projectId, userName)
      
      localStorage.setItem('splitease_project', project.projectId)
      localStorage.setItem('splitease_participant', participant.participantId)
      
      setCreated({ ...project, participantId: participant.participantId })
    } catch (error) {
      alert('建立失敗，請稍後再試')
    }
    setLoading(false)
  }

  if (created) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card w-full text-center">
          <h2 className="text-2xl font-bold text-success mb-4">✅ 專案建立成功！</h2>
          
          <button 
            onClick={() => navigate(`/project/${created.projectId}`)}
            className="btn-primary w-full"
          >
            進入專案 →
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4">
      <button onClick={() => navigate('/')} className="text-gray-500 mb-4">← 返回</button>
      
      <h2 className="text-2xl font-bold mb-6">建立新專案</h2>
      
      <form onSubmit={handleCreate} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">專案名稱</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="例如：東京之旅、聚餐分帳"
            className="input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">你的暱稱</label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder="輸入你的名字"
            className="input"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">幣別</label>
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="input"
          >
            <option value="TWD">TWD (台幣)</option>
            <option value="USD">USD (美元)</option>
            <option value="JPY">JPY (日幣)</option>
            <option value="CNY">CNY (人民币)</option>
          </select>
        </div>
        
        <button 
          type="submit" 
          disabled={loading || !name || !userName}
          className="btn-primary w-full py-3"
        >
          {loading ? '建立中...' : '建立專案'}
        </button>
      </form>
    </div>
  )
}