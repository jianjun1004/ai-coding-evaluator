import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Plus, 
  Search, 
  Filter,
  Play,
  Pause,
  Trash2,
  Eye,
  Calendar,
  User,
  Code,
  Bot
} from 'lucide-react'

// 模拟任务数据
const mockTasks = [
  {
    id: '1',
    name: 'JavaScript学习评测',
    description: '针对计算机专业学生的JavaScript基础问题评测',
    status: 'running',
    progress: 65,
    userProfile: '计算机专业学生',
    programmingLanguage: 'JavaScript',
    aiProducts: ['豆包', 'Deepseek', 'Kimi'],
    questionTypes: ['学习编程', '项目开发'],
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-01-15T14:20:00Z',
    totalQuestions: 12,
    completedQuestions: 8,
    averageScore: 3.2
  },
  {
    id: '2',
    name: 'Python项目开发评测',
    description: '面向前后端算法研发的Python项目开发问题评测',
    status: 'completed',
    progress: 100,
    userProfile: '前后端算法研发',
    programmingLanguage: 'Python',
    aiProducts: ['千问', '元宝AI'],
    questionTypes: ['项目开发', '调试问题'],
    createdAt: '2024-01-14T14:20:00Z',
    updatedAt: '2024-01-14T18:45:00Z',
    totalQuestions: 15,
    completedQuestions: 15,
    averageScore: 3.6
  },
  {
    id: '3',
    name: 'Java基础问题评测',
    description: '非计算机专业学生的Java入门问题评测',
    status: 'failed',
    progress: 30,
    userProfile: '非计算机专业',
    programmingLanguage: 'Java',
    aiProducts: ['豆包', 'Deepseek'],
    questionTypes: ['学习编程'],
    createdAt: '2024-01-13T09:15:00Z',
    updatedAt: '2024-01-13T10:30:00Z',
    totalQuestions: 10,
    completedQuestions: 3,
    averageScore: 2.1
  },
  {
    id: '4',
    name: 'C++性能优化评测',
    description: '高级开发者的C++性能优化问题评测',
    status: 'pending',
    progress: 0,
    userProfile: '前后端算法研发',
    programmingLanguage: 'C++',
    aiProducts: ['Deepseek', 'Kimi', '千问'],
    questionTypes: ['性能优化', '最佳实践'],
    createdAt: '2024-01-12T16:00:00Z',
    updatedAt: '2024-01-12T16:00:00Z',
    totalQuestions: 0,
    completedQuestions: 0,
    averageScore: 0
  }
]

export default function TaskList() {
  const [tasks, setTasks] = useState(mockTasks)
  const [filteredTasks, setFilteredTasks] = useState(mockTasks)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let filtered = tasks

    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(task => 
        task.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.userProfile.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.programmingLanguage.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // 状态过滤
    if (statusFilter !== 'all') {
      filtered = filtered.filter(task => task.status === statusFilter)
    }

    setFilteredTasks(filtered)
  }, [tasks, searchTerm, statusFilter])

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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const handleAction = async (taskId, action) => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      if (action === 'delete') {
        setTasks(prev => prev.filter(task => task.id !== taskId))
      }
      
      console.log(`${action} task ${taskId}`)
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">任务列表</h1>
          <p className="text-muted-foreground">管理和监控AI编程产品评测任务</p>
        </div>
        <Link to="/tasks/new">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            新建任务
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索任务名称、描述、用户画像或编程语言..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部状态</SelectItem>
                <SelectItem value="running">运行中</SelectItem>
                <SelectItem value="completed">已完成</SelectItem>
                <SelectItem value="failed">失败</SelectItem>
                <SelectItem value="pending">等待中</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tasks Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTasks.map((task) => (
          <Card key={task.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg">{task.name}</CardTitle>
                  <CardDescription className="mt-1">
                    {task.description}
                  </CardDescription>
                </div>
                {getStatusBadge(task.status)}
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Progress */}
              {task.status === 'running' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>进度</span>
                    <span>{task.progress}%</span>
                  </div>
                  <Progress value={task.progress} className="h-2" />
                </div>
              )}

              {/* Task Info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>{task.userProfile}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Code className="h-4 w-4 text-muted-foreground" />
                  <span>{task.programmingLanguage}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Bot className="h-4 w-4 text-muted-foreground" />
                  <span>{task.aiProducts.length} 个产品</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span>{formatDate(task.createdAt)}</span>
                </div>
              </div>

              {/* AI Products */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">AI产品:</p>
                <div className="flex flex-wrap gap-1">
                  {task.aiProducts.map((product) => (
                    <Badge key={product} variant="outline" className="text-xs">
                      {product}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Question Types */}
              <div>
                <p className="text-sm text-muted-foreground mb-2">问题类型:</p>
                <div className="flex flex-wrap gap-1">
                  {task.questionTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Stats */}
              {task.status === 'completed' && (
                <div className="flex items-center justify-between text-sm bg-muted/50 rounded-lg p-3">
                  <div>
                    <span className="text-muted-foreground">问题数: </span>
                    <span className="font-medium">{task.totalQuestions}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">平均分: </span>
                    <span className="font-medium">{task.averageScore}/4</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2 border-t">
                <Link to={`/tasks/${task.id}`}>
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    查看详情
                  </Button>
                </Link>
                
                <div className="flex items-center space-x-2">
                  {task.status === 'pending' && (
                    <Button 
                      size="sm" 
                      onClick={() => handleAction(task.id, 'start')}
                      disabled={loading}
                    >
                      <Play className="h-4 w-4 mr-2" />
                      开始
                    </Button>
                  )}
                  
                  {task.status === 'running' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleAction(task.id, 'pause')}
                      disabled={loading}
                    >
                      <Pause className="h-4 w-4 mr-2" />
                      暂停
                    </Button>
                  )}
                  
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => handleAction(task.id, 'delete')}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">没有找到任务</h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchTerm || statusFilter !== 'all' 
                ? '尝试调整搜索条件或过滤器' 
                : '还没有创建任何评测任务'}
            </p>
            <Link to="/tasks/new">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                创建第一个任务
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

