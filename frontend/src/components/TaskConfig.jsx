import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  ArrowLeft, 
  CheckCircle
} from 'lucide-react'
import Step1Combined from './task-steps/Step1Combined'
import Step3Config from './task-steps/Step3Config'

// 步骤配置
const steps = [
  { id: 1, name: '用户画像和问题', description: '配置用户画像、编程语言和问题' },
  { id: 2, name: 'AI产品配置', description: '选择AI产品并配置系统设置' }
]

export default function TaskConfig() {
  const navigate = useNavigate()
  
  // 步骤状态管理
  const [currentStep, setCurrentStep] = useState(1)
  const [stepData, setStepData] = useState({
    step1: {},
    step2: {}
  })

  // 步骤导航函数
  const handleNext = () => {
    if (currentStep < 2) {
      setCurrentStep(currentStep + 1)
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  // 跳转到步骤三（现在是步骤二）
  const handleSkipToStep3 = (stepData) => {
    // 更新步骤数据
    setStepData(prev => ({
      ...prev,
      step1: stepData
    }))
    // 直接跳转到步骤二
    setCurrentStep(2)
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
  const handleSubmit = async () => {
    console.log('任务提交:', stepData)
    // TODO: 实现任务提交逻辑
  }

  // 渲染当前步骤
  const renderCurrentStep = () => {
    const currentStepData = stepData[`step${currentStep}`] || {}
    
    // 合并所有步骤的数据，确保后续步骤能访问之前的数据
    const mergedData = {
      ...stepData.step1,
      ...stepData.step2,
      ...currentStepData
    }
    console.log('mergedData=====>', mergedData)
    switch (currentStep) {
      case 1:
        return (
          <Step1Combined
            data={currentStepData}
            onDataChange={(data) => handleStepDataChange(1, data)}
            onNext={handleNext}
            onPrevious={handlePrevious}
            onSkipToStep3={handleSkipToStep3}
          />
        )
      case 2:
        return (
          <Step3Config
            data={mergedData}
            onDataChange={(data) => handleStepDataChange(2, data)}
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
    <div className="min-h-screen p-8">
      {/* 顶部导航 */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold">创建评测任务</h1>
        <p className="text-muted-foreground">通过两步配置创建AI编程产品评测任务</p>
      </div>

      {/* 步骤指示器 */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          {steps.map((step) => (
            <Button
              key={step.id}
              variant={currentStep === step.id ? "default" : "outline"}
              size="sm"
              onClick={() => setCurrentStep(step.id)}
              className="flex items-center space-x-2"
            >
              <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 ${
                currentStep === step.id 
                  ? 'bg-primary-foreground border-primary-foreground text-primary' 
                  : 'border-muted-foreground text-muted-foreground'
              }`}>
                {currentStep === step.id ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <span className="text-xs font-medium">{step.id}</span>
                )}
              </div>
              <span className="text-sm font-medium">{step.name}</span>
            </Button>
          ))}
        </div>
        
        {/* 进度条 */}
        <div className="w-full max-w-md">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">进度</span>
            <span className="font-medium">{currentStep} / {steps.length}</span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>
      </div>

      {/* 当前步骤内容 */}
      <div className="min-h-[600px]">
        {renderCurrentStep()}
      </div>
    </div>
  )
}

