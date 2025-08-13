/*
 * @Author: 52385091@qq.com 52385091@qq.com
 * @Date: 2025-08-07 04:04:56
 * @LastEditors: 52385091@qq.com 52385091@qq.com
 * @LastEditTime: 2025-08-14 01:59:48
 * @FilePath: \ai-coding-evaluator\frontend\src\App.jsx
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import TaskConfig from '@/components/TaskConfig'
import './App.css'

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-background">
        <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 `}>
          <main className="flex-1 overflow-y-auto p-6">
            <Routes>
              <Route path="/" element={<TaskConfig />} />
            </Routes>
          </main>
        </div>
        
        <Toaster />
      </div>
    </Router>
  )
}

export default App

