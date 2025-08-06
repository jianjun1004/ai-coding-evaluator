import puppeteer, { Browser, Page } from 'puppeteer';
import { logger } from '../utils/logger';

interface AIProductConfig {
  url: string;
  name: string;
  selectors?: {
    input?: string;
    submit?: string;
    response?: string;
  };
}

export interface AutomationResult {
  success: boolean;
  response?: string;
  error?: string;
  screenshots?: string[];
  metadata?: {
    responseTime: number;
    model?: string;
    timestamp: string;
  };
}

export class OptimizedBrowserAutomationService {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();

  async initialize(): Promise<void> {
    try {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-web-security',
          '--disable-features=VizDisplayCompositor'
        ]
      });
      logger.info('Browser initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize browser:', error);
      throw error;
    }
  }

  async cleanup(): Promise<void> {
    try {
      // 关闭所有页面
      for (const [productId, page] of this.pages) {
        await page.close();
        this.pages.delete(productId);
      }

      // 关闭浏览器
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      logger.info('Browser cleanup completed');
    } catch (error) {
      logger.error('Error during browser cleanup:', error);
    }
  }

  async getOrCreatePage(productId: string): Promise<Page> {
    if (this.pages.has(productId)) {
      return this.pages.get(productId)!;
    }

    if (!this.browser) {
      await this.initialize();
    }

    const page = await this.browser!.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    this.pages.set(productId, page);
    return page;
  }

  async askQuestion(
    productId: string,
    question: string,
    config: AIProductConfig,
    options: {
      timeout?: number;
      enableScreenshots?: boolean;
      model?: string;
    } = {}
  ): Promise<AutomationResult> {
    const startTime = Date.now();
    const screenshots: string[] = [];
    
    try {
      const page = await this.getOrCreatePage(productId);
      
      // 导航到产品页面
      await this.navigateToProduct(page, productId, config);
      
      if (options.enableScreenshots) {
        const screenshot = await page.screenshot({ 
          path: `/tmp/screenshot_${productId}_${Date.now()}_nav.png`,
          fullPage: false 
        });
        screenshots.push(`/tmp/screenshot_${productId}_${Date.now()}_nav.png`);
      }

      // 配置产品特定设置
      await this.configureProduct(page, productId, config, options.model);

      // 输入问题
      await this.inputQuestion(page, productId, question);

      if (options.enableScreenshots) {
        const screenshot = await page.screenshot({ 
          path: `/tmp/screenshot_${productId}_${Date.now()}_input.png`,
          fullPage: false 
        });
        screenshots.push(`/tmp/screenshot_${productId}_${Date.now()}_input.png`);
      }

      // 等待回答
      const response = await this.waitForResponse(page, productId, options.timeout || 30000);

      if (options.enableScreenshots) {
        const screenshot = await page.screenshot({ 
          path: `/tmp/screenshot_${productId}_${Date.now()}_response.png`,
          fullPage: false 
        });
        screenshots.push(`/tmp/screenshot_${productId}_${Date.now()}_response.png`);
      }

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        response,
        screenshots,
        metadata: {
          responseTime,
          model: options.model,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error(`Error asking question to ${productId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshots,
        metadata: {
          responseTime: Date.now() - startTime,
          model: options.model,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  private async navigateToProduct(page: Page, productId: string, config: AIProductConfig): Promise<void> {
    try {
      await page.goto(config.url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // 处理特殊情况
      if (productId === 'deepseek') {
        // 等待Cloudflare验证
        await this.handleCloudflareChallenge(page);
      }

      // 等待页面加载完成
      await new Promise(resolve => setTimeout(resolve, 2000));
      
    } catch (error) {
      throw new Error(`Failed to navigate to ${productId}: ${error}`);
    }
  }

  private async handleCloudflareChallenge(page: Page): Promise<void> {
    try {
      // 检查是否有Cloudflare挑战
      const challengeElement = await page.$('div[class*="challenge"]');
      if (challengeElement) {
        logger.info('Cloudflare challenge detected, waiting...');
        // 等待最多60秒让Cloudflare验证完成
        await page.waitForNavigation({ 
          waitUntil: 'networkidle2', 
          timeout: 60000 
        });
      }
    } catch (error) {
      logger.warn('Cloudflare challenge handling failed:', error);
      // 继续执行，可能验证已经完成
    }
  }

  private async configureProduct(page: Page, productId: string, config: AIProductConfig, model?: string): Promise<void> {
    try {
      switch (productId) {
        case 'doubao':
          await this.configureDoubao(page, model);
          break;
        case 'kimi':
          await this.configureKimi(page, model);
          break;
        case 'qwen':
          await this.configureQwen(page, model);
          break;
        case 'yuanbao':
          await this.configureYuanbao(page, model);
          break;
        case 'deepseek':
          await this.configureDeepseek(page, model);
          break;
      }
    } catch (error) {
      logger.warn(`Failed to configure ${productId}:`, error);
      // 继续执行，使用默认配置
    }
  }

  private async configureDoubao(page: Page, model?: string): Promise<void> {
    try {
      // 点击AI编程按钮
      const aiCodingButton = await page.waitForSelector('text=AI编程', { timeout: 5000 });
      if (aiCodingButton) {
        await aiCodingButton.click();
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (error) {
      logger.warn('Failed to configure Doubao:', error);
    }
  }

  private async configureKimi(page: Page, model?: string): Promise<void> {
    try {
      // 如果指定了模型，尝试选择
      if (model && model.toLowerCase().includes('k2')) {
        const modelButton = await page.$('button[class*="model"]');
        if (modelButton) {
          await modelButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
          
          // 查找K2选项
          const k2Option = await page.$('text=K2');
          if (k2Option) {
            await k2Option.click();
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to configure Kimi:', error);
    }
  }

  private async configureQwen(page: Page, model?: string): Promise<void> {
    try {
      // 如果需要特定功能模式，可以在这里配置
      if (model && model.toLowerCase().includes('coder')) {
        const webDevButton = await page.$('button:has-text("Web Dev")');
        if (webDevButton) {
          await webDevButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      logger.warn('Failed to configure Qwen:', error);
    }
  }

  private async configureYuanbao(page: Page, model?: string): Promise<void> {
    try {
      // 选择模型
      if (model) {
        const modelButton = await page.$(`button:has-text("${model}")`);
        if (modelButton) {
          await modelButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      logger.warn('Failed to configure Yuanbao:', error);
    }
  }

  private async configureDeepseek(page: Page, model?: string): Promise<void> {
    try {
      // Deepseek配置（如果能够访问的话）
      // 这里可以添加模型选择逻辑
    } catch (error) {
      logger.warn('Failed to configure Deepseek:', error);
    }
  }

  private async inputQuestion(page: Page, productId: string, question: string): Promise<void> {
    try {
      let inputSelector: string;
      
      switch (productId) {
        case 'doubao':
          inputSelector = 'textarea, input[type="text"], [contenteditable="true"]';
          break;
        case 'kimi':
          inputSelector = 'textarea[placeholder*="Ask"], input[placeholder*="Ask"]';
          break;
        case 'qwen':
          inputSelector = 'textarea, input[placeholder*="help"]';
          break;
        case 'yuanbao':
          inputSelector = 'textarea, input[type="text"]';
          break;
        case 'deepseek':
          inputSelector = 'textarea, input[type="text"]';
          break;
        default:
          inputSelector = 'textarea, input[type="text"], [contenteditable="true"]';
      }

      const inputElement = await page.waitForSelector(inputSelector, { timeout: 10000 });
      
      if (!inputElement) {
        throw new Error('Input element not found');
      }
      
      // 清空输入框并输入问题
      await inputElement.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.type(question);
      
      // 发送问题
      await page.keyboard.press('Enter');
      
      // 或者尝试点击发送按钮
      try {
        const sendButton = await page.$('button[type="submit"], button:has-text("发送"), button:has-text("Send")');
        if (sendButton) {
          await sendButton.click();
        }
      } catch (error) {
        // 忽略发送按钮点击错误，Enter键可能已经生效
      }

    } catch (error) {
      throw new Error(`Failed to input question: ${error}`);
    }
  }

  private async waitForResponse(page: Page, productId: string, timeout: number): Promise<string> {
    try {
      // 等待回答出现
      await new Promise(resolve => setTimeout(resolve, 2000)); // 给AI一些思考时间

      // 根据不同产品的响应区域选择器
      let responseSelector: string;
      
      switch (productId) {
        case 'doubao':
          responseSelector = '[class*="message"], [class*="response"], [class*="answer"]';
          break;
        case 'kimi':
          responseSelector = '[class*="message"], [class*="response"], [class*="content"]';
          break;
        case 'qwen':
          responseSelector = '[class*="message"], [class*="response"], [class*="answer"]';
          break;
        case 'yuanbao':
          responseSelector = '[class*="message"], [class*="response"], [class*="content"]';
          break;
        case 'deepseek':
          responseSelector = '[class*="message"], [class*="response"], [class*="answer"]';
          break;
        default:
          responseSelector = '[class*="message"], [class*="response"], [class*="answer"], [class*="content"]';
      }

      // 等待响应元素出现
      await page.waitForSelector(responseSelector, { timeout: timeout });

      // 等待响应完成（通过检查是否还在生成中）
      let isGenerating = true;
      let attempts = 0;
      const maxAttempts = timeout / 1000; // 每秒检查一次

      while (isGenerating && attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // 检查是否还在生成中
        const generatingIndicators = await page.$$('[class*="generating"], [class*="typing"], [class*="loading"]');
        isGenerating = generatingIndicators.length > 0;
        
        attempts++;
      }

      // 提取响应文本
      const responseElements = await page.$$(responseSelector);
      if (responseElements.length === 0) {
        throw new Error('No response found');
      }

      // 获取最后一个响应（通常是AI的回答）
      const lastResponse = responseElements[responseElements.length - 1];
      const responseText = await page.evaluate(el => (el as HTMLElement).textContent || (el as HTMLElement).innerText, lastResponse);

      if (!responseText || responseText.trim().length === 0) {
        throw new Error('Empty response received');
      }

      return responseText.trim();

    } catch (error) {
      throw new Error(`Failed to get response: ${error}`);
    }
  }

  async askFollowUpQuestion(
    productId: string,
    followUpQuestion: string,
    options: {
      timeout?: number;
      enableScreenshots?: boolean;
    } = {}
  ): Promise<AutomationResult> {
    const startTime = Date.now();
    const screenshots: string[] = [];

    try {
      const page = this.pages.get(productId);
      if (!page) {
        throw new Error(`No active page found for ${productId}`);
      }

      // 输入追问
      await this.inputQuestion(page, productId, followUpQuestion);

      if (options.enableScreenshots) {
        const screenshot = await page.screenshot({ 
          path: `/tmp/screenshot_${productId}_${Date.now()}_followup.png`,
          fullPage: false 
        });
        screenshots.push(`/tmp/screenshot_${productId}_${Date.now()}_followup.png`);
      }

      // 等待回答
      const response = await this.waitForResponse(page, productId, options.timeout || 30000);

      const responseTime = Date.now() - startTime;

      return {
        success: true,
        response,
        screenshots,
        metadata: {
          responseTime,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error(`Error asking follow-up question to ${productId}:`, error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        screenshots,
        metadata: {
          responseTime: Date.now() - startTime,
          timestamp: new Date().toISOString()
        }
      };
    }
  }
}

export const optimizedBrowserAutomationService = new OptimizedBrowserAutomationService();

