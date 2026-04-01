import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import api from '../api'

export default function Home() {
  const [projects, setProjects] = useState([])
  const currentProject = localStorage.getItem('splitease_project')

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const data = api.getAllProjects()
        setProjects(data)
      } catch (error) {
        console.error('Failed to load projects:', error)
      }
    }
    loadProjects()
  }, [])

  return (
    <div className="max-w-md mx-auto min-h-screen flex flex-col p-4">
      <div className="text-center mb-6">
        <h1 className="text-4xl font-bold text-primary mb-2">SplitEase</h1>
        <p className="text-gray-500">簡單分帳，從此輕鬆</p>
      </div>
      
      <div className="w-full mb-6">
        <Link to="/create" className="block">
          <button className="btn-primary w-full py-3 text-lg">
            ✨ 建立新專案
          </button>
        </Link>
      </div>

      {/* My Projects */}
      {projects.length > 0 ? (
        <div className="mt-4">
          <h2 className="text-lg font-semibold text-gray-700 mb-3">📁 我的專案</h2>
          <div className="space-y-2">
            {projects.map(p => (
              <Link 
                key={p.projectId} 
                to={`/project/${p.projectId}`}
                className={`block card flex justify-between items-center ${currentProject === p.projectId ? 'border-2 border-primary' : ''}`}
              >
                <div>
                  <p className="font-medium text-gray-800">{p.name}</p>
                  <p className="text-sm text-gray-500">
                    👥 {p.participantCount || 0} 人
                  </p>
                </div>
                <span className="text-gray-400">→</span>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 py-8">
          還沒有專案，建立一個開始吧！
        </div>
      )}

      <button 
        onClick={() => {
          if (confirm('確定要清除所有專案嗎？此動作無法復原！')) {
            localStorage.removeItem('splitease_projects')
            localStorage.removeItem('splitease_participants')
            localStorage.removeItem('splitease_expenses')
            localStorage.removeItem('splitease_project')
            localStorage.removeItem('splitease_participant')
            window.location.reload()
          }
        }}
        className="mt-8 text-red-500 text-sm"
      >
        🗑️ 清除所有資料
      </button>

      <div className="mt-auto pt-8 text-center text-gray-400 text-sm">
        資料儲存於本地端
      </div>
    </div>
  )
}