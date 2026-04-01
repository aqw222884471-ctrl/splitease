import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import CreateProject from './pages/CreateProject'
import JoinProject from './pages/JoinProject'
import ProjectDashboard from './pages/ProjectDashboard'
import AddExpense from './pages/AddExpense'
import Settlement from './pages/Settlement'

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-background">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/create" element={<CreateProject />} />
          <Route path="/join" element={<JoinProject />} />
          <Route path="/project/:projectId" element={<ProjectDashboard />} />
          <Route path="/project/:projectId/expense" element={<AddExpense />} />
          <Route path="/project/:projectId/settlement" element={<Settlement />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </BrowserRouter>
  )
}

export default App