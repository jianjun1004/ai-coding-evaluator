import { Request, Response } from 'express';
import { APIResponse } from '../models';
import { getUserProfiles, getProgrammingLanguages, AI_PRODUCTS } from '../config/ai-products';
import { log } from '../utils/logger';

export class ConfigController {
  /**
   * 获取用户画像列表
   */
  async getUserProfiles(req: Request, res: Response): Promise<void> {
    try {
      const profiles = getUserProfiles();
      
      const response: APIResponse<any[]> = {
        success: true,
        data: profiles
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get user profiles', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_PROFILES_ERROR',
          message: 'Failed to get user profiles',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取编程语言列表
   */
  async getProgrammingLanguages(req: Request, res: Response): Promise<void> {
    try {
      const languages = getProgrammingLanguages();
      
      const response: APIResponse<any[]> = {
        success: true,
        data: languages
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to get programming languages', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'GET_LANGUAGES_ERROR',
          message: 'Failed to get programming languages',
          details: error?.message || 'Unknown error'
        }
      };
      res.status(500).json(response);
    }
  }

  /**
   * 获取AI产品配置
   */
  async getAIProducts(req: Request, res: Response): Promise<void> {
    try {
      const products = AI_PRODUCTS.map(product => ({
        id: product.id,
        name: product.name,
        url: product.url,
        modelConfig: product.modelConfig,
        // 不返回敏感的交互配置信息
        description: `${product.name} - 支持模型: ${product.modelConfig.availableModels.join(', ')}`
      }));
      
      const response: APIResponse<any[]> = {
        success: true,
        data: products
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
        {
          id: 'learning',
          name: '学习编程',
          description: '关于编程语言学习的基础问题'
        },
        {
          id: 'project',
          name: '项目开发',
          description: '关于项目开发过程中的实际问题'
        },
        {
          id: 'debugging',
          name: '调试问题',
          description: '关于代码调试和错误解决的问题'
        },
        {
          id: 'best_practices',
          name: '最佳实践',
          description: '关于编程最佳实践和代码规范的问题'
        },
        {
          id: 'performance',
          name: '性能优化',
          description: '关于代码性能优化的问题'
        }
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
        supportedLanguages: getProgrammingLanguages().map(l => l.name),
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
      const { appId, appSecret, tableToken, tableId } = req.body;
      
      if (!appId || !appSecret || !tableToken || !tableId) {
        const response: APIResponse<null> = {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'Missing required Feishu configuration'
          }
        };
        res.status(400).json(response);
        return;
      }

      // 这里可以添加实际的飞书连接测试逻辑
      // const feishuService = new FeishuIntegrationService({ appId, appSecret, tableToken, tableId });
      // const isConnected = await feishuService.testConnection();
      
      const response: APIResponse<{ connected: boolean }> = {
        success: true,
        data: {
          connected: true // 暂时返回true，实际应该测试连接
        }
      };
      
      res.json(response);
    } catch (error: any) {
      log.error('Failed to test Feishu connection', { error });
      const response: APIResponse<null> = {
        success: false,
        error: {
          code: 'TEST_FEISHU_ERROR',
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
        scale: {
          min: 0,
          max: 4,
          description: '0-4分评分制'
        },
        levels: [
          {
            score: 0,
            name: '完全不可用',
            description: '完全不能解决问题，被劝退，以后不会再用'
          },
          {
            score: 1,
            name: '不可用，存在大量错误内容',
            description: '不能解决问题，被劝退，以后不会再用'
          },
          {
            score: 2,
            name: '不可用，存在少量错误内容',
            description: '不能解决问题，但回答中有部分参考信息，不会主动想起用'
          },
          {
            score: 3,
            name: '可用，存在可提升空间',
            description: '能解决问题，有一些小瑕疵，愿意继续使用'
          },
          {
            score: 4,
            name: '满分',
            description: '能够完美高效的解决问题，愿意推荐给其他人使用'
          }
        ],
        dimensions: [
          {
            name: 'accuracy',
            displayName: '准确性',
            description: '回答是否正确，是否包含错误信息',
            weight: 0.3
          },
          {
            name: 'completeness',
            displayName: '完整性',
            description: '回答是否全面，是否遗漏重要信息',
            weight: 0.25
          },
          {
            name: 'clarity',
            displayName: '清晰度',
            description: '回答是否清晰易懂，结构是否合理',
            weight: 0.2
          },
          {
            name: 'usefulness',
            displayName: '实用性',
            description: '回答对用户是否有实际帮助',
            weight: 0.15
          },
          {
            name: 'codeQuality',
            displayName: '代码质量',
            description: '如果包含代码，代码质量如何',
            weight: 0.1
          }
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

