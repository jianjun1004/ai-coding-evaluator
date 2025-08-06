import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { TaskSchedulerService } from '../services/task-scheduler.service';
import { Database } from '../config/database';
import { 
  EvaluationTask, 
  TaskStatus, 
  QuestionType, 
  APIResponse 
} from '../models';
import { getUserProfiles, getProgrammingLanguages, AI_PRODUCTS } from '../config/ai-products';
import { log } from '../utils/logger';

export class TaskController {
  private taskScheduler: TaskSchedulerService;
  private database: Database;

  constructor() {
    this.taskScheduler = new TaskSchedulerService();
    this.database = Database.getInstance();
  }

  /**
   * 获取任务列表
   */
  async getTasks(req: Request, res: Response): Promise<void> {
    try {
      const { page = 1, pageSize = 10, status } = req.query;
      
      let sql = 'SELECT * FROM evaluation_tasks';
      const params: any[] = [];
      
      if (status) {
        sql += ' WHERE status = ?';
        params.push(status);
      }
      
      sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
      params.push(Number(pageSize), (Number(page) - 1) * Number(pageSize));
      
      const tasks = await this.database.all(sql, params);
      
      // 获取总数
      let countSql = 'SELECT COUNT(*) as total FROM evaluation_tasks';
      if (status) {
        countSql += ' WHERE status = ?';
      }
      const countResult = await this.database.get(countSql, status ? [status] : []);
      
      const response: APIResponse<any[]> = {
        success: true,
        data: tasks.map(task => ({
          ...task,
          user_profile: JSON.parse(task.user_profile_id),
          programming_language: JSON.parse(task.programming_language_id),
          ai_products: JSON.parse(task.ai_products),
          question_types: JSON.parse(task.question_types)
        })),
        meta: {
          total: countResult.total,
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
      
      const task = await this.database.get(
        'SELECT * FROM evaluation_tasks WHERE id = ?',
        [id]
      );
      
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
      const sessions = await this.database.all(
        'SELECT * FROM evaluation_sessions WHERE task_id = ?',
        [id]
      );
      
      const response: APIResponse<any> = {
        success: true,
        data: {
          ...task,
          user_profile: JSON.parse(task.user_profile_id),
          programming_language: JSON.parse(task.programming_language_id),
          ai_products: JSON.parse(task.ai_products),
          question_types: JSON.parse(task.question_types),
          sessions: sessions.map(session => ({
            ...session,
            user_profile: JSON.parse(session.user_profile),
            programming_language: JSON.parse(session.programming_language)
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
        userProfileId,
        programmingLanguageId,
        aiProductIds,
        questionTypes,
        maxFollowUps = 3
      } = req.body;

      // 验证输入
      if (!name || !userProfileId || !programmingLanguageId || !aiProductIds || !questionTypes) {
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

      // 获取用户画像和编程语言
      const userProfiles = getUserProfiles();
      const programmingLanguages = getProgrammingLanguages();
      
      const userProfile = userProfiles.find(p => p.id === userProfileId);
      const programmingLanguage = programmingLanguages.find(l => l.id === programmingLanguageId);
      
      if (!userProfile || !programmingLanguage) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_PROFILE_OR_LANGUAGE',
            message: 'Invalid user profile or programming language'
          }
        };
        res.status(400).json(response);
        return;
      }

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

      const taskId = uuidv4();
      const task: EvaluationTask = {
        id: taskId,
        name,
        description: description || '',
        userProfile: userProfile as any, // 临时类型断言，实际使用时需要确保类型匹配
        programmingLanguage,
        aiProducts,
        questionTypes: questionTypes.map((type: string) => type as QuestionType),
        maxFollowUps,
        status: TaskStatus.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // 保存到数据库
      await this.database.run(`
        INSERT INTO evaluation_tasks 
        (id, name, description, user_profile_id, programming_language_id, ai_products, question_types, max_follow_ups, status)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        task.id,
        task.name,
        task.description,
        JSON.stringify(task.userProfile),
        JSON.stringify(task.programmingLanguage),
        JSON.stringify(task.aiProducts),
        JSON.stringify(task.questionTypes),
        task.maxFollowUps,
        task.status
      ]);

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
   * 执行任务
   */
  async executeTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      // 获取任务
      const taskRow = await this.database.get(
        'SELECT * FROM evaluation_tasks WHERE id = ?',
        [id]
      );
      
      if (!taskRow) {
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

      const task: EvaluationTask = {
        id: taskRow.id,
        name: taskRow.name,
        description: taskRow.description,
        userProfile: JSON.parse(taskRow.user_profile_id),
        programmingLanguage: JSON.parse(taskRow.programming_language_id),
        aiProducts: JSON.parse(taskRow.ai_products),
        questionTypes: JSON.parse(taskRow.question_types),
        maxFollowUps: taskRow.max_follow_ups,
        status: taskRow.status as TaskStatus,
        createdAt: new Date(taskRow.created_at),
        updatedAt: new Date(taskRow.updated_at)
      };

      // 异步执行任务
      this.taskScheduler.executeEvaluationTask(task).catch(error => {
        log.error('Task execution failed', { taskId: id, error });
      });

      const response: APIResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Task execution started'
        }
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to execute task', { taskId: req.params.id, error });
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
   * 获取任务进度
   */
  async getTaskProgress(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      const progress = this.taskScheduler.getTaskProgress(id);
      
      const response: APIResponse<any> = {
        success: true,
        data: progress
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get task progress', { taskId: req.params.id, error });
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
   * 取消任务
   */
  async cancelTask(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      
      await this.taskScheduler.cancelTask(id);
      
      const response: APIResponse<{ message: string }> = {
        success: true,
        data: {
          message: 'Task cancelled successfully'
        }
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to cancel task', { taskId: req.params.id, error });
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
      const task = await this.database.get(
        'SELECT * FROM evaluation_tasks WHERE id = ?',
        [id]
      );
      
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
        await this.taskScheduler.cancelTask(id);
      }

      // 删除相关数据
      await this.database.beginTransaction();
      
      try {
        await this.database.run('DELETE FROM scoring_results WHERE response_id IN (SELECT id FROM ai_responses WHERE question_id IN (SELECT id FROM questions WHERE session_id IN (SELECT id FROM evaluation_sessions WHERE task_id = ?)))', [id]);
        await this.database.run('DELETE FROM ai_responses WHERE question_id IN (SELECT id FROM questions WHERE session_id IN (SELECT id FROM evaluation_sessions WHERE task_id = ?))', [id]);
        await this.database.run('DELETE FROM questions WHERE session_id IN (SELECT id FROM evaluation_sessions WHERE task_id = ?)', [id]);
        await this.database.run('DELETE FROM evaluation_sessions WHERE task_id = ?', [id]);
        await this.database.run('DELETE FROM evaluation_tasks WHERE id = ?', [id]);
        
        await this.database.commit();
      } catch (error) {
        await this.database.rollback();
        throw error;
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
      const runningTasks = this.taskScheduler.getRunningTasks();
      
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
}

