import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Play, 
  Save, 
  Users, 
  Code, 
  Bot, 
  MessageSquare,
  Settings
} from 'lucide-react'

// 模拟配置数据
const mockUserProfiles = [
  { id: 'cs-student', name: '计算机专业学生', description: '在校学习编程课程的计算机专业学生' },
  { id: 'non-cs-beginner', name: '非计算机专业入门者', description: '有入门编程基础的非计算机专业人员' },
  { id: 'fullstack-dev', name: '前后端算法研发', description: '从事前后端开发和算法研发的专业人员' },
  { id: 'other', name: '其他角色', description: '其他类型的编程学习者或开发者' }
]

const mockProgrammingLanguages = [
  { id: 'javascript', name: 'JavaScript', description: '前端和全栈开发的主流语言' },
  { id: 'python', name: 'Python', description: '数据科学和后端开发的热门语言' },
  { id: 'java', name: 'Java', description: '企业级应用开发的经典语言' },
  { id: 'cpp', name: 'C++', description: '系统编程和高性能计算语言' },
  { id: 'go', name: 'Go', description: '云原生和微服务开发语言' },
  { id: 'rust', name: 'Rust', description: '系统级编程的现代语言' }
]

const mockAIProducts = [
  { id: 'doubao', name: '豆包', description: '字节跳动的AI编程助手' },
  { id: 'deepseek', name: 'Deepseek', description: '深度求索的AI编程模型' },
  { id: 'kimi', name: 'Kimi k2', description: 'Moonshot AI的编程助手' },
  { id: 'yuanbao', name: '元宝AI编程', description: '腾讯的AI编程工具' },
  { id: 'qwen', name: '千问', description: '阿里巴巴的通义千问编程模式' }
]

const mockQuestionTypes = [
  { id: 'learning', name: '学习编程', description: '关于编程语言学习的基础问题' },
  { id: 'project', name: '项目开发', description: '关于项目开发过程中的实际问题' },
  { id: 'debugging', name: '调试问题', description: '关于代码调试和错误解决的问题' },
  { id: 'best_practices', name: '最佳实践', description: '关于编程最佳实践和代码规范的问题' },
  { id: 'performance', name: '性能优化', description: '关于代码性能优化的问题' }
]

export default function TaskConfig() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    userProfileId: '',
    programmingLanguageId: '',
    aiProductIds: [],
    questionTypes: [],
    maxFollowUps: 3
  })
  
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e, executeImmediately = false) => {
    e.preventDefault()
    
    // 验证表单
    if (!formData.name.trim()) {
      toast({
        title: "验证失败",
        description: "请输入任务名称",
        variant: "destructive"
      })
      return
    }
    
    if (!formData.userProfileId) {
      toast({
        title: "验证失败", 
        description: "请选择用户画像",
        variant: "destructive"
      })
      return
    }
    
    if (!formData.programmingLanguageId) {
      toast({
        title: "验证失败",
        description: "请选择编程语言", 
        variant: "destructive"
      })
      return
    }
    
    if (formData.aiProductIds.length === 0) {
      toast({
        title: "验证失败",
        description: "请至少选择一个AI产品",
        variant: "destructive"
      })
      return
    }
    
    if (formData.questionTypes.length === 0) {
      toast({
        title: "验证失败",
        description: "请至少选择一种问题类型",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: executeImmediately ? "任务创建并启动成功" : "任务创建成功",
        description: executeImmediately ? "任务已开始执行，您可以在任务列表中查看进度" : "任务已保存，您可以稍后执行"
      })
      
      navigate('/tasks')
    } catch (error) {
      toast({
        title: "创建失败",
        description: "创建任务时发生错误，请重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleAIProductChange = (productId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        aiProductIds: [...prev.aiProductIds, productId]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        aiProductIds: prev.aiProductIds.filter(id => id !== productId)
      }))
    }
  }

  const handleQuestionTypeChange = (typeId, checked) => {
    if (checked) {
      setFormData(prev => ({
        ...prev,
        questionTypes: [...prev.questionTypes, typeId]
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        questionTypes: prev.questionTypes.filter(id => id !== typeId)
      }))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          返回
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">新建评测任务</h1>
          <p className="text-muted-foreground">配置AI编程产品评测任务的参数</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)} className="space-y-6">
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>基本信息</span>
            </CardTitle>
            <CardDescription>设置任务的基本信息</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">任务名称 *</Label>
              <Input
                id="name"
                placeholder="例如：JavaScript学习评测"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">任务描述</Label>
              <Textarea
                id="description"
                placeholder="描述这个评测任务的目的和内容..."
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* User Profile */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>用户画像</span>
            </CardTitle>
            <CardDescription>选择目标用户类型</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={formData.userProfileId} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, userProfileId: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="选择用户画像" />
              </SelectTrigger>
              <SelectContent>
                {mockUserProfiles.map((profile) => (
                  <SelectItem key={profile.id} value={profile.id}>
                    <div>
                      <div className="font-medium">{profile.name}</div>
                      <div className="text-sm text-muted-foreground">{profile.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Programming Language */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>编程语言</span>
            </CardTitle>
            <CardDescription>选择要评测的编程语言</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={formData.programmingLanguageId} onValueChange={(value) => 
              setFormData(prev => ({ ...prev, programmingLanguageId: value }))
            }>
              <SelectTrigger>
                <SelectValue placeholder="选择编程语言" />
              </SelectTrigger>
              <SelectContent>
                {mockProgrammingLanguages.map((language) => (
                  <SelectItem key={language.id} value={language.id}>
                    <div>
                      <div className="font-medium">{language.name}</div>
                      <div className="text-sm text-muted-foreground">{language.description}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* AI Products */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>AI产品选择</span>
            </CardTitle>
            <CardDescription>选择要评测的AI编程产品（可多选）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockAIProducts.map((product) => (
                <div key={product.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={product.id}
                    checked={formData.aiProductIds.includes(product.id)}
                    onCheckedChange={(checked) => handleAIProductChange(product.id, checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={product.id} className="font-medium cursor-pointer">
                      {product.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{product.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {formData.aiProductIds.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">已选择的产品：</p>
                <div className="flex flex-wrap gap-2">
                  {formData.aiProductIds.map((id) => {
                    const product = mockAIProducts.find(p => p.id === id)
                    return (
                      <Badge key={id} variant="secondary">
                        {product?.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Question Types */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>问题类型</span>
            </CardTitle>
            <CardDescription>选择要评测的问题类型（可多选）</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {mockQuestionTypes.map((type) => (
                <div key={type.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={type.id}
                    checked={formData.questionTypes.includes(type.id)}
                    onCheckedChange={(checked) => handleQuestionTypeChange(type.id, checked)}
                  />
                  <div className="flex-1">
                    <Label htmlFor={type.id} className="font-medium cursor-pointer">
                      {type.name}
                    </Label>
                    <p className="text-sm text-muted-foreground">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
            {formData.questionTypes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm text-muted-foreground mb-2">已选择的问题类型：</p>
                <div className="flex flex-wrap gap-2">
                  {formData.questionTypes.map((id) => {
                    const type = mockQuestionTypes.find(t => t.id === id)
                    return (
                      <Badge key={id} variant="secondary">
                        {type?.name}
                      </Badge>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Advanced Settings */}
        <Card>
          <CardHeader>
            <CardTitle>高级设置</CardTitle>
            <CardDescription>配置评测的高级参数</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="maxFollowUps">最大追问次数</Label>
              <Select 
                value={formData.maxFollowUps.toString()} 
                onValueChange={(value) => 
                  setFormData(prev => ({ ...prev, maxFollowUps: parseInt(value) }))
                }
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">0次</SelectItem>
                  <SelectItem value="1">1次</SelectItem>
                  <SelectItem value="2">2次</SelectItem>
                  <SelectItem value="3">3次</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                系统会根据AI的回答自动生成追问，最多进行指定次数的追问
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <Button type="button" variant="outline" onClick={() => navigate('/tasks')}>
            取消
          </Button>
          
          <div className="flex items-center space-x-3">
            <Button type="submit" variant="outline" disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              保存任务
            </Button>
            
            <Button 
              type="button" 
              onClick={(e) => handleSubmit(e, true)}
              disabled={loading}
            >
              <Play className="h-4 w-4 mr-2" />
              创建并执行
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

