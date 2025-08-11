import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'

import { 
  MessageSquare,
  Plus,
  Trash2,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Loader2
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// 预设问题类型配置
const presetQuestionTypes = [
  { id: 'learning', name: '学习编程', description: '关于编程语言学习的基础问题' },
  { id: 'project', name: '项目开发', description: '关于项目开发过程中的实际问题' },
  { id: 'debugging', name: '调试问题', description: '关于代码调试和错误解决的问题' },
  { id: 'best_practices', name: '最佳实践', description: '关于编程最佳实践和代码规范的问题' },
  { id: 'performance', name: '性能优化', description: '关于代码性能优化的问题' }
]

export default function Step2Questions({ 
  data, 
  onDataChange, 
  onNext, 
  onPrevious 
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [newQuestion, setNewQuestion] = useState('')
  const [showAddForm, setShowAddForm] = useState(false)
  const [customQuestionType, setCustomQuestionType] = useState('')
  const [showCustomTypeForm, setShowCustomTypeForm] = useState(false)

  // 初始化问题列表
  const [questions, setQuestions] = useState(data.questions || [])

  // 验证必要的数据是否存在
  const validateRequiredData = () => {
    const hasUserProfile = data.customUserProfile && data.customUserProfile.name
    const hasProgrammingLanguage = data.customProgrammingLanguage && data.customProgrammingLanguage.name
    
    if (!hasUserProfile) {
      toast({
        title: "数据缺失",
        description: "请先返回第一步配置用户画像（需要包含名称）",
        variant: "destructive"
      })
      return false
    }
    
    if (!hasProgrammingLanguage) {
      toast({
        title: "数据缺失",
        description: "请先返回第一步配置编程语言（需要包含名称）",
        variant: "destructive"
      })
      return false
    }
    
    return true
  }

  // 处理预设问题类型选择
  const handlePresetQuestionTypeChange = (typeId, checked) => {
    // 根据typeId找到对应的中文名称
    const typeInfo = presetQuestionTypes.find(type => type.id === typeId)
    const typeName = typeInfo ? typeInfo.name : typeId
    
    const newTypes = checked 
      ? [...(data.questionTypes || []), typeName]
      : (data.questionTypes || []).filter(name => name !== typeName)
    
    onDataChange({ ...data, questionTypes: newTypes })
  }

  // 处理自定义问题类型添加
  const handleAddCustomQuestionType = () => {
    if (!customQuestionType.trim()) {
      toast({
        title: "验证失败",
        description: "请输入自定义问题类型",
        variant: "destructive"
      })
      return
    }

    const newTypes = [...(data.questionTypes || []), customQuestionType.trim()]
    onDataChange({ ...data, questionTypes: newTypes })
    setCustomQuestionType('')
    setShowCustomTypeForm(false)

    toast({
      title: "添加成功",
      description: "自定义问题类型已添加",
    })
  }

  // 处理问题类型删除
  const handleRemoveQuestionType = (typeToRemove) => {
    const newTypes = (data.questionTypes || []).filter(type => type !== typeToRemove)
    onDataChange({ ...data, questionTypes: newTypes })

    toast({
      title: "删除成功",
      description: "问题类型已删除",
    })
  }

  // 生成问题
  const handleGenerateQuestions = async () => {
    // 验证必要的数据
    if (!validateRequiredData()) {
      return
    }

    if (!validateQuestionTypes()) {
      toast({
        title: "验证失败",
        description: "请先选择至少一个有效的问题类型",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // 准备请求数据
      const requestData = {
        questionTypes: data.questionTypes || [],
        customUserProfile: data.customUserProfile,
        customProgrammingLanguage: data.customProgrammingLanguage
      }

      
      // 调用后端API生成问题
      const response = await fetch('/api/tasks/generate-questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData)
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || '生成问题失败')
      }

      const generatedQuestions = result.data.map(question => ({
        id: question.id,
        content: question.content,
        type: question.type,
        isGenerated: true
      }))

      const updatedQuestions = [...questions, ...generatedQuestions]
      setQuestions(updatedQuestions)
      onDataChange({ ...data, questions: updatedQuestions })

      toast({
        title: "生成成功",
        description: `已生成 ${generatedQuestions.length} 个问题`,
      })
    } catch (error) {
      console.error('生成问题失败:', error)
      toast({
        title: "生成失败",
        description: error.message || "问题生成失败，请重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 添加手动问题
  const handleAddQuestion = () => {
    if (!newQuestion.trim()) {
      toast({
        title: "验证失败",
        description: "请输入问题内容",
        variant: "destructive"
      })
      return
    }

    if (!validateQuestionTypes()) {
      toast({
        title: "验证失败",
        description: "请先选择至少一个有效的问题类型",
        variant: "destructive"
      })
      return
    }

    const question = {
      id: `manual_${Date.now()}`,
      content: newQuestion.trim(),
      type: data.questionTypes[0], // 使用第一个问题类型
      isGenerated: false,
      isCustom: true
    }

    const updatedQuestions = [...questions, question]
    setQuestions(updatedQuestions)
    onDataChange({ ...data, questions: updatedQuestions })
    setNewQuestion('')
    setShowAddForm(false)

    toast({
      title: "添加成功",
      description: "问题已添加到列表",
    })
  }

  // 删除问题
  const handleDeleteQuestion = (questionId) => {
    const updatedQuestions = questions.filter(q => q.id !== questionId)
    setQuestions(updatedQuestions)
    onDataChange({ ...data, questions: updatedQuestions })

    toast({
      title: "删除成功",
      description: "问题已从列表中删除",
    })
  }

  // 验证表单
  const validateForm = () => {
    if (!data.questionTypes || data.questionTypes.length === 0) return false
    if (!questions || questions.length === 0) return false
    return true
  }

  // 验证问题类型是否为有效字符串
  const validateQuestionTypes = () => {
    if (!data.questionTypes || data.questionTypes.length === 0) return false
    return data.questionTypes.every(type => typeof type === 'string' && type.trim().length > 0)
  }

  const handleNext = () => {
    if (!validateForm()) {
      toast({
        title: "验证失败",
        description: "请选择问题类型并添加至少一个问题",
        variant: "destructive"
      })
      return
    }
    
    if (!validateQuestionTypes()) {
      toast({
        title: "验证失败",
        description: "请确保选择的问题类型都是有效的",
        variant: "destructive"
      })
      return
    }
    
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">第二步：配置问题类型和生成问题</h2>
          <p className="text-muted-foreground">选择问题类型并生成或添加评测问题</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">步骤 2/3</Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 问题类型配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="h-5 w-5" />
              <span>问题类型</span>
            </CardTitle>
            <CardDescription>
              选择要评测的问题类型，用于生成相应类型的编程问题
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {presetQuestionTypes.map((type) => (
                <div key={type.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={type.id}
                    checked={(data.questionTypes || []).includes(type.name)}
                    onCheckedChange={(checked) => handlePresetQuestionTypeChange(type.id, checked)}
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

            {/* 自定义问题类型 */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>自定义问题类型</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCustomTypeForm(!showCustomTypeForm)}
                >
                  {showCustomTypeForm ? '取消' : '添加自定义类型'}
                </Button>
              </div>
              
              {showCustomTypeForm && (
                <div className="space-y-3 p-3 border rounded-lg">
                  <div className="space-y-2">
                    <Label htmlFor="customQuestionType">问题类型名称</Label>
                    <Input
                      id="customQuestionType"
                      placeholder="输入自定义问题类型，如：算法设计、系统架构等"
                      value={customQuestionType}
                      onChange={(e) => setCustomQuestionType(e.target.value)}
                    />
                  </div>
                  <Button
                    onClick={handleAddCustomQuestionType}
                    disabled={!customQuestionType.trim()}
                    size="sm"
                  >
                    添加
                  </Button>
                </div>
              )}

              {/* 显示已选择的问题类型 */}
              {(data.questionTypes || []).length > 0 && (
                <div className="space-y-2">
                  <Label>已选择的问题类型</Label>
                  <div className="flex flex-wrap gap-2">
                    {(data.questionTypes || []).map((type) => (
                      <Badge
                        key={type}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground"
                        onClick={() => handleRemoveQuestionType(type)}
                      >
                        {type}
                        <span className="ml-1">×</span>
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 问题管理 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <MessageSquare className="h-5 w-5" />
                <span>问题列表</span>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant="outline">{questions.length} 个问题</Badge>
              </div>
            </CardTitle>
            <CardDescription>
              生成或手动添加评测问题，支持批量生成和自定义添加
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* 操作按钮 */}
            <div className="flex items-center space-x-3">
              <Button
                onClick={handleGenerateQuestions}
                disabled={loading || !data.questionTypes || data.questionTypes.length === 0}
                className="flex items-center space-x-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                <span>生成问题</span>
              </Button>
              
              <Button
                variant="outline"
                onClick={() => setShowAddForm(!showAddForm)}
                disabled={!data.questionTypes || data.questionTypes.length === 0}
              >
                <Plus className="h-4 w-4 mr-2" />
                手动添加问题
              </Button>
            </div>

            {/* 手动添加表单 */}
            {showAddForm && (
              <div className="p-4 border rounded-lg space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="newQuestion">问题内容</Label>
                  <Textarea
                    id="newQuestion"
                    placeholder="输入要添加的问题内容"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    onClick={handleAddQuestion}
                    disabled={!newQuestion.trim()}
                  >
                    添加问题
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setShowAddForm(false)
                      setNewQuestion('')
                    }}
                  >
                    取消
                  </Button>
                </div>
              </div>
            )}

            {/* 问题列表 */}
            {questions.length > 0 && (
              <div className="space-y-3">
                <Label>已添加的问题</Label>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {questions.map((question, index) => (
                    <div
                      key={question.id}
                      className="p-3 border rounded-lg flex items-start justify-between space-x-3"
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-sm font-medium text-muted-foreground">
                            {index + 1}.
                          </span>
                          {question.isGenerated && (
                            <Badge variant="secondary" className="text-xs">
                              自动生成
                            </Badge>
                          )}
                          {question.isCustom && (
                            <Badge variant="outline" className="text-xs">
                              手动添加
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm">{question.content}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteQuestion(question.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          上一步
        </Button>
        
        <Button
          onClick={handleNext}
          disabled={!validateForm()}
        >
          下一步
          <ChevronRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  )
}
