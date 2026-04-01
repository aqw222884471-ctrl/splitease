import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import api from '../api'

export default function JoinProject() {
  const navigate = useNavigate()
  const location = useLocation()
  const [inviteCode, setInviteCode] = useState('')
  const [userName, setUserName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Check for invite code in URL query params
    const params = new URLSearchParams(location.search)
    const code = params.get('code')
    if (code) {
      setInviteCode(code)
    }
  }, [location])

  const handleJoin = async (e) => {
    e.preventDefault()
    if (!inviteCode || !userName) return
    
    setLoading(true)
    setError('')
    
    try {
      const projectData = await api.joinByCode(inviteCode.toUpperCase())
      const participant = await api.addParticipant(projectData.projectId, userName)
      
      localStorage.setItem('splitease_project', projectData.projectId)
      localStorage.setItem('splitease_participant', participant.participantId)
      
      navigate(`/project/${projectData.projectId}`)
    } catch (err) {
      setError('邀請碼無效或錯誤，請重新確認')
    }
    
    setLoading(false)
  }

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4">
      <button onClick={() => navigate('/')} className="text-gray-500 mb-4">← 返回</button>
      
      <h2 className="text-2xl font-bold mb-6">加入專案</h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}
      
      <form onSubmit={handleJoin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">邀請碼</label>
          <input
            type="text"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
            placeholder="輸入 6 位數邀請碼"
            maxLength={6}
            className="input text-center text-xl tracking-widest uppercase"
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
        
        <button 
          type="submit" 
          disabled={loading || !inviteCode || !userName}
          className="btn-primary w-full py-3"
        >
          {loading ? '加入中...' : '加入專案'}
        </button>
      </form>
    </div>
  )
}