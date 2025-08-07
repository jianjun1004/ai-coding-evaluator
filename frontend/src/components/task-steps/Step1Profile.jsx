import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

import { Badge } from '@/components/ui/badge'

import { 
  Users, 
  Code, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react'

export default function Step1Profile({ 
  data, 
  onDataChange, 
  onNext, 
  onPrevious, 
  isValid = true 
}) {
  const [customUserProfile, setCustomUserProfile] = useState({
    name: data.customUserProfile?.name || ''
  })

  const [customProgrammingLanguage, setCustomProgrammingLanguage] = useState({
    name: data.customProgrammingLanguage?.name || ''
  })

  // 验证表单
  const validateForm = () => {
    if (!customUserProfile.name.trim()) return false
    if (!customProgrammingLanguage.name.trim()) return false
    return true
  }

  const handleNext = () => {
    if (!validateForm()) return

    // 准备数据
    const stepData = {
      customUserProfile: customUserProfile,
      customProgrammingLanguage: customProgrammingLanguage
    }

    onDataChange(stepData)
    onNext()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">第一步：配置用户画像和编程语言</h2>
          <p className="text-muted-foreground">自定义用户画像和编程语言配置</p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="secondary">步骤 1/3</Badge>
        </div>
      </div>

      <div className="grid gap-6">
        {/* 用户画像配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="h-5 w-5" />
              <span>用户画像</span>
            </CardTitle>
            <CardDescription>
              自定义用户画像，用于生成符合特定用户群体的编程问题
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customProfileName">画像名称</Label>
              <Input
                id="customProfileName"
                placeholder="输入用户画像名称，如：计算机专业学生、前端开发者等"
                value={customUserProfile.name}
                onChange={(e) => setCustomUserProfile(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>

        {/* 编程语言配置 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Code className="h-5 w-5" />
              <span>编程语言</span>
            </CardTitle>
            <CardDescription>
              自定义编程语言，用于生成特定语言的编程问题
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="customLanguageName">语言名称</Label>
              <Input
                id="customLanguageName"
                placeholder="输入编程语言名称，如：JavaScript、Python、Java等"
                value={customProgrammingLanguage.name}
                onChange={(e) => setCustomProgrammingLanguage(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 导航按钮 */}
      <div className="flex justify-between pt-6">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={true}
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
