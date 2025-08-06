import puppeteer, { Browser, Page } from 'puppeteer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';
import { AIProduct, AIResponse, ResponseMetadata } from '../models';
import { log } from '../utils/logger';

export interface InteractionConfig {
  model?: string;
  mode?: string;
  timeout?: number;
  retryAttempts?: number;
}

export class BrowserAutomationService {
  private browser: Browser | null = null;
  private pages: Map<string, Page> = new Map();
  private screenshotDir: string;

  constructor() {
    this.screenshotDir = path.join(__dirname, '../../screenshots');
    this.ensureScreenshotDir();
  }

  private ensureScreenshotDir(): void {
    if (!fs.existsSync(this.screenshotDir)) {
      fs.mkdirSync(this.screenshotDir, { recursive: true });
    }
  }

  /**
   * 初始化浏览器
   */
  async initBrowser(): Promise<void> {
    if (this.browser) {
      return;
    }

    try {
      this.browser = await puppeteer.launch({
        headless: process.env.NODE_ENV === 'production',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        defaultViewport: {
          width: 1366,
          height: 768
        }
      });

      log.info('Browser initialized successfully');
    } catch (error) {
      log.error('Failed to initialize browser', { error });
      throw error;
    }
  }

  /**
   * 与AI产品进行交互
   */
  async interactWithAIProduct(
    product: AIProduct,
    question: string,
    config: InteractionConfig = {}
  ): Promise<AIResponse> {
    if (!this.browser) {
      await this.initBrowser();
    }

    const startTime = Date.now();
    let page: Page | null = null;

    try {
      // 获取或创建页面
      page = await this.getOrCreatePage(product.id);
      
      // 导航到产品页面
      await this.navigateToProduct(page, product);
      
      // 配置产品（选择模型、模式等）
      await this.configureProduct(page, product, config);
      
      // 输入问题并提交
      await this.submitQuestion(page, product, question);
      
      // 等待并获取回答
      const responseContent = await this.waitForResponse(page, product);
      
      // 保存截图
      const screenshot = await this.saveScreenshot(page, product.id);
      
      // 提取元数据
      const metadata = await this.extractMetadata(page, product);
      
      const endTime = Date.now();
      const duration = Math.round((endTime - startTime) / 1000);

      const response: AIResponse = {
        id: uuidv4(),
        questionId: '', // 将在调用方设置
        productId: product.id,
        content: responseContent,
        metadata,
        screenshot,
        timestamp: new Date(),
        duration
      };

      log.info('Successfully interacted with AI product', {
        productId: product.id,
        duration,
        responseLength: responseContent.length
      });

      return response;
    } catch (error: any) {
      log.error('Failed to interact with AI product', {
        productId: product.id,
        error: error?.message || 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * 获取或创建页面
   */
  private async getOrCreatePage(productId: string): Promise<Page> {
    let page = this.pages.get(productId);
    
    if (!page || page.isClosed()) {
      if (!this.browser) {
        throw new Error('Browser not initialized');
      }
      
      page = await this.browser.newPage();
      
      // 设置用户代理
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // 设置额外的请求头
      await page.setExtraHTTPHeaders({
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
      });
      
      this.pages.set(productId, page);
    }
    
    return page;
  }

  /**
   * 导航到产品页面
   */
  private async navigateToProduct(page: Page, product: AIProduct): Promise<void> {
    try {
      await page.goto(product.url, {
        waitUntil: 'networkidle2',
        timeout: product.interactionConfig.waitConditions.pageLoad
      });

      // 等待页面完全加载
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      log.info('Navigated to product page', { productId: product.id, url: product.url });
    } catch (error: any) {
      log.error('Failed to navigate to product page', {
        productId: product.id,
        url: product.url,
        error: error?.message || 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * 配置产品（选择模型、模式等）
   */
  private async configureProduct(page: Page, product: AIProduct, config: InteractionConfig): Promise<void> {
    try {
      // 根据产品特殊指令进行配置
      if (product.interactionConfig.specialInstructions) {
        for (const instruction of product.interactionConfig.specialInstructions) {
          await this.executeSpecialInstruction(page, product, instruction, config);
        }
      }

      // 选择模型
      if (config.model && product.interactionConfig.selectors.modelSelector) {
        await this.selectModel(page, product, config.model);
      }

      // 选择模式
      if (config.mode && product.interactionConfig.selectors.modeSelector) {
        await this.selectMode(page, product, config.mode);
      }

      log.info('Product configured successfully', {
        productId: product.id,
        model: config.model,
        mode: config.mode
      });
      } catch (error: any) {
        log.error('Failed to configure product', {
          productId: product.id,
          error: error?.message || 'Unknown error'
        });
        // 配置失败不应该阻止整个流程，记录错误并继续
      }
  }

  /**
   * 执行特殊指令
   */
  private async executeSpecialInstruction(
    page: Page,
    product: AIProduct,
    instruction: string,
    config: InteractionConfig
  ): Promise<void> {
    try {
      if (instruction.includes('点击AI编程')) {
        // 豆包：点击AI编程按钮
        await page.waitForSelector('[data-testid="ai-coding-button"], .ai-coding-btn, [aria-label*="AI编程"]', { timeout: 5000 });
        await page.click('[data-testid="ai-coding-button"], .ai-coding-btn, [aria-label*="AI编程"]');
        await new Promise(resolve => setTimeout(resolve, 1000));
      } else if (instruction.includes('深度思考')) {
        // 开启深度思考
        const toggleSelector = '[data-testid="deep-think-toggle"], .deep-think-toggle, [aria-label*="深度思考"]';
        try {
          await page.waitForSelector(toggleSelector, { timeout: 3000 });
          const isEnabled = await page.$eval(toggleSelector, el => el.classList.contains('enabled') || el.getAttribute('aria-checked') === 'true');
          if (!isEnabled) {
            await page.click(toggleSelector);
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        } catch (e) {
          log.warn('Deep think toggle not found or already enabled', { productId: product.id });
        }
      } else if (instruction.includes('@AI编程')) {
        // 元宝：需要在输入框前加@AI编程
        // 这个会在submitQuestion中处理
      } else if (instruction.includes('选择') && instruction.includes('模型')) {
        // 模型选择会在selectModel中处理
      }
    } catch (error: any) {
      log.warn('Failed to execute special instruction', {
        productId: product.id,
        instruction,
        error: error?.message || 'Unknown error'
      });
    }
  }

  /**
   * 选择模型
   */
  private async selectModel(page: Page, product: AIProduct, model: string): Promise<void> {
    try {
      const selector = product.interactionConfig.selectors.modelSelector;
      if (!selector) return;

      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);
      await new Promise(resolve => setTimeout(resolve, 500));

      // 查找并点击指定模型
      const modelOption = await page.$(`[data-value="${model}"], [title="${model}"], ::-p-text(${model})`);
      if (modelOption) {
        await modelOption.click();
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      log.warn('Failed to select model', {
        productId: product.id,
        model,
        error: error?.message || 'Unknown error'
      });
    }
  }

  /**
   * 选择模式
   */
  private async selectMode(page: Page, product: AIProduct, mode: string): Promise<void> {
    try {
      const selector = product.interactionConfig.selectors.modeSelector;
      if (!selector) return;

      await page.waitForSelector(selector, { timeout: 5000 });
      
      // 检查是否已经启用
      const isEnabled = await page.$eval(selector, el => 
        el.classList.contains('enabled') || 
        el.getAttribute('aria-checked') === 'true' ||
        el.getAttribute('data-state') === 'checked'
      );

      if (!isEnabled) {
        await page.click(selector);
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      log.warn('Failed to select mode', {
        productId: product.id,
        mode,
        error: error?.message || 'Unknown error'
      });
    }
  }

  /**
   * 提交问题
   */
  private async submitQuestion(page: Page, product: AIProduct, question: string): Promise<void> {
    try {
      const inputSelector = product.interactionConfig.selectors.inputField;
      const submitSelector = product.interactionConfig.selectors.submitButton;

      // 等待输入框出现
      await page.waitForSelector(inputSelector, { timeout: 10000 });

      // 清空输入框
      await page.click(inputSelector);
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Delete');

      // 处理特殊前缀（如元宝的@AI编程）
      let finalQuestion = question;
      if (product.id === 'yuanbao') {
        finalQuestion = '@AI编程 ' + question;
      }

      // 输入问题
      await page.type(inputSelector, finalQuestion, { delay: 50 });
      await new Promise(resolve => setTimeout(resolve, 500));

      // 提交问题
      await page.click(submitSelector);
      
      log.info('Question submitted successfully', {
        productId: product.id,
        questionLength: question.length
      });
    } catch (error: any) {
      log.error('Failed to submit question', {
        productId: product.id,
        error: error?.message || 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * 等待并获取回答
   */
  private async waitForResponse(page: Page, product: AIProduct): Promise<string> {
    try {
      const responseSelector = product.interactionConfig.selectors.responseArea;
      const timeout = product.interactionConfig.waitConditions.responseGeneration;

      // 等待回答出现
      await page.waitForSelector(responseSelector, { timeout });

      // 等待回答完成（检查是否还在生成中）
      let attempts = 0;
      const maxAttempts = Math.floor(timeout / 2000);

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // 检查是否还在生成中
        const isGenerating = await page.evaluate(() => {
          // 查找常见的生成中指示器
          const indicators = [
            '.generating',
            '.loading',
            '.thinking',
            '[data-generating="true"]',
            '.cursor-blink'
          ];
          
          return indicators.some(selector => document.querySelector(selector));
        });

        if (!isGenerating) {
          break;
        }
        
        attempts++;
      }

      // 获取最新的回答内容
      const responseContent = await page.evaluate((selector) => {
        const elements = document.querySelectorAll(selector);
        if (elements.length === 0) return '';
        
        // 获取最后一个回答元素
        const lastElement = elements[elements.length - 1];
        return lastElement.textContent || (lastElement as any).innerText || '';
      }, responseSelector);

      if (!responseContent.trim()) {
        throw new Error('Empty response received');
      }

      log.info('Response received successfully', {
        productId: product.id,
        responseLength: responseContent.length
      });

      return responseContent.trim();
    } catch (error: any) {
      log.error('Failed to get response', {
        productId: product.id,
        error: error?.message || 'Unknown error'
      });
      throw error;
    }
  }

  /**
   * 保存截图
   */
  private async saveScreenshot(page: Page, productId: string): Promise<string> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `${productId}_${timestamp}.png`;
      const filepath = path.join(this.screenshotDir, filename);

      await page.screenshot({
        path: filepath as `${string}.png`,
        fullPage: true
      });

      log.info('Screenshot saved', { productId, filepath });
      return filepath;
    } catch (error: any) {
      log.error('Failed to save screenshot', {
        productId,
        error: error?.message || 'Unknown error'
      });
      return '';
    }
  }

  /**
   * 提取元数据
   */
  private async extractMetadata(page: Page, product: AIProduct): Promise<ResponseMetadata> {
    try {
      const metadata = await page.evaluate(() => {
        const responseElements = document.querySelectorAll('.message-content, .chat-message, .response');
        const lastResponse = responseElements[responseElements.length - 1];
        
        if (!lastResponse) {
          return {
            responseLength: 0,
            hasCodeExamples: false,
            hasLinks: false
          };
        }

        const text = lastResponse.textContent || '';
        const html = lastResponse.innerHTML || '';

        return {
          responseLength: text.length,
          hasCodeExamples: html.includes('<code>') || html.includes('```') || /```[\s\S]*?```/.test(text),
          hasLinks: html.includes('<a ') || /https?:\/\/[^\s]+/.test(text)
        };
      });

      return {
        model: product.modelConfig.defaultModel,
        mode: product.modelConfig.specialModes[0] || '',
        ...metadata
      };
    } catch (error: any) {
      log.error('Failed to extract metadata', {
        productId: product.id,
        error: error?.message || 'Unknown error'
      });
      
      return {
        responseLength: 0,
        hasCodeExamples: false,
        hasLinks: false
      };
    }
  }

  /**
   * 关闭浏览器
   */
  async closeBrowser(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
        this.pages.clear();
        log.info('Browser closed successfully');
      }
    } catch (error) {
      log.error('Failed to close browser', { error });
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await this.closeBrowser();
  }
}

