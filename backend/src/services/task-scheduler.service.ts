import { v4 as uuidv4 } from 'uuid';
import * as cron from 'node-cron';
import { 
  EvaluationTask, 
  EvaluationSession, 
  Question, 
  AIResponse, 
  ScoringResult, 
  TaskStatus, 
  SessionStatus,
  QuestionType,
  FeishuRecord
} from '../models';
import { QuestionGeneratorService } from './question-generator.service';
import { BrowserAutomationService } from './browser-automation.service';
import { ScoringEngineService } from './scoring-engine.service';
import { FeishuIntegrationService } from './feishu-integration.service';
import { MemoryStorageService } from './memory-storage.service';
import { AI_PRODUCTS } from '../config/ai-products';
import { log } from '../utils/logger';

export interface TaskResult {
  taskId: string;
  status: TaskStatus;
  sessions: EvaluationSession[];
  totalQuestions: number;
  totalResponses: number;
  averageScore: number;
  duration: number;
  error?: string;
}

export interface TaskProgress {
  taskId: string;
  currentStep: string;
  completedSteps: number;
  totalSteps: number;
  progress: number;
  estimatedTimeRemaining?: number;
  // 新增字段：任务完成状态管理
  isCompleted: boolean;
  completionTime?: Date;
  finalResult?: {
    status: TaskStatus;
    totalQuestions: number;
    totalResponses: number;
    averageScore: number;
    duration: number;
    error?: string;
  };
  lastUpdated: Date;
}

export class TaskSchedulerService {
  private questionGenerator: QuestionGeneratorService;
  private browserAutomation: BrowserAutomationService;
  private scoringEngine: ScoringEngineService;
  private feishuIntegration: FeishuIntegrationService | null = null;
  private memoryStorage: MemoryStorageService;
  
  private runningTasks: Map<string, TaskProgress> = new Map();
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private maxConcurrentTasks: number = 3;

  constructor(feishuConfig?: any) {
    this.questionGenerator = new QuestionGeneratorService();
    this.browserAutomation = new BrowserAutomationService();
    this.scoringEngine = new ScoringEngineService();
    this.memoryStorage = MemoryStorageService.getInstance();
    
    if (feishuConfig) {
      this.feishuIntegration = new FeishuIntegrationService(feishuConfig);
    }
  }

  /**
   * 执行评测任务
   */
  async executeEvaluationTask(task: EvaluationTask): Promise<TaskResult> {
    const startTime = Date.now();
    
    try {
      // 调试日志
      log.info('开始执行评测任务', {
        taskId: task.id,
        taskName: task.name,
        hasAiProducts: !!task.aiProducts,
        aiProductsType: typeof task.aiProducts,
        aiProductsLength: task.aiProducts?.length,
        hasQuestionTypes: !!task.questionTypes,
        questionTypesType: typeof task.questionTypes,
        questionTypesLength: task.questionTypes?.length,
        hasUserProfile: !!task.userProfile,
        hasProgrammingLanguage: !!task.programmingLanguage
      });
      
      // 验证任务参数
      if (!task.aiProducts || !Array.isArray(task.aiProducts) || task.aiProducts.length === 0) {
        throw new Error('Task must have valid aiProducts array with at least one product');
      }
      
      if (!task.questionTypes || !Array.isArray(task.questionTypes) || task.questionTypes.length === 0) {
        throw new Error('Task must have valid questionTypes array with at least one type');
      }
      
      if (!task.userProfile || !task.programmingLanguage) {
        throw new Error('Task must have valid userProfile and programmingLanguage');
      }
      
      // 检查并发限制
      if (this.runningTasks.size >= this.maxConcurrentTasks) {
        throw new Error('Maximum concurrent tasks limit reached');
      }

      // 更新任务状态
      await this.updateTaskStatus(task.id, TaskStatus.RUNNING);
      
      // 初始化进度跟踪
      const totalSteps = this.calculateTotalSteps(task);
      const progressObject = {
        taskId: task.id,
        currentStep: '初始化任务',
        completedSteps: 0,
        totalSteps,
        progress: 0,
        isCompleted: false,
        lastUpdated: new Date()
      };
      
      this.runningTasks.set(task.id, progressObject);
      
      // 添加任务添加到runningTasks的调试日志
      log.info('任务已添加到运行任务列表', {
        taskId: task.id,
        totalSteps,
        runningTasksSize: this.runningTasks.size,
        progressObject
      });

      log.info('开始评测任务', {
        taskId: task.id,
        aiProducts: task.aiProducts.length,
        questionTypes: task.questionTypes.length
      });

      // 执行评测流程
      const sessions = await this.executeEvaluationFlow(task);
      
      // 计算统计信息
      const stats = this.calculateTaskStatistics(sessions);
      
      // 更新任务状态
      await this.updateTaskStatus(task.id, TaskStatus.COMPLETED);
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      const result: TaskResult = {
        taskId: task.id,
        status: TaskStatus.COMPLETED,
        sessions,
        totalQuestions: stats.totalQuestions,
        totalResponses: stats.totalResponses,
        averageScore: stats.averageScore,
        duration
      };

      // 保存任务完成状态到进度跟踪中
      const progress = this.runningTasks.get(task.id);
      if (progress) {
        progress.isCompleted = true;
        progress.completionTime = new Date();
        progress.finalResult = {
          status: TaskStatus.COMPLETED,
          totalQuestions: stats.totalQuestions,
          totalResponses: stats.totalResponses,
          averageScore: stats.averageScore,
          duration
        };
        progress.lastUpdated = new Date();
      }

      log.info('评测任务成功完成', {
        taskId: task.id,
        duration,
        totalQuestions: stats.totalQuestions,
        averageScore: stats.averageScore
      });

      return result;
    } catch (error: any) {
      log.error('Evaluation task failed', { taskId: task.id, error: error?.message || 'Unknown error' });
      
      await this.updateTaskStatus(task.id, TaskStatus.FAILED);
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      // 保存任务失败状态到进度跟踪中
      const progress = this.runningTasks.get(task.id);
      if (progress) {
        progress.isCompleted = true;
        progress.completionTime = new Date();
        progress.finalResult = {
          status: TaskStatus.FAILED,
          totalQuestions: 0,
          totalResponses: 0,
          averageScore: 0,
          duration,
          error: error?.message || 'Unknown error'
        };
        progress.lastUpdated = new Date();
      }

      return {
        taskId: task.id,
        status: TaskStatus.FAILED,
        sessions: [],
        totalQuestions: 0,
        totalResponses: 0,
        averageScore: 0,
        duration,
        error: error?.message || 'Unknown error'
      };
    } finally {
      // 如果任务异常退出且没有设置完成状态，则标记为失败
      const progress = this.runningTasks.get(task.id);
      if (progress && !progress.isCompleted) {
        progress.isCompleted = true;
        progress.completionTime = new Date();
        progress.finalResult = {
          status: TaskStatus.FAILED,
          totalQuestions: 0,
          totalResponses: 0,
          averageScore: 0,
          duration: 0,
          error: 'Task execution was interrupted'
        };
        progress.lastUpdated = new Date();
      }
      
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * 执行评测流程
   */
  private async executeEvaluationFlow(task: EvaluationTask): Promise<EvaluationSession[]> {
    const sessions: EvaluationSession[] = [];

    // 再次验证数组（双重保险）
    if (!task.aiProducts || !Array.isArray(task.aiProducts) || task.aiProducts.length === 0) {
      throw new Error('Invalid aiProducts array in executeEvaluationFlow');
    }
    
    if (!task.questionTypes || !Array.isArray(task.questionTypes) || task.questionTypes.length === 0) {
      throw new Error('Invalid questionTypes array in executeEvaluationFlow');
    }

    // 为每个AI产品创建评测会话
    for (const product of task.aiProducts) {
      try {
        this.updateProgress(task.id, `正在评测 ${product.name}`);
        
        const session = await this.createEvaluationSession(task, product);
        sessions.push(session);
        
        // 为每种问题类型生成问题
        for (const questionType of task.questionTypes) {
          await this.processQuestionType(session, questionType, task);
        }
        
        // 更新会话状态
        session.status = SessionStatus.COMPLETED;
        session.endTime = new Date();
        
        await this.saveSession(session);
        
      } catch (error: any) {
        log.error('Failed to process AI product', {
          taskId: task.id,
          productId: product.id,
          error: error?.message || 'Unknown error'
        });
      }
    }

    return sessions;
  }

  /**
   * 处理特定问题类型
   */
  private async processQuestionType(
    session: EvaluationSession,
    questionType: string,
    task: EvaluationTask
  ): Promise<void> {
    try {
      let questions: Question[] = [];
      
      // 添加调试日志，查看问题类型匹配过程
      log.info('处理问题类型', {
        sessionId: session.id,
        questionType,
        totalQuestions: task.questions?.length || 0,
        availableQuestionTypes: task.questions?.map(q => q.type) || [],
        taskQuestionTypes: task.questionTypes || []
      });
      
      // 优先使用用户提供的问题内容
      if (task.questions && task.questions.length > 0) {
        // 改进问题类型匹配逻辑：支持多种匹配方式
        questions = task.questions.filter(q => {
          // 完全匹配
          if (q.type === questionType) {
            return true;
          }
          
          // 部分匹配：检查问题类型是否包含当前类型的关键词
          if (typeof q.type === 'string' && typeof questionType === 'string') {
            const questionTypeLower = questionType.toLowerCase();
            const qTypeLower = q.type.toLowerCase();
            
            // 检查是否包含关键词匹配
            if (qTypeLower.includes(questionTypeLower) || questionTypeLower.includes(qTypeLower)) {
              return true;
            }
            
            // 特殊映射匹配
            const typeMapping: { [key: string]: string[] } = {
              'learning': ['学习编程', '学习', '基础'],
              'project': ['项目开发', '项目', '开发'],
              'debugging': ['调试问题', '调试', '错误'],
              'best_practices': ['最佳实践', '规范', '实践'],
              'performance': ['性能优化', '性能', '优化']
            };
            
            // 检查映射匹配
            for (const [key, values] of Object.entries(typeMapping)) {
              if (key === questionType && values.some(v => qTypeLower.includes(v))) {
                return true;
              }
            }
            
            // 新增：手动添加问题的特殊处理
            // 将"手动添加"类型的问题映射到"编程问题"类型
            if (q.type === '手动添加' && questionType === '编程问题') {
              return true;
            }
            
            // 新增：反向映射，支持多种问题类型
            const reverseTypeMapping: { [key: string]: string[] } = {
              '编程问题': ['手动添加', '编程', '代码', '开发'],
              '学习编程': ['学习', '基础', '入门'],
              '项目开发': ['项目', '开发', '实践'],
              '调试问题': ['调试', '错误', '问题解决'],
              '最佳实践': ['规范', '实践', '标准'],
              '性能优化': ['性能', '优化', '效率']
            };
            
            // 检查反向映射匹配
            for (const [key, values] of Object.entries(reverseTypeMapping)) {
              if (key === questionType && values.some(v => qTypeLower.includes(v))) {
                return true;
              }
            }
          }
          
          return false;
        });
        
        log.info('问题类型匹配结果', {
          sessionId: session.id,
          questionType,
          matchedQuestionsCount: questions.length,
          matchedQuestions: questions.map(q => ({ id: q.id, type: q.type, content: q.content.substring(0, 50) + '...' })),
          // 新增：详细的匹配过程日志
          matchingDetails: {
            totalAvailableQuestions: task.questions?.length || 0,
            availableQuestionTypes: task.questions?.map(q => q.type) || [],
            appliedMappings: questions.length > 0 ? 'Successfully applied type mappings' : 'No mappings applied'
          }
        });
      }
      
      // 如果没有用户提供的问题，记录详细信息并尝试生成问题
      if (questions.length === 0) {
        log.warn('No questions matched for question type', {
          sessionId: session.id,
          questionType,
          availableQuestions: task.questions?.map(q => ({ type: q.type, content: q.content.substring(0, 50) + '...' })) || [],
          taskQuestionTypes: task.questionTypes || []
        });
        
                 // 尝试生成问题而不是直接返回
         try {
           log.info('尝试为类型生成问题', { questionType });
           const generatedQuestions = await this.questionGenerator.generateQuestionBatch(
             task.userProfile,
             task.programmingLanguage,
             [questionType]
           );
          
          if (generatedQuestions && generatedQuestions.length > 0) {
            questions = generatedQuestions;
            log.info('问题生成成功', {
              sessionId: session.id,
              questionType,
              generatedCount: questions.length
            });
          } else {
            log.warn('Failed to generate questions, skipping question type', { questionType });
            return;
          }
        } catch (genError: any) {
          log.error('Failed to generate questions', {
            sessionId: session.id,
            questionType,
            error: genError?.message || 'Unknown error'
          });
          return;
        }
      }
      
      // 处理问题数组
      for (const question of questions) {
        session.questions.push(question);
        
        // 获取AI回答
        const product = AI_PRODUCTS.find(p => p.id === session.productId);
        if (!product) {
          throw new Error(`Product not found: ${session.productId}`);
        }
        
        const response = await this.browserAutomation.interactWithAIProduct(
          product,
          question.content
        );
        
        response.questionId = question.id;
        session.responses.push(response);
        
        // 处理追问
        await this.handleFollowUps(session, question, response, task);
        
        // 评分
        const scoringResult = await this.scoringEngine.scoreResponse(
          question.content,
          response.content,
          {
            userProfile: task.userProfile,
            programmingLanguage: task.programmingLanguage,
            questionType: questionType,
            originalQuestion: question.content
          }
        );
        
        scoringResult.responseId = response.id;
        session.scores.push(scoringResult);
        
        // 保存到飞书
        if (this.feishuIntegration) {
          await this.saveToFeishu(session, question, response, scoringResult, task);
        }
      }
      
    } catch (error: any) {
      log.error('Failed to process question type', {
        sessionId: session.id,
        questionType,
        error: error?.message || 'Unknown error'
      });
    }
  }

  /**
   * 处理追问
   */
  private async handleFollowUps(
    session: EvaluationSession,
    originalQuestion: Question,
    originalResponse: AIResponse,
    task: EvaluationTask
  ): Promise<void> {
    let followUpCount = 0;
    let currentResponse = originalResponse;
    
    while (followUpCount < task.maxFollowUps) {
      try {
        // 生成追问
        const followUpQuestion = await this.questionGenerator.generateFollowUp(
          originalQuestion.content,
          currentResponse.content,
          followUpCount,
          {
            userProfile: task.userProfile.name,
            programmingLanguage: task.programmingLanguage.name,
            previousResponses: [currentResponse.content]
          }
        );
        
        if (!followUpQuestion) {
          break; // 不需要追问
        }
        
        followUpQuestion.parentQuestionId = originalQuestion.id;
        session.questions.push(followUpQuestion);
        
        // 获取追问回答
        const product = AI_PRODUCTS.find(p => p.id === session.productId);
        if (!product) break;
        
        const followUpResponse = await this.browserAutomation.interactWithAIProduct(
          product,
          followUpQuestion.content
        );
        
        followUpResponse.questionId = followUpQuestion.id;
        session.responses.push(followUpResponse);
        
        // 评分追问回答
        const followUpScore = await this.scoringEngine.scoreResponse(
          followUpQuestion.content,
          followUpResponse.content,
          {
            userProfile: task.userProfile,
            programmingLanguage: task.programmingLanguage,
            questionType: followUpQuestion.type,
            originalQuestion: originalQuestion.content
          }
        );
        
        followUpScore.responseId = followUpResponse.id;
        session.scores.push(followUpScore);
        
        // 保存追问到飞书
        if (this.feishuIntegration) {
          await this.saveToFeishu(session, followUpQuestion, followUpResponse, followUpScore, task);
        }
        
        currentResponse = followUpResponse;
        followUpCount++;
        
      } catch (error: any) {
        log.error('Failed to handle follow-up', {
          sessionId: session.id,
          followUpCount,
          error: error?.message || 'Unknown error'
        });
        break;
      }
    }
  }

  /**
   * 保存到飞书
   */
  private async saveToFeishu(
    session: EvaluationSession,
    question: Question,
    response: AIResponse,
    score: ScoringResult,
    task: EvaluationTask
  ): Promise<void> {
    if (!this.feishuIntegration) return;
    
    try {
      const product = AI_PRODUCTS.find(p => p.id === session.productId);
      if (!product) return;
      
      const record: FeishuRecord = {
        evaluationId: task.id,
        sessionId: session.id,
        productName: product.name,
        productUrl: product.url,
        modelName: product.modelConfig.defaultModel,
        userProfile: task.userProfile.name,
        programmingLanguage: task.programmingLanguage.name,
        questionType: question.type,
        originalQuestion: question.followUpLevel === 0 ? question.content : 
          session.questions.find(q => q.id === question.parentQuestionId)?.content || '',
        followUpCount: question.followUpLevel,
        followUpContent: question.followUpLevel > 0 ? question.content : undefined,
        aiResponse: response.content,
        responseScreenshot: response.screenshot,
        score: score.score,
        scoringReason: score.reasoning,
        questionTime: question.createdAt,
        responseTime: response.timestamp,
        duration: response.duration
      };
      
      await this.feishuIntegration.writeEvaluationRecord(record);
      
    } catch (error: any) {
      log.error('Failed to save to Feishu', {
        sessionId: session.id,
        questionId: question.id,
        error: error?.message || 'Unknown error'
      });
    }
  }

  /**
   * 创建评测会话
   */
  private async createEvaluationSession(
    task: EvaluationTask,
    product: any
  ): Promise<EvaluationSession> {
    const session: EvaluationSession = {
      id: uuidv4(),
      taskId: task.id,
      productId: product.id,
      userProfile: task.userProfile,
      programmingLanguage: task.programmingLanguage,
      questions: [],
      responses: [],
      scores: [],
      status: SessionStatus.RUNNING,
      startTime: new Date()
    };
    
    await this.saveSession(session);
    return session;
  }

  /**
   * 保存会话
   */
  private async saveSession(session: EvaluationSession): Promise<void> {
    try {
      await this.memoryStorage.createSession(session);
    } catch (error) {
      log.error('Failed to save session', { sessionId: session.id, error });
    }
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    try {
      await this.memoryStorage.updateTask(taskId, { status });
    } catch (error) {
      log.error('Failed to update task status', { taskId, status, error });
    }
  }

  /**
   * 更新进度
   */
  private updateProgress(taskId: string, currentStep: string): void {
    const progress = this.runningTasks.get(taskId);
    if (progress) {
      progress.currentStep = currentStep;
      progress.completedSteps++;
      progress.progress = Math.round((progress.completedSteps / progress.totalSteps) * 100);
      progress.lastUpdated = new Date();
    }
  }

  /**
   * 计算总步骤数
   */
  private calculateTotalSteps(task: EvaluationTask): number {
    // 安全检查
    if (!task.aiProducts || !Array.isArray(task.aiProducts) || task.aiProducts.length === 0) {
      return 0;
    }
    
    if (!task.questionTypes || !Array.isArray(task.questionTypes) || task.questionTypes.length === 0) {
      return 0;
    }
    
    // 每个AI产品 * 每种问题类型 * (1个初始问题 + 最多3个追问) + 评分步骤
    return task.aiProducts.length * task.questionTypes.length * (1 + task.maxFollowUps + 1);
  }

  /**
   * 计算任务统计信息
   */
  private calculateTaskStatistics(sessions: EvaluationSession[]): {
    totalQuestions: number;
    totalResponses: number;
    averageScore: number;
  } {
    let totalQuestions = 0;
    let totalResponses = 0;
    let totalScore = 0;
    let scoreCount = 0;
    
    for (const session of sessions) {
      totalQuestions += session.questions.length;
      totalResponses += session.responses.length;
      
      for (const score of session.scores) {
        totalScore += score.score;
        scoreCount++;
      }
    }
    
    return {
      totalQuestions,
      totalResponses,
      averageScore: scoreCount > 0 ? Math.round((totalScore / scoreCount) * 100) / 100 : 0
    };
  }

  /**
   * 获取任务进度
   */
  getTaskProgress(taskId: string): TaskProgress | null {
    // 添加调试日志
         log.info('在TaskSchedulerService中调用getTaskProgress', {
      taskId,
      runningTasksSize: this.runningTasks.size,
      runningTasksKeys: Array.from(this.runningTasks.keys())
    });
    
    const progress = this.runningTasks.get(taskId);
    if (progress) {
             log.info('找到任务进度', { taskId, progress });
      return progress;
    }
    
    // 如果任务不在运行中，尝试从内存存储中获取已完成的任务信息
    // 这里可以扩展为从持久化存储中查询历史任务状态
    // 目前返回null，表示任务不存在或已完成
         log.info('未找到任务进度', { taskId });
    return null;
  }

  /**
   * 获取所有任务状态（包括已完成的）
   */
  getAllTaskStatuses(): TaskProgress[] {
    return Array.from(this.runningTasks.values());
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      await this.updateTaskStatus(taskId, TaskStatus.CANCELLED);
      
      // 保存任务取消状态到进度跟踪中
      const progress = this.runningTasks.get(taskId);
      if (progress) {
        progress.isCompleted = true;
        progress.completionTime = new Date();
        progress.finalResult = {
          status: TaskStatus.CANCELLED,
          totalQuestions: 0,
          totalResponses: 0,
          averageScore: 0,
          duration: 0
        };
        progress.lastUpdated = new Date();
      }
      
      this.runningTasks.delete(taskId);
      
             log.info('任务已取消', { taskId });
    } catch (error) {
      log.error('Failed to cancel task', { taskId, error });
      throw error;
    }
  }

  /**
   * 调度定时任务
   */
  scheduleTask(taskId: string, cronExpression: string, task: EvaluationTask): void {
    try {
      const scheduledTask = cron.schedule(cronExpression, async () => {
                 log.info('执行定时任务', { taskId, cronExpression });
        await this.executeEvaluationTask(task);
      });
      
      this.scheduledTasks.set(taskId, scheduledTask);
      
             log.info('任务调度成功', { taskId, cronExpression });
    } catch (error: any) {
      log.error('Failed to schedule task', { taskId, cronExpression, error: error?.message || 'Unknown error' });
      throw error;
    }
  }

  /**
   * 取消定时任务
   */
  unscheduleTask(taskId: string): void {
    const scheduledTask = this.scheduledTasks.get(taskId);
    if (scheduledTask) {
      scheduledTask.stop();
      this.scheduledTasks.delete(taskId);
             log.info('定时任务已取消', { taskId });
    }
  }

  /**
   * 获取运行中的任务列表
   */
  getRunningTasks(): TaskProgress[] {
    return Array.from(this.runningTasks.values());
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    // 停止所有定时任务
    for (const [taskId, scheduledTask] of this.scheduledTasks) {
      scheduledTask.stop();
    }
    this.scheduledTasks.clear();
    
    // 清理浏览器资源
    await this.browserAutomation.cleanup();
    
         log.info('任务调度器清理完成');
  }
}

