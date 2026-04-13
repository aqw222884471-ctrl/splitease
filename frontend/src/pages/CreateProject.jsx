import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api'

export default function CreateProject() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('dinner')
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
      const project = await api.createProject(name, currency, mode, userName)
      
      localStorage.setItem('splitease_project', project.projectId)
      localStorage.setItem('splitease_participant', project.participantId)
      
      setCreated(project)
    } catch (error) {
      console.error(error)
      alert('建立失敗，請稍後再試')
    }
    setLoading(false)
  }

  if (created) {
    return (
      <div className="max-w-md mx-auto min-h-screen flex flex-col items-center justify-center p-4">
        <div className="card w-full text-center">
          <h2 className="text-2xl font-bold text-success mb-4">✅ 專案建立成功！</h2>
          <p className="text-gray-600 mb-2">
            {mode === 'dinner' ? '🍜 晚餐模式' : '📊 完整模式'}
          </p>
          <div className="bg-gray-100 p-3 rounded-lg mb-4">
            <p className="text-sm text-gray-500 mb-1">邀請碼</p>
            <p className="text-2xl font-bold text-gray-800">{created.inviteCode}</p>
          </div>
          <p className="text-sm text-gray-500 mb-4">將邀請碼分享給朋友一起記帳</p>
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
        {/* 模式選擇 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">選擇模式</label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setMode('dinner')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'dinner' 
                  ? 'border-orange-500 bg-orange-50' 
                  : 'border-gray-200'
              }`}
            >
              <span className="text-2xl block mb-1">🍜</span>
              <span className="font-medium">晚餐模式</span>
              <p className="text-xs text-gray-500 mt-1">快速度記、週結月結</p>
            </button>
            <button
              type="button"
              onClick={() => setMode('full')}
              className={`p-4 rounded-xl border-2 transition-all ${
                mode === 'full' 
                  ? 'border-indigo-500 bg-indigo-50' 
                  : 'border-gray-200'
              }`}
            >
              <span className="text-2xl block mb-1">📊</span>
              <span className="font-medium">完整模式</span>
              <p className="text-xs text-gray-500 mt-1">旅行分攤複雜分帳</p>
            </button>
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">專案名稱</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder={mode === 'dinner' ? '例如：晚餐分帳' : '例如：東京之旅'}
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
          className={`btn-primary w-full py-3 ${
            mode === 'dinner' ? 'bg-orange-500 hover:bg-orange-600' : ''
          }`}
        >
          {loading ? '建立中...' : '建立專案'}
        </button>
      </form>
    </div>
  )
}