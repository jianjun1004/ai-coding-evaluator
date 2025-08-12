import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { APIResponse, EvaluationTask, TaskStatus, QuestionType } from '../models';
import { AI_PRODUCTS, processCustomUserProfile, processCustomProgrammingLanguage } from '../config/ai-products';
import { QuestionGeneratorService } from '../services/question-generator.service';
import { TaskSchedulerService } from '../services/task-scheduler.service';
import { MemoryStorageService } from '../services/memory-storage.service';
import { log } from '../utils/logger';

export class TaskController {
  private questionGeneratorService: QuestionGeneratorService;
  private taskSchedulerService: TaskSchedulerService;
  private memoryStorage: MemoryStorageService;

  constructor() {
    this.questionGeneratorService = new QuestionGeneratorService();
    this.taskSchedulerService = new TaskSchedulerService();
    this.memoryStorage = MemoryStorageService.getInstance();
  }

  /**
   * 获取任务列表
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 10, status } = req.query;
      
      const result = await this.memoryStorage.getTasks(
        Number(page), 
        Number(pageSize), 
        status as string
      );
      
      const response: APIResponse<any[]> = {
        success: true,
        data: result.tasks.map(task => ({
          id: task.id,
          name: task.name,
          description: task.description || '',
          user_profile: task.userProfile,
          programming_language: task.programmingLanguage,
          ai_products: task.aiProducts,
          question_types: task.questionTypes,
          max_follow_ups: task.maxFollowUps,
          status: task.status,
          created_at: task.createdAt,
          updated_at: task.updatedAt
        })),
        meta: {
          total: result.total,
          page: Number(page),
          pageSize: Number(pageSize)
        }
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get tasks', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_TASKS_ERROR',
          message: 'Failed to get tasks',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取任务详情
   */
  async getTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const task = await this.memoryStorage.getTask(id);
      
      if (!task) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found'
          }
        };
        res.status(404).json(response);
        return;
      }
      
      // 获取相关会话
      const sessions = await this.memoryStorage.getSessionsByTask(id);
      
      const response: APIResponse<any> = {
        success: true,
        data: {
          id: task.id,
          name: task.name,
          description: task.description || '',
          user_profile: task.userProfile,
          programming_language: task.programmingLanguage,
          ai_products: task.aiProducts,
          question_types: task.questionTypes,
          max_follow_ups: task.maxFollowUps,
          status: task.status,
          created_at: task.createdAt,
          updated_at: task.updatedAt,
          sessions: sessions.map(session => ({
            id: session.id,
            task_id: session.taskId,
            product_id: session.productId,
            user_profile: session.userProfile,
            programming_language: session.programmingLanguage,
            status: session.status,
            start_time: session.startTime,
            end_time: session.endTime,
            created_at: session.startTime
          }))
        }
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get task', { taskId: req.params.id, error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_TASK_ERROR',
          message: 'Failed to get task',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 创建新任务
   */
  async createTask(req: Request, res: Response): Promise<void> {
    try {
      const {
        name,
        description,
        aiProductIds,
        questionTypes,
        maxFollowUps = 3,
        // 自定义输入
        customUserProfile,
        customProgrammingLanguage
      } = req.body;
      console.log('========',req.body)
      // 验证输入
      if (!name || !aiProductIds || !questionTypes) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required fields'
          }
        };
        res.status(400).json(response);
        return;
      }

      // 验证自定义用户画像
      if (!customUserProfile || !customUserProfile.name || !customUserProfile.name.trim()) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_USER_PROFILE',
            message: 'Custom user profile name is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      // 验证自定义编程语言
      if (!customProgrammingLanguage || !customProgrammingLanguage.name || !customProgrammingLanguage.name.trim()) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_PROGRAMMING_LANGUAGE',
            message: 'Custom programming language name is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      // 处理自定义用户画像
      const userProfile = processCustomUserProfile(customUserProfile);

      // 处理自定义编程语言
      const programmingLanguage = processCustomProgrammingLanguage(customProgrammingLanguage);

      // 获取AI产品
      const aiProducts = AI_PRODUCTS.filter(p => aiProductIds.includes(p.id));
      if (aiProducts.length === 0) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_AI_PRODUCTS',
            message: 'No valid AI products selected'
          }
        };
        res.status(400).json(response);
        return;
      }

      const taskId = this.memoryStorage.generateId();
      const task: EvaluationTask = {
        id: taskId,
        name,
        description: description || '',
        userProfile: userProfile,
        programmingLanguage: programmingLanguage,
        aiProducts,
        questionTypes: questionTypes,
        maxFollowUps,
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 生成初始问题（为每个问题类型生成一个问题）
      const initialQuestions = [];
      for (const questionType of questionTypes) {
        const question = await this.questionGeneratorService.generateInitialQuestion(
          userProfile,
          programmingLanguage,
          questionType as QuestionType
        );
        initialQuestions.push(question);
      }

      // 保存任务到内存存储
      await this.memoryStorage.createTask(task);

      const response: APIResponse<EvaluationTask> = {
        success: true,
        data: task
      };

      res.status(201).json(response);
    } catch (error: any) {
      log.error('Failed to create task', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'CREATE_TASK_ERROR',
          message: 'Failed to create task',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 执行任务 - 简化版本，不需要ID
   */
  async executeTask(req: Request, res: Response): Promise<void> {
    try {
      // 从请求体获取任务数据
      const taskData = req.body;
      
      // 添加详细的调试日志
      log.info('executeTask called', {
        method: req.method,
        url: req.url,
        body: taskData,
        headers: req.headers
      });
      
      // 验证必要字段
      if (!taskData.name || !taskData.aiProductIds || !taskData.questionTypes) {
        log.error('Missing required fields', {
          name: !!taskData.name,
          aiProductIds: !!taskData.aiProductIds,
          questionTypes: !!taskData.questionTypes,
          taskData
        });
        
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required fields: name, aiProductIds, questionTypes'
          }
        };
        res.status(400).json(response);
        return;
      }

      // 验证问题内容（如果提供了具体问题）
      if (taskData.questions && Array.isArray(taskData.questions)) {
        if (taskData.questions.length === 0) {
          const response: APIResponse<null> = {
            success: false,
            error: {
              code: 'INVALID_QUESTIONS',
              message: 'Questions array cannot be empty if provided'
            }
          };
          res.status(400).json(response);
          return;
        }
        
        // 验证每个问题都有必要字段
        for (const question of taskData.questions) {
          if (!question.content || !question.type) {
            const response: APIResponse<null> = {
              success: false,
              error: {
                code: 'INVALID_QUESTION_FORMAT',
                message: 'Each question must have content and type fields'
              }
            };
            res.status(400).json(response);
            return;
          }
        }
      }

      // 创建任务对象 - 确保包含所有必要字段
      const task = {
        id: 'current-task',
        name: taskData.name,
        description: taskData.description,
        // 确保aiProducts字段存在且格式正确
        aiProducts: taskData.aiProducts || taskData.aiProductIds?.map((id: string) => ({ id, name: `Product-${id}` })) || [],
        questionTypes: taskData.questionTypes || [],
        questions: taskData.questions || [], // 用户提供或生成的具体问题内容
        maxFollowUps: taskData.maxFollowUps || 3,
        // 添加默认的用户画像和编程语言
        userProfile: taskData.userProfile || { name: 'Default User', characteristics: ['programmer'] },
        programmingLanguage: taskData.programmingLanguage || { name: 'JavaScript', commonIssues: [], learningTopics: [] },
        status: TaskStatus.RUNNING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 添加任务对象创建的调试日志
      log.info('Task object created', {
        taskId: task.id,
        taskName: task.name,
        hasAiProducts: !!task.aiProducts,
        aiProductsLength: task.aiProducts?.length,
        hasQuestionTypes: !!task.questionTypes,
        questionTypesLength: task.questionTypes?.length,
        hasUserProfile: !!task.userProfile,
        hasProgrammingLanguage: !!task.programmingLanguage,
        taskObject: task,
        // 添加原始数据的调试信息
        originalTaskData: taskData
      });

      // 异步执行任务
      this.taskSchedulerService.executeEvaluationTask(task).catch(error => {
        log.error('Task execution failed', { error, taskId: task.id });
      });

      const response: APIResponse<{ message: string; taskId: string }> = {
        success: true,
        data: {
          message: '321``',
          taskId: 'current-task'
        }
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to execute task', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'EXECUTE_TASK_ERROR',
          message: 'Failed to execute task',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取任务进度 - 简化版本，不需要ID
   */
  async getTaskProgress(req: Request, res: Response): Promise<void> {
    try {
      // 添加调试日志
      log.info('getTaskProgress called', {
        method: req.method,
        url: req.url,
        query: req.query
      });
      
      // 获取当前任务的进度
      const progress = this.taskSchedulerService.getTaskProgress('current-task');
      
      // 添加进度查询结果的调试日志
      log.info('Progress query result', {
        hasProgress: !!progress,
        progressDetails: progress,
        taskId: 'current-task'
      });
      
      if (progress) {
        // 返回完整的进度信息
        const response: APIResponse<any> = {
          success: true,
          data: {
            ...progress,
            // 添加状态判断字段，便于前端判断
            shouldStopPolling: progress.isCompleted,
            status: progress.isCompleted ? 
              (progress.finalResult?.status || 'unknown') : 
              'running'
          }
        };
        
        log.info('Returning progress data', { response });
        res.json(response);
      } else {
        // 没有任务在运行
        const response: APIResponse<any> = {
          success: true,
          data: { 
            status: 'NO_TASK_RUNNING',
            shouldStopPolling: true,
            message: '当前没有任务在运行'
          }
        };
        
        log.info('No task running, returning default response', { response });
        res.json(response);
      }
    } catch (error: any) {
      log.error('Failed to get task progress', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_PROGRESS_ERROR',
          message: 'Failed to get task progress',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 取消任务 - 简化版本，不需要ID
   */
  async cancelTask(req: Request, res: Response): Promise<void> {
    try {
      // 取消当前任务
      await this.taskSchedulerService.cancelTask('current-task');
      
      const response: APIResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Task cancelled successfully'
        }
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to cancel task', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'CANCEL_TASK_ERROR',
          message: 'Failed to cancel task',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 删除任务
   */
  async deleteTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // 检查任务是否存在
      const task = await this.memoryStorage.getTask(id);
      
      if (!task) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'TASK_NOT_FOUND',
            message: 'Task not found'
          }
        };
        res.status(404).json(response);
        return;
      }

      // 如果任务正在运行，先取消
      if (task.status === TaskStatus.RUNNING) {
        await this.taskSchedulerService.cancelTask(id);
      }

      // 删除任务及相关数据
      const deleted = await this.memoryStorage.deleteTask(id);

      if (!deleted) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'DELETE_TASK_ERROR',
            message: 'Failed to delete task'
          }
        };
        res.status(500).json(response);
        return;
      }

      const response: APIResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Task deleted successfully'
        }
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to delete task', { taskId: req.params.id, error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'DELETE_TASK_ERROR',
          message: 'Failed to delete task',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取运行中的任务
   */
  async getRunningTasks(req: Request, res: Response): Promise<void> {
    try {
      const runningTasks = this.taskSchedulerService.getRunningTasks();
      
      const response: APIResponse<any[]> = {
        success: true,
        data: runningTasks
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get running tasks', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_RUNNING_TASKS_ERROR',
          message: 'Failed to get running tasks',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 生成问题
   */
  async generateQuestions(req: Request, res: Response): Promise<void> {
    try {
      // 调试：打印请求信息
      log.info('generateQuestions called', { 
        method: req.method, 
        url: req.url, 
        body: req.body,
        headers: req.headers
      });

      const {
        questionTypes,
        // 自定义输入
        customUserProfile,
        customProgrammingLanguage
      } = req.body;
      // 验证输入
      if (!questionTypes || !Array.isArray(questionTypes) || questionTypes.length === 0) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing or invalid questionTypes'
          }
        };
        res.status(400).json(response);
        return;
      }

      // 验证自定义用户画像
      if (!customUserProfile || !customUserProfile.name || !customUserProfile.name.trim()) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_USER_PROFILE',
            message: 'Custom user profile name is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      // 验证自定义编程语言
      if (!customProgrammingLanguage || !customProgrammingLanguage.name || !customProgrammingLanguage.name.trim()) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_PROGRAMMING_LANGUAGE',
            message: 'Custom programming language name is required'
          }
        };
        res.status(400).json(response);
        return;
      }

      // 处理自定义用户画像
      const userProfile = processCustomUserProfile(customUserProfile);

      // 处理自定义编程语言
      const programmingLanguage = processCustomProgrammingLanguage(customProgrammingLanguage);

      // 生成问题
      const questions = await this.questionGeneratorService.generateQuestionBatch(
        userProfile,
        programmingLanguage,
        questionTypes,
      );

      console.log('questions==========》2', questions)
      const response: APIResponse<any[]> = {
        success: true,
        data: questions.map(question => ({
          id: question.id,
          content: question.content,
          type: question.type,
          isGenerated: true,
          context: question.context
        }))
      };
      console.log('返回给前端的问题数量:', response.data?.length || 0);
      res.json(response);
    } catch (error: any) {
      log.error('Failed to generate questions', { error });
      
      // 根据错误类型返回相应的状态码
      let statusCode = 500;
      let errorCode = 'GENERATE_QUESTIONS_ERROR';
      let errorMessage = 'Failed to generate questions';
      
      if (error?.message?.includes('API认证失败')) {
        statusCode = 401;
        errorCode = 'API_AUTH_ERROR';
        errorMessage = 'API认证失败，请检查配置';
      } else if (error?.message?.includes('请求频率过高')) {
        statusCode = 429;
        errorCode = 'RATE_LIMIT_ERROR';
        errorMessage = '请求频率过高，请稍后重试';
      } else if (error?.message?.includes('服务暂时不可用')) {
        statusCode = 503;
        errorCode = 'SERVICE_UNAVAILABLE';
        errorMessage = '服务暂时不可用，请稍后重试';
      }
      
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: errorCode,
          message: errorMessage,
          details: error?.message || 'Unknown error'
        }
      };
      res.status(statusCode).json(response);
    }
  }
}

