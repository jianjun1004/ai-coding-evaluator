import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/hooks/use-toast'
import { 
  Settings as SettingsIcon, 
  Database, 
  Bot, 
  Bell, 
  Shield,
  TestTube,
  Save,
  RefreshCw
} from 'lucide-react'

export default function Settings() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  
  const [feishuConfig, setFeishuConfig] = useState({
    appId: '',
    appSecret: '',
    tableId: '',
    enabled: true
  })
  
  const [systemConfig, setSystemConfig] = useState({
    maxConcurrentTasks: 3,
    defaultTimeout: 30,
    enableScreenshots: true,
    enableDetailedLogs: true,
    autoRetry: true,
    maxRetries: 3
  })
  
  const [notificationConfig, setNotificationConfig] = useState({
    emailNotifications: true,
    taskCompletion: true,
    taskFailure: true,
    systemAlerts: true
  })

  const handleSave = async (section) => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      toast({
        title: "设置已保存",
        description: `${section}配置已成功更新`
      })
    } catch (error) {
      toast({
        title: "保存失败",
        description: "保存设置时发生错误，请重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const testFeishuConnection = async () => {
    setLoading(true)
    try {
      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "连接测试成功",
        description: "飞书多维表格连接正常"
      })
    } catch (error) {
      toast({
        title: "连接测试失败",
        description: "无法连接到飞书多维表格，请检查配置",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">系统设置</h1>
        <p className="text-muted-foreground">配置AI编程产品评测系统的各项参数</p>
      </div>

      <Tabs defaultValue="feishu" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="feishu">飞书集成</TabsTrigger>
          <TabsTrigger value="system">系统配置</TabsTrigger>
          <TabsTrigger value="notifications">通知设置</TabsTrigger>
          <TabsTrigger value="security">安全设置</TabsTrigger>
        </TabsList>

        {/* 飞书集成设置 */}
        <TabsContent value="feishu">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="h-5 w-5" />
                <span>飞书多维表格集成</span>
              </CardTitle>
              <CardDescription>
                配置飞书多维表格的连接信息，用于存储评测结果
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
                      disabled={loading || !feishuConfig.appId || !feishuConfig.appSecret}
                    >
                      <TestTube className="h-4 w-4 mr-2" />
                      测试连接
                    </Button>
                    
                    <Button 
                      onClick={() => handleSave('飞书集成')}
                      disabled={loading}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      保存配置
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 系统配置 */}
        <TabsContent value="system">
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <SettingsIcon className="h-5 w-5" />
                  <span>任务执行配置</span>
                </CardTitle>
                <CardDescription>
                  配置任务执行的相关参数
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="maxConcurrentTasks">最大并发任务数</Label>
                  <Input
                    id="maxConcurrentTasks"
                    type="number"
                    min="1"
                    max="10"
                    value={systemConfig.maxConcurrentTasks}
                    onChange={(e) => 
                      setSystemConfig(prev => ({ 
                        ...prev, 
                        maxConcurrentTasks: parseInt(e.target.value) || 1 
                      }))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    同时运行的最大任务数量，建议不超过5个
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="defaultTimeout">默认超时时间（秒）</Label>
                  <Input
                    id="defaultTimeout"
                    type="number"
                    min="10"
                    max="300"
                    value={systemConfig.defaultTimeout}
                    onChange={(e) => 
                      setSystemConfig(prev => ({ 
                        ...prev, 
                        defaultTimeout: parseInt(e.target.value) || 30 
                      }))
                    }
                  />
                  <p className="text-sm text-muted-foreground">
                    等待AI回答的最大时间
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>启用截图功能</Label>
                      <p className="text-sm text-muted-foreground">
                        在评测过程中自动截图保存
                      </p>
                    </div>
                    <Switch
                      checked={systemConfig.enableScreenshots}
                      onCheckedChange={(checked) => 
                        setSystemConfig(prev => ({ ...prev, enableScreenshots: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>详细日志记录</Label>
                      <p className="text-sm text-muted-foreground">
                        记录详细的执行日志信息
                      </p>
                    </div>
                    <Switch
                      checked={systemConfig.enableDetailedLogs}
                      onCheckedChange={(checked) => 
                        setSystemConfig(prev => ({ ...prev, enableDetailedLogs: checked }))
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label>自动重试</Label>
                      <p className="text-sm text-muted-foreground">
                        失败时自动重试任务
                      </p>
                    </div>
                    <Switch
                      checked={systemConfig.autoRetry}
                      onCheckedChange={(checked) => 
                        setSystemConfig(prev => ({ ...prev, autoRetry: checked }))
                      }
                    />
                  </div>

                  {systemConfig.autoRetry && (
                    <div className="space-y-2 ml-4">
                      <Label htmlFor="maxRetries">最大重试次数</Label>
                      <Input
                        id="maxRetries"
                        type="number"
                        min="1"
                        max="5"
                        value={systemConfig.maxRetries}
                        onChange={(e) => 
                          setSystemConfig(prev => ({ 
                            ...prev, 
                            maxRetries: parseInt(e.target.value) || 1 
                          }))
                        }
                      />
                    </div>
                  )}
                </div>

                <div className="pt-4">
                  <Button 
                    onClick={() => handleSave('系统配置')}
                    disabled={loading}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    保存配置
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bot className="h-5 w-5" />
                  <span>AI产品状态</span>
                </CardTitle>
                <CardDescription>
                  查看各AI产品的连接状态
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {['豆包', 'Deepseek', 'Kimi k2', '元宝AI编程', '千问'].map((product) => (
                    <div key={product} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Bot className="h-5 w-5 text-muted-foreground" />
                        <span className="font-medium">{product}</span>
                      </div>
                      <Badge variant="secondary">正常</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* 通知设置 */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="h-5 w-5" />
                <span>通知设置</span>
              </CardTitle>
              <CardDescription>
                配置系统通知和提醒
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>邮件通知</Label>
                  <p className="text-sm text-muted-foreground">
                    启用邮件通知功能
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.emailNotifications}
                  onCheckedChange={(checked) => 
                    setNotificationConfig(prev => ({ ...prev, emailNotifications: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>任务完成通知</Label>
                  <p className="text-sm text-muted-foreground">
                    任务完成时发送通知
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.taskCompletion}
                  onCheckedChange={(checked) => 
                    setNotificationConfig(prev => ({ ...prev, taskCompletion: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>任务失败通知</Label>
                  <p className="text-sm text-muted-foreground">
                    任务失败时发送通知
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.taskFailure}
                  onCheckedChange={(checked) => 
                    setNotificationConfig(prev => ({ ...prev, taskFailure: checked }))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>系统警报</Label>
                  <p className="text-sm text-muted-foreground">
                    系统异常时发送警报
                  </p>
                </div>
                <Switch
                  checked={notificationConfig.systemAlerts}
                  onCheckedChange={(checked) => 
                    setNotificationConfig(prev => ({ ...prev, systemAlerts: checked }))
                  }
                />
              </div>

              <div className="pt-4">
                <Button 
                  onClick={() => handleSave('通知设置')}
                  disabled={loading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  保存配置
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 安全设置 */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>安全设置</span>
              </CardTitle>
              <CardDescription>
                系统安全和隐私配置
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>安全设置功能开发中...</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

