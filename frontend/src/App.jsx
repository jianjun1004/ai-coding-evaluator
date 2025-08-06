import { useState } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import Sidebar from '@/components/Sidebar'
import Dashboard from '@/components/Dashboard'
import TaskConfig from '@/components/TaskConfig'
import TaskList from '@/components/TaskList'
import TaskDetail from '@/components/TaskDetail'
import Settings from '@/components/Settings'
import './App.css'

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true)

  return (
    <Router>
      <div className="flex h-screen bg-background">
        <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />
        
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          sidebarOpen ? 'ml-64' : 'ml-16'
        }`}>
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tasks" element={<TaskList />} />
              <Route path="/tasks/new" element={<TaskConfig />} />
              <Route path="/tasks/:id" element={<TaskDetail />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </main>
        </div>
        
        <Toaster />
      </div>
    </Router>
  )
}

export default App

