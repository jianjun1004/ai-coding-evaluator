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
import { Database } from '../config/database';
import { AI_PRODUCTS, getUserProfiles, getProgrammingLanguages } from '../config/ai-products';
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
}

export class TaskSchedulerService {
  private questionGenerator: QuestionGeneratorService;
  private browserAutomation: BrowserAutomationService;
  private scoringEngine: ScoringEngineService;
  private feishuIntegration: FeishuIntegrationService | null = null;
  private database: Database;
  
  private runningTasks: Map<string, TaskProgress> = new Map();
  private scheduledTasks: Map<string, cron.ScheduledTask> = new Map();
  private maxConcurrentTasks: number = 3;

  constructor(feishuConfig?: any) {
    this.questionGenerator = new QuestionGeneratorService();
    this.browserAutomation = new BrowserAutomationService();
    this.scoringEngine = new ScoringEngineService();
    this.database = Database.getInstance();
    
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
      // 检查并发限制
      if (this.runningTasks.size >= this.maxConcurrentTasks) {
        throw new Error('Maximum concurrent tasks limit reached');
      }

      // 更新任务状态
      await this.updateTaskStatus(task.id, TaskStatus.RUNNING);
      
      // 初始化进度跟踪
      const totalSteps = this.calculateTotalSteps(task);
      this.runningTasks.set(task.id, {
        taskId: task.id,
        currentStep: '初始化任务',
        completedSteps: 0,
        totalSteps,
        progress: 0
      });

      log.info('Starting evaluation task', {
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

      log.info('Evaluation task completed successfully', {
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
      this.runningTasks.delete(task.id);
    }
  }

  /**
   * 执行评测流程
   */
  private async executeEvaluationFlow(task: EvaluationTask): Promise<EvaluationSession[]> {
    const sessions: EvaluationSession[] = [];

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
    questionType: QuestionType,
    task: EvaluationTask
  ): Promise<void> {
    try {
      // 生成初始问题
      const question = await this.questionGenerator.generateInitialQuestion(
        task.userProfile,
        task.programmingLanguage,
        questionType
      );
      
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
      const sql = `
        INSERT OR REPLACE INTO evaluation_sessions 
        (id, task_id, product_id, user_profile, programming_language, status, start_time, end_time)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      await this.database.run(sql, [
        session.id,
        session.taskId,
        session.productId,
        JSON.stringify(session.userProfile),
        JSON.stringify(session.programmingLanguage),
        session.status,
        session.startTime.toISOString(),
        session.endTime?.toISOString() || null
      ]);
    } catch (error) {
      log.error('Failed to save session', { sessionId: session.id, error });
    }
  }

  /**
   * 更新任务状态
   */
  private async updateTaskStatus(taskId: string, status: TaskStatus): Promise<void> {
    try {
      const sql = `
        UPDATE evaluation_tasks 
        SET status = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `;
      
      await this.database.run(sql, [status, taskId]);
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
    }
  }

  /**
   * 计算总步骤数
   */
  private calculateTotalSteps(task: EvaluationTask): number {
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
    return this.runningTasks.get(taskId) || null;
  }

  /**
   * 取消任务
   */
  async cancelTask(taskId: string): Promise<void> {
    try {
      await this.updateTaskStatus(taskId, TaskStatus.CANCELLED);
      this.runningTasks.delete(taskId);
      
      log.info('Task cancelled', { taskId });
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
        log.info('Executing scheduled task', { taskId, cronExpression });
        await this.executeEvaluationTask(task);
      });
      
      this.scheduledTasks.set(taskId, scheduledTask);
      
      log.info('Task scheduled successfully', { taskId, cronExpression });
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
      log.info('Scheduled task cancelled', { taskId });
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
    
    log.info('Task scheduler cleanup completed');
  }
}

