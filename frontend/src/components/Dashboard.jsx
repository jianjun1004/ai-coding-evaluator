import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  Plus,
  TrendingUp,
  Users,
  Bot
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

// 模拟数据
const mockStats = {
  totalTasks: 24,
  runningTasks: 3,
  completedTasks: 18,
  failedTasks: 3,
  averageScore: 3.2,
  totalQuestions: 156,
  totalResponses: 142
}

const mockRecentTasks = [
  {
    id: '1',
    name: 'JavaScript学习评测',
    status: 'running',
    progress: 65,
    userProfile: '计算机专业学生',
    aiProducts: ['豆包', 'Deepseek', 'Kimi'],
    createdAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Python项目开发评测',
    status: 'completed',
    progress: 100,
    userProfile: '前后端算法研发',
    aiProducts: ['千问', '元宝AI'],
    createdAt: '2024-01-14T14:20:00Z'
  },
  {
    id: '3',
    name: 'Java基础问题评测',
    status: 'failed',
    progress: 30,
    userProfile: '非计算机专业',
    aiProducts: ['豆包', 'Deepseek'],
    createdAt: '2024-01-13T09:15:00Z'
  }
]

const mockChartData = [
  { name: '豆包', score: 3.4, tasks: 8 },
  { name: 'Deepseek', score: 3.6, tasks: 7 },
  { name: 'Kimi', score: 3.2, tasks: 6 },
  { name: '千问', score: 2.9, tasks: 5 },
  { name: '元宝AI', score: 3.1, tasks: 4 }
]

const mockTrendData = [
  { date: '01-10', tasks: 2, avgScore: 3.1 },
  { date: '01-11', tasks: 3, avgScore: 3.3 },
  { date: '01-12', tasks: 1, avgScore: 2.8 },
  { date: '01-13', tasks: 4, avgScore: 3.2 },
  { date: '01-14', tasks: 2, avgScore: 3.5 },
  { date: '01-15', tasks: 3, avgScore: 3.4 },
  { date: '01-16', tasks: 1, avgScore: 3.0 }
]

export default function Dashboard() {
  const [runningTasks, setRunningTasks] = useState([])

  useEffect(() => {
    // 模拟获取运行中的任务
    setRunningTasks(mockRecentTasks.filter(task => task.status === 'running'))
  }, [])

  const getStatusIcon = (status) => {
    switch (status) {
      case 'running':
        return <Activity className="h-4 w-4 text-blue-500" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />
      default:
        return <Clock className="h-4 w-4 text-gray-500" />
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      running: 'default',
      completed: 'secondary',
      failed: 'destructive',
      pending: 'outline'
    }
    
    const labels = {
      running: '运行中',
      completed: '已完成',
      failed: '失败',
      pending: '等待中'
    }

    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">仪表板</h1>
          <p className="text-muted-foreground">AI编程产品评测系统概览</p>
        </div>
        <Link to="/tasks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建任务
          </Button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总任务数</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalTasks}</div>
            <p className="text-xs text-muted-foreground">
              +2 相比上周
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">运行中</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.runningTasks}</div>
            <p className="text-xs text-muted-foreground">
              当前活跃任务
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均评分</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.averageScore}</div>
            <p className="text-xs text-muted-foreground">
              满分4分
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总问答数</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockStats.totalResponses}</div>
            <p className="text-xs text-muted-foreground">
              共{mockStats.totalQuestions}个问题
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Tasks */}
        <Card>
          <CardHeader>
            <CardTitle>最近任务</CardTitle>
            <CardDescription>最新的评测任务状态</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockRecentTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(task.status)}
                    <div>
                      <p className="font-medium">{task.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {task.userProfile} • {task.aiProducts.join(', ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {task.status === 'running' && (
                      <div className="w-20">
                        <Progress value={task.progress} className="h-2" />
                      </div>
                    )}
                    {getStatusBadge(task.status)}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/tasks">
                <Button variant="outline" className="w-full">
                  查看所有任务
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* AI Products Performance */}
        <Card>
          <CardHeader>
            <CardTitle>AI产品表现</CardTitle>
            <CardDescription>各AI产品的平均评分对比</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={mockChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis domain={[0, 4]} />
                <Tooltip />
                <Bar dataKey="score" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Trend Chart */}
      <Card>
        <CardHeader>
          <CardTitle>评测趋势</CardTitle>
          <CardDescription>最近7天的任务数量和平均评分趋势</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockTrendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" domain={[0, 4]} />
              <Tooltip />
              <Bar yAxisId="left" dataKey="tasks" fill="hsl(var(--muted))" />
              <Line yAxisId="right" type="monotone" dataKey="avgScore" stroke="hsl(var(--primary))" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  )
}

