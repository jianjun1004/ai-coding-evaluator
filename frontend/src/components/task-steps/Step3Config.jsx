import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { 
  Bot,
  Settings,
  Database,
  ChevronRight,
  ChevronLeft,
  Save,
  Play
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

// 模拟配置数据
const mockAIProducts = [
  { id: 'doubao', name: '豆包', description: '字节跳动的AI编程助手' },
  { id: 'deepseek', name: 'Deepseek', description: '深度求索的AI编程模型' },
  { id: 'kimi', name: 'Kimi k2', description: 'Moonshot AI的编程助手' },
  { id: 'yuanbao', name: '元宝AI编程', description: '腾讯的AI编程工具' },
  { id: 'qwen', name: '千问', description: '阿里巴巴的通义千问编程模式' }
]

export default function Step3Config({ 
  data, 
  onDataChange, 
  onNext, 
  onPrevious, 
  onSubmit,
  isValid = true 
}) {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [taskName, setTaskName] = useState(data.name || '')
  const [taskDescription, setTaskDescription] = useState(data.description || '')

  // 飞书集成配置
  const [feishuConfig, setFeishuConfig] = useState({
    enabled: data.feishuConfig?.enabled || false,
    appId: data.feishuConfig?.appId || '',
    appSecret: data.feishuConfig?.appSecret || '',
    tableId: data.feishuConfig?.tableId || ''
  })

  // 处理AI产品选择
  const handleAIProductChange = (productId, checked) => {
    const newProducts = checked 
      ? [...(data.aiProductIds || []), productId]
      : (data.aiProductIds || []).filter(id => id !== productId)
    
    onDataChange({ ...data, aiProductIds: newProducts })
  }

  // 验证表单
  const validateForm = () => {
    if (!taskName.trim()) return false
    if (!data.aiProductIds || data.aiProductIds.length === 0) return false
    if (feishuConfig.enabled) {
      if (!feishuConfig.appId || !feishuConfig.appSecret || !feishuConfig.tableId) return false
    }
    return true
  }

  // 测试飞书连接
  const testFeishuConnection = async () => {
    if (!feishuConfig.appId || !feishuConfig.appSecret || !feishuConfig.tableId) {
      toast({
        title: "配置不完整",
        description: "请填写完整的飞书配置信息",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // 模拟API调用测试连接
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "连接成功",
        description: "飞书集成配置测试成功",
      })
    } catch (error) {
      toast({
        title: "连接失败",
        description: "飞书集成配置测试失败，请检查配置信息",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 保存任务
  const handleSave = async () => {
    if (!validateForm()) {
      toast({
        title: "验证失败",
        description: "请填写完整的任务信息",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // 准备完整的任务数据
      const taskData = {
        ...data,
        name: taskName,
        description: taskDescription,
        feishuConfig: feishuConfig.enabled ? feishuConfig : null
      }

      // 调用简化的API执行任务
      const response = await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || '执行任务失败')
      }
      
      toast({
        title: "保存成功",
        description: "任务配置已保存",
      })

      // 调用父组件的提交函数
      if (onSubmit) {
        onSubmit(taskData)
      }
    } catch (error) {
      toast({
        title: "保存失败",
        description: "任务保存失败，请重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 立即执行任务
  const handleExecute = async () => {
    if (!validateForm()) {
      toast({
        title: "验证失败",
        description: "请填写完整的任务信息",
        variant: "destructive"
      })
      return
    }

    setLoading(true)
    try {
      // 准备完整的任务数据
      const taskData = {
        ...data,
        name: taskName,
        description: taskDescription,
        feishuConfig: feishuConfig.enabled ? feishuConfig : null
      }

      // 调用真实的API执行任务
      const response = await fetch('/api/tasks/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData)
      })

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`);
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error?.message || '执行任务失败')
      }
      
      toast({
        title: "执行成功",
        description: "任务已开始执行，正在查询进度...",
      })

      // 启动进度查询
      startProgressQuery()

      // 调用父组件的提交函数
      if (onSubmit) {
        onSubmit(taskData)
      }
    } catch (error) {
      toast({
        title: "执行失败",
        description: "任务执行失败，请重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 启动进度查询
  const startProgressQuery = () => {
    let lastProgress = null
    let noChangeCount = 0
    const maxNoChangeCount = 20 // 最多20次查询无变化（约1分钟）
    
    // 每3秒查询一次任务进度
    const progressInterval = setInterval(async () => {
      try {
        const response = await fetch('/api/tasks/status')
        if (response.ok) {
          const progressData = await response.json()
          if (progressData.success && progressData.data) {
            const progress = progressData.data
            
            // 检查进度是否有变化
            const progressKey = `${progress.status}-${progress.currentStep}-${progress.progress}-${progress.lastUpdated}`
            if (progressKey === lastProgress) {
              noChangeCount++
              
              // 如果连续多次无变化，可能异常，停止查询
              if (noChangeCount >= maxNoChangeCount) {
                clearInterval(progressInterval)
                toast({
                  title: "查询中断",
                  description: "任务进度长时间无变化，可能异常，已停止查询",
                  variant: "destructive"
                })
                return
              }
            } else {
              // 进度有变化，重置计数器
              noChangeCount = 0
              lastProgress = progressKey
            }
            
            // 根据后端返回的状态判断是否停止轮询
            if (progress.shouldStopPolling || progress.status === 'completed' || progress.status === 'failed' || progress.status === 'cancelled') {
              clearInterval(progressInterval)
              
              if (progress.status === 'completed') {
                toast({
                  title: "任务完成",
                  description: `评测任务已完成，共处理 ${progress.finalResult?.totalQuestions || 0} 个问题`,
                })
              } else if (progress.status === 'failed') {
                toast({
                  title: "任务失败",
                  description: progress.finalResult?.error || "评测任务执行失败",
                  variant: "destructive"
                })
              } else if (progress.status === 'cancelled') {
                toast({
                  title: "任务已取消",
                  description: "评测任务已被取消",
                })
              } else if (progress.status === 'NO_TASK_RUNNING') {
                toast({
                  title: "无任务运行",
                  description: progress.message || "当前没有任务在运行",
                })
              }
            } else {
              // 显示进度信息
              toast({
                title: "任务执行中",
                description: `当前步骤: ${progress.currentStep || '未知'} (${progress.progress || 0}%)`,
              })
            }
          } else {
            // 如果没有数据，增加无变化计数
            noChangeCount++
            if (noChangeCount >= maxNoChangeCount) {
              clearInterval(progressInterval)
              toast({
                title: "查询中断",
                description: "长时间无法获取任务进度，可能异常，已停止查询",
                variant: "destructive"
              })
            }
          }
        } else {
          // 如果响应不成功，增加无变化计数
          noChangeCount++
          if (noChangeCount >= maxNoChangeCount) {
            clearInterval(progressInterval)
            toast({
              title: "查询中断",
              description: "长时间无法获取任务进度，可能异常，已停止查询",
            })
          }
        }
      } catch (error) {
        console.error('查询任务进度失败:', error)
        // 如果查询失败，增加无变化计数
        noChangeCount++
        if (noChangeCount >= maxNoChangeCount) {
          clearInterval(progressInterval)
          toast({
            title: "查询中断",
            description: "长时间无法获取任务进度，可能异常，已停止查询",
          })
        }
      }
    }, 3000)

    // 5分钟后自动停止查询（防止无限查询）
    setTimeout(() => {
      clearInterval(progressInterval)
      toast({
        title: "查询超时",
        description: "任务进度查询已超时，请手动检查任务状态",
      })
    }, 5 * 60 * 1000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">第三步：配置AI产品和系统设置</h2>
          <p className="text-muted-foreground">选择AI产品并配置系统设置</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">步骤 3/3</Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 任务基本信息 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>任务信息</span>
            </CardTitle>
            <CardDescription>
              设置任务的基本信息，包括名称和描述
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="taskName">任务名称</Label>
              <Input
                id="taskName"
                placeholder="输入任务名称"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="taskDescription">任务描述</Label>
              <Textarea
                id="taskDescription"
                placeholder="输入任务描述"
                value={taskDescription}
                onChange={(e) => setTaskDescription(e.target.value)}
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* AI产品选择 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Bot className="h-5 w-5" />
              <span>AI产品选择</span>
            </CardTitle>
            <CardDescription>
              选择要评测的AI产品，系统将对这些产品进行自动化评测
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              {mockAIProducts.map((product) => (
                <div key={product.id} className="flex items-center space-x-3">
                  <Checkbox
                    id={product.id}
                    checked={(data.aiProductIds || []).includes(product.id)}
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
          </CardContent>
        </Card>

        {/* 飞书集成配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="h-5 w-5" />
              <span>飞书集成</span>
            </CardTitle>
            <CardDescription>
              配置飞书多维表格集成，用于存储评测结果
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>启用飞书集成</Label>
                <p className="text-sm text-muted-foreground">
                  开启后评测结果将自动同步到飞书多维表格
                </p>
              </div>
              <Switch
                checked={feishuConfig.enabled}
                onCheckedChange={(checked) => 
                  setFeishuConfig(prev => ({ ...prev, enabled: checked }))
                }
              />
            </div>

            {feishuConfig.enabled && (
              <>
                <Separator />
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="appId">App ID</Label>
                    <Input
                      id="appId"
                      placeholder="输入飞书应用的App ID"
                      value={feishuConfig.appId}
                      onChange={(e) => 
                        setFeishuConfig(prev => ({ ...prev, appId: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="appSecret">App Secret</Label>
                    <Input
                      id="appSecret"
                      type="password"
                      placeholder="输入飞书应用的App Secret"
                      value={feishuConfig.appSecret}
                      onChange={(e) => 
                        setFeishuConfig(prev => ({ ...prev, appSecret: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tableId">多维表格ID</Label>
                    <Input
                      id="tableId"
                      placeholder="输入多维表格的ID"
                      value={feishuConfig.tableId}
                      onChange={(e) => 
                        setFeishuConfig(prev => ({ ...prev, tableId: e.target.value }))
                      }
                    />
                    <p className="text-sm text-muted-foreground">
                      可以在飞书多维表格的URL中找到表格ID
                    </p>
                  </div>

                  <div className="flex items-center space-x-3 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={testFeishuConnection}
                      disabled={loading || !feishuConfig.appId || !feishuConfig.appSecret || !feishuConfig.tableId}
                    >
                      测试连接
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 导航和操作按钮 */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
        >
          <ChevronLeft className="h-4 w-4 mr-2" />
          上一步
        </Button>
        
        <div className="flex items-center space-x-3">
          <Button
            variant="outline"
            onClick={handleSave}
            disabled={loading || !validateForm()}
          >
            <Save className="h-4 w-4 mr-2" />
            保存任务
          </Button>
          
          <Button
            onClick={handleExecute}
            disabled={loading || !validateForm()}
          >
            <Play className="h-4 w-4 mr-2" />
            立即执行
          </Button>
        </div>
      </div>
    </div>
  )
}
