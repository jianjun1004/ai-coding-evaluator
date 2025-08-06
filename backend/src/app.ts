// 首先加载环境变量
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';

// 路由导入
import taskRoutes from './routes/task.routes';
import configRoutes from './routes/config.routes';

// 工具导入
import { log } from './utils/logger';
import { Database } from './config/database';

class App {
  public app: express.Application;
  private database: Database;

  constructor() {
    this.app = express();
    this.database = Database.getInstance();
    
    this.initializeMiddlewares();
    this.initializeRoutes();
    this.initializeErrorHandling();
  }

  private initializeMiddlewares(): void {
    // 安全中间件
    this.app.use(helmet());
    
    // CORS配置 - 允许所有来源
    this.app.use(cors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
    }));

    // 请求日志
    this.app.use(morgan('combined', {
      stream: {
        write: (message: string) => {
          log.info(message.trim());
        }
      }
    }));

    // 请求解析
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // 静态文件服务
    this.app.use('/screenshots', express.static(path.join(__dirname, '../screenshots')));
    this.app.use('/logs', express.static(path.join(__dirname, '../logs')));
  }

  private initializeRoutes(): void {
    // 健康检查
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      });
    });

    // API路由
    this.app.use('/api/tasks', taskRoutes);
    this.app.use('/api/config', configRoutes);

    // 根路径
    this.app.get('/', (req, res) => {
      res.json({
        name: 'AI Coding Evaluator API',
        version: '1.0.0',
        description: 'AI编程产品评测工作流系统后端API',
        endpoints: {
          health: '/health',
          tasks: '/api/tasks',
          config: '/api/config'
        }
      });
    });

    // 404处理
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: `Route ${req.originalUrl} not found`
        }
      });
    });
  }

  private initializeErrorHandling(): void {
    // 全局错误处理中间件
    this.app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
      log.error('Unhandled error', {
        error: error.message,
        stack: error.stack,
        url: req.url,
        method: req.method
      });

      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Internal server error',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        }
      });
    });

    // 未捕获的Promise拒绝
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      log.error('Unhandled Promise Rejection', { reason, promise });
    });

    // 未捕获的异常
    process.on('uncaughtException', (error: Error) => {
      log.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });
  }

  public async start(port: number = 3000): Promise<void> {
    try {
      // 初始化数据库
      await this.initializeDatabase();
      
      // 启动服务器
      this.app.listen(port, '0.0.0.0', () => {
        log.info(`Server started on port ${port}`);
        console.log(`🚀 AI Coding Evaluator API is running on http://0.0.0.0:${port}`);
        console.log(`📖 API Documentation: http://0.0.0.0:${port}/`);
        console.log(`🏥 Health Check: http://0.0.0.0:${port}/health`);
      });
    } catch (error) {
      log.error('Failed to start server', { error });
      process.exit(1);
    }
  }

  private async initializeDatabase(): Promise<void> {
    try {
      // 数据库已经在构造函数中初始化
      log.info('Database initialized successfully');
    } catch (error) {
      log.error('Failed to initialize database', { error });
      throw error;
    }
  }

  public async shutdown(): Promise<void> {
    try {
      await this.database.close();
      log.info('Server shutdown completed');
    } catch (error) {
      log.error('Error during shutdown', { error });
    }
  }
}

// 创建应用实例
const app = new App();

// 优雅关闭
process.on('SIGTERM', async () => {
  log.info('SIGTERM received, shutting down gracefully');
  await app.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  log.info('SIGINT received, shutting down gracefully');
  await app.shutdown();
  process.exit(0);
});

// 启动服务器
const port = process.env.PORT ? parseInt(process.env.PORT) : 3000;
app.start(port);

export default app;

