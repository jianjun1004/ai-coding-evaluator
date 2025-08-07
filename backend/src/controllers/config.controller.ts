import { Request, Response } from 'express';
import { APIResponse } from '../models';
import { AI_PRODUCTS } from '../config/ai-products';
import { log } from '../utils/logger';

export class ConfigController {
  /**
   * 获取AI产品配置
   */
  async getAIProducts(req: Request, res: Response): Promise<void> {
    try {
      const response: APIResponse<any[]> = {
        success: true,
        data: AI_PRODUCTS
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get AI products', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_AI_PRODUCTS_ERROR',
          message: 'Failed to get AI products',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取问题类型列表
   */
  async getQuestionTypes(req: Request, res: Response): Promise<void> {
    try {
      const questionTypes = [
        { id: 'learning', name: '学习问题', description: '编程语言学习相关问题' },
        { id: 'project', name: '项目问题', description: '实际项目开发相关问题' },
        { id: 'debugging', name: '调试问题', description: '代码调试和错误修复问题' },
        { id: 'best_practices', name: '最佳实践', description: '编程最佳实践相关问题' },
        { id: 'performance', name: '性能优化', description: '代码性能优化相关问题' }
      ];
      
      const response: APIResponse<any[]> = {
        success: true,
        data: questionTypes
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get question types', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_QUESTION_TYPES_ERROR',
          message: 'Failed to get question types',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取系统配置
   */
  async getSystemConfig(req: Request, res: Response): Promise<void> {
    try {
      const config = {
        maxConcurrentTasks: 3,
        maxFollowUps: 3,
        supportedAIProducts: AI_PRODUCTS.map(p => p.name),
        version: '1.0.0'
      };
      
      const response: APIResponse<any> = {
        success: true,
        data: config
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get system config', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_SYSTEM_CONFIG_ERROR',
          message: 'Failed to get system config',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 测试飞书连接
   */
  async testFeishuConnection(req: Request, res: Response): Promise<void> {
    try {
      // 这里可以添加实际的飞书连接测试逻辑
      const response: APIResponse<any> = {
        success: true,
        data: { connected: true }
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to test Feishu connection', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'FEISHU_CONNECTION_ERROR',
          message: 'Failed to test Feishu connection',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取评分标准
   */
  async getScoringCriteria(req: Request, res: Response): Promise<void> {
    try {
      const criteria = {
        dimensions: [
          { name: '准确性', weight: 0.3, description: '回答是否正确，是否包含错误信息' },
          { name: '完整性', weight: 0.25, description: '回答是否全面，是否遗漏重要信息' },
          { name: '清晰度', weight: 0.2, description: '回答是否清晰易懂，结构是否合理' },
          { name: '实用性', weight: 0.15, description: '回答对用户是否有实际帮助' },
          { name: '代码质量', weight: 0.1, description: '如果包含代码，代码质量如何' }
        ],
        scoreLevels: [
          { score: 0, level: '完全不可用', description: '完全不能解决问题，被劝退，以后不会再用' },
          { score: 1, level: '不可用，存在大量错误内容', description: '不能解决问题，被劝退，以后不会再用' },
          { score: 2, level: '不可用，存在少量错误内容', description: '不能解决问题，但回答中有部分参考信息，不会主动想起用' },
          { score: 3, level: '可用，存在可提升空间', description: '能解决问题，有一些小瑕疵，愿意继续使用' },
          { score: 4, level: '满分', description: '能够完美高效的解决问题，愿意推荐给其他人使用' }
        ]
      };
      
      const response: APIResponse<any> = {
        success: true,
        data: criteria
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get scoring criteria', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_SCORING_CRITERIA_ERROR',
          message: 'Failed to get scoring criteria',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }
}

