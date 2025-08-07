import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { useToast } from '@/hooks/use-toast'
import { 
  ArrowLeft, 
  Play, 
  Save, 
  CheckCircle,
  Circle
} from 'lucide-react'
import Step1Profile from './task-steps/Step1Profile'
import Step2Questions from './task-steps/Step2Questions'
import Step3Config from './task-steps/Step3Config'

// 步骤配置
const steps = [
  { id: 1, name: '用户画像和编程语言', description: '配置用户画像和编程语言' },
  { id: 2, name: '问题类型和生成问题', description: '选择问题类型并生成问题' },
  { id: 3, name: 'AI产品和系统设置', description: '选择AI产品并配置系统' }
]

export default function TaskConfig() {
  const navigate = useNavigate()
  const { toast } = useToast()
  
  // 步骤状态管理
  const [currentStep, setCurrentStep] = useState(1)
  const [stepData, setStepData] = useState({
    step1: {},
    step2: {},
    step3: {}
  })
  
  const [loading, setLoading] = useState(false)

  // 步骤导航函数
  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 步骤数据更新函数
  const handleStepDataChange = (stepId, data) => {
    console.log('handleStepDataChange=====>', data)
    setStepData(prev => ({
      ...prev,
      [`step${stepId}`]: data
    }))
  }

  // 任务提交函数
  const handleSubmit = async (finalData) => {
    setLoading(true)
    try {
      // 合并所有步骤的数据
      const completeTaskData = {
        ...stepData.step1,
        ...stepData.step2,
        ...stepData.step3,
        ...finalData
      }

      // 模拟API调用
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      toast({
        title: "任务创建成功",
        description: "任务已保存并开始执行",
      })

      // 重置表单
      setCurrentStep(1)
      setStepData({
        step1: {},
        step2: {},
        step3: {}
      })
    } catch (error) {
      toast({
        title: "任务创建失败",
        description: "请重试",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  // 渲染当前步骤
  const renderCurrentStep = () => {
    const currentStepData = stepData[`step${currentStep}`] || {}
    
    // 合并所有步骤的数据，确保后续步骤能访问之前的数据
    const mergedData = {
      ...stepData.step1,
      ...stepData.step2,
      ...stepData.step3,
      ...currentStepData
    }
    console.log('mergedData=====>', mergedData)
    switch (currentStep) {
      case 1:
        return (
          <Step1Profile
            data={currentStepData}
            onDataChange={(data) => handleStepDataChange(1, data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 2:
        return (
          <Step2Questions
            data={mergedData}
            onDataChange={(data) => handleStepDataChange(2, data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
          />
        )
      case 3:
        return (
          <Step3Config
            data={mergedData}
            onDataChange={(data) => handleStepDataChange(3, data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSubmit={handleSubmit}
          />
        )
      default:
        return null
    }
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>返回</span>
          </Button>
          <div>
            <h1 className="text-3xl font-bold">创建评测任务</h1>
            <p className="text-muted-foreground">通过三步配置创建AI编程产品评测任务</p>
          </div>
        </div>
      </div>

      {/* 步骤指示器 */}
      <Card className="mb-8">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className="flex items-center space-x-2">
                  <div className={`flex items-center justify-center w-8 h-8 rounded-full border-2 ${
                    currentStep > step.id 
                      ? 'bg-primary border-primary text-primary-foreground' 
                      : currentStep === step.id
                      ? 'border-primary text-primary'
                      : 'border-muted-foreground text-muted-foreground'
                  }`}>
                    {currentStep > step.id ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-medium">{step.id}</span>
                    )}
                  </div>
                  <div className="hidden md:block">
                    <p className={`text-sm font-medium ${
                      currentStep >= step.id ? 'text-foreground' : 'text-muted-foreground'
                    }`}>
                      {step.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 mx-4 ${
                    currentStep > step.id ? 'bg-primary' : 'bg-muted'
                  }`} />
                )}
              </div>
            ))}
          </div>
          
          {/* 进度条 */}
          <div className="mt-6">
            <Progress value={(currentStep / steps.length) * 100} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              步骤 {currentStep} / {steps.length}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 当前步骤内容 */}
      <div className="min-h-[600px]">
        {renderCurrentStep()}
      </div>
    </div>
  )
}

