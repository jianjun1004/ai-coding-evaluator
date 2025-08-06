import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  ArrowLeft, 
  Play, 
  Pause, 
  RotateCcw,
  Download,
  Calendar,
  User,
  Code,
  Bot,
  MessageSquare,
  Star,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react'

// 模拟任务详情数据
const mockTaskDetail = {
  id: '1',
  name: 'JavaScript学习评测',
  description: '针对计算机专业学生的JavaScript基础问题评测',
  status: 'running',
  progress: 65,
  userProfile: '计算机专业学生',
  programmingLanguage: 'JavaScript',
  aiProducts: ['豆包', 'Deepseek', 'Kimi'],
  questionTypes: ['学习编程', '项目开发'],
  maxFollowUps: 3,
  createdAt: '2024-01-15T10:30:00Z',
  updatedAt: '2024-01-15T14:20:00Z',
  totalQuestions: 12,
  completedQuestions: 8,
  averageScore: 3.2,
  results: [
    {
      id: '1',
      question: '如何在JavaScript中声明变量？',
      questionType: '学习编程',
      aiProduct: '豆包',
      response: 'JavaScript中可以使用var、let和const来声明变量。var是传统的声明方式，let和const是ES6引入的新方式...',
      score: 4,
      reason: '回答准确完整，涵盖了所有变量声明方式，并解释了它们的区别',
      followUps: [
        {
          question: '能详细解释一下let和const的区别吗？',
          response: 'let声明的变量可以重新赋值，而const声明的变量不能重新赋值...',
          score: 4
        }
      ],
      timestamp: '2024-01-15T10:35:00Z'
    },
    {
      id: '2',
      question: '什么是JavaScript闭包？',
      questionType: '学习编程',
      aiProduct: 'Deepseek',
      response: '闭包是指函数能够访问其外部作用域中的变量，即使在外部函数已经返回之后...',
      score: 3,
      reason: '回答基本正确，但缺少具体的代码示例',
      followUps: [
        {
          question: '能给一个闭包的实际应用例子吗？',
          response: '当然可以，这里是一个计数器的例子...',
          score: 4
        }
      ],
      timestamp: '2024-01-15T10:40:00Z'
    },
    {
      id: '3',
      question: '如何处理JavaScript中的异步操作？',
      questionType: '项目开发',
      aiProduct: 'Kimi',
      response: 'JavaScript中处理异步操作主要有回调函数、Promise和async/await三种方式...',
      score: 4,
      reason: '回答全面，涵盖了所有主要的异步处理方式，并提供了清晰的解释',
      followUps: [],
      timestamp: '2024-01-15T10:45:00Z'
    }
  ]
}

export default function TaskDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [task, setTask] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟API调用
    const fetchTask = async () => {
      setLoading(true)
      try {
        await new Promise(resolve => setTimeout(resolve, 1000))
        setTask(mockTaskDetail)
      } catch (error) {
        console.error('Failed to fetch task:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchTask()
  }, [id])

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

  const getScoreColor = (score) => {
    if (score >= 4) return 'text-green-600'
    if (score >= 3) return 'text-yellow-600'
    if (score >= 2) return 'text-orange-600'
    return 'text-red-600'
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('zh-CN')
  }

  const handleAction = async (action) => {
    console.log(`${action} task ${id}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-4">任务未找到</h2>
        <Button onClick={() => navigate('/tasks')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回任务列表
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            返回
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground">{task.name}</h1>
            <p className="text-muted-foreground">{task.description}</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          {getStatusBadge(task.status)}
          
          {task.status === 'running' && (
            <Button variant="outline" onClick={() => handleAction('pause')}>
              <Pause className="h-4 w-4 mr-2" />
              暂停
            </Button>
          )}
          
          {task.status === 'pending' && (
            <Button onClick={() => handleAction('start')}>
              <Play className="h-4 w-4 mr-2" />
              开始
            </Button>
          )}
          
          {task.status === 'failed' && (
            <Button onClick={() => handleAction('restart')}>
              <RotateCcw className="h-4 w-4 mr-2" />
              重新开始
            </Button>
          )}
          
          {task.status === 'completed' && (
            <Button variant="outline" onClick={() => handleAction('export')}>
              <Download className="h-4 w-4 mr-2" />
              导出结果
            </Button>
          )}
        </div>
      </div>

      {/* Progress */}
      {task.status === 'running' && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">执行进度</span>
                <span className="text-sm text-muted-foreground">
                  {task.completedQuestions}/{task.totalQuestions} 个问题
                </span>
              </div>
              <Progress value={task.progress} className="h-3" />
              <p className="text-sm text-muted-foreground">
                已完成 {task.progress}%，预计还需要 {Math.ceil((100 - task.progress) / 10)} 分钟
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Task Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">用户画像</CardTitle>
            <User className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{task.userProfile}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">编程语言</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{task.programmingLanguage}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI产品数</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{task.aiProducts.length}</div>
            <p className="text-xs text-muted-foreground">
              {task.aiProducts.join(', ')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均评分</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">{task.averageScore}/4</div>
            <p className="text-xs text-muted-foreground">
              基于 {task.completedQuestions} 个回答
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Results */}
      <Tabs defaultValue="results" className="space-y-4">
        <TabsList>
          <TabsTrigger value="results">评测结果</TabsTrigger>
          <TabsTrigger value="analytics">数据分析</TabsTrigger>
          <TabsTrigger value="settings">任务设置</TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          {task.results.map((result) => (
            <Card key={result.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{result.question}</CardTitle>
                    <div className="flex items-center space-x-4 mt-2">
                      <Badge variant="outline">{result.questionType}</Badge>
                      <Badge variant="secondary">{result.aiProduct}</Badge>
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <span className={`font-medium ${getScoreColor(result.score)}`}>
                          {result.score}/4
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{formatDate(result.timestamp)}</span>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium mb-2">AI回答:</h4>
                  <p className="text-sm bg-muted/50 rounded-lg p-3">
                    {result.response}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium mb-2">评分理由:</h4>
                  <p className="text-sm text-muted-foreground">
                    {result.reason}
                  </p>
                </div>

                {result.followUps.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">追问记录:</h4>
                    <div className="space-y-3">
                      {result.followUps.map((followUp, index) => (
                        <div key={index} className="border-l-2 border-primary/20 pl-4">
                          <p className="text-sm font-medium mb-1">
                            追问 {index + 1}: {followUp.question}
                          </p>
                          <p className="text-sm bg-muted/30 rounded p-2 mb-2">
                            {followUp.response}
                          </p>
                          <div className="flex items-center space-x-1">
                            <Star className="h-3 w-3 text-yellow-500" />
                            <span className={`text-sm font-medium ${getScoreColor(followUp.score)}`}>
                              {followUp.score}/4
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="analytics">
          <Card>
            <CardHeader>
              <CardTitle>数据分析</CardTitle>
              <CardDescription>任务执行的详细统计信息</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                数据分析功能开发中...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings">
          <Card>
            <CardHeader>
              <CardTitle>任务配置</CardTitle>
              <CardDescription>查看任务的详细配置信息</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">创建时间</label>
                  <p className="text-sm text-muted-foreground">{formatDate(task.createdAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">最后更新</label>
                  <p className="text-sm text-muted-foreground">{formatDate(task.updatedAt)}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">最大追问次数</label>
                  <p className="text-sm text-muted-foreground">{task.maxFollowUps} 次</p>
                </div>
                <div>
                  <label className="text-sm font-medium">问题类型</label>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {task.questionTypes.map((type) => (
                      <Badge key={type} variant="outline" className="text-xs">
                        {type}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

