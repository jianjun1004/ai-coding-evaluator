import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { Question, QuestionType, UserProfile, ProgrammingLanguage, QuestionContext } from '../models';
import { log } from '../utils/logger';

export class QuestionGeneratorService {
  private openai: OpenAI;

  constructor() {
    // 验证API密钥配置
    this.validateApiKey();
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    });
  }

  /**
   * 验证API密钥配置
   */
  private validateApiKey(): void {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey || apiKey === 'your_openrouter_api_key_here') {
      throw new Error('OpenRouter API密钥未配置。请在.env文件中设置OPENROUTER_API_KEY');
    }
  }

  /**
   * 生成初始问题
   */
  async generateInitialQuestion(
    profile: UserProfile,
    language: ProgrammingLanguage,
    questionType: string
  ): Promise<Question[]> {
    try {
      const prompt = this.buildInitialQuestionPrompt(profile, language, questionType);
      const response = await this.openai.chat.completions.create({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'system',
            content: '画像是你的角色，根据画像和编程语言生成10个出现在开发工作中常见的问题。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7,
        max_tokens: 500
      });

      const questionContent = response.choices[0]?.message?.content?.trim();
      if (!questionContent) {
        throw new Error('Failed to generate question content');
      }

      // 将包含多个问题的字符串拆分成数组
      const questions = this.parseQuestionsFromContent(questionContent, questionType, profile, language);
      
      return questions;
    } catch (error: any) {
      log.error('Failed to generate initial question', { error, profile: profile.name, language: language.name });
      
      // 提供更详细的错误信息
      if (error?.status === 401) {
        throw new Error('OpenRouter API认证失败。请检查API密钥是否正确配置');
      } else if (error?.status === 429) {
        throw new Error('API请求频率过高，请稍后重试');
      } else if (error?.status === 500) {
        throw new Error('OpenRouter服务暂时不可用，请稍后重试');
      } else {
        throw new Error(`生成问题失败: ${error?.message || '未知错误'}`);
      }
    }
  }

  /**
   * 生成追问
   */
  async generateFollowUp(
    originalQuestion: string,
    aiResponse: string,
    followUpCount: number,
    context: QuestionContext
  ): Promise<Question | null> {
    try {
      // 如果已经达到最大追问次数，返回null
      if (followUpCount >= 3) {
        return null;
      }

      // 分析是否需要追问
      const needsFollowUp = await this.analyzeNeedForFollowUp(originalQuestion, aiResponse);
      if (!needsFollowUp) {
        return null;
      }

      const prompt = this.buildFollowUpPrompt(originalQuestion, aiResponse, followUpCount, context);
      
      const response = await this.openai.chat.completions.create({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的编程教育专家，擅长根据AI回答的内容生成有针对性的追问，以获得更深入或更实用的信息。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.6,
        max_tokens: 300
      });

      const followUpContent = response.choices[0]?.message?.content?.trim();
      if (!followUpContent) {
        return null;
      }

      const followUpQuestion: Question = {
        id: uuidv4(),
        content: followUpContent,
        type: this.inferQuestionType(followUpContent),
        context: {
          ...context,
          previousResponses: [aiResponse]
        },
        followUpLevel: followUpCount + 1,
        createdAt: new Date()
      };

      log.info('Generated follow-up question', {
        questionId: followUpQuestion.id,
        followUpLevel: followUpQuestion.followUpLevel,
        context: context.userProfile
      });

      return followUpQuestion;
    } catch (error) {
      log.error('Failed to generate follow-up question', { error, followUpCount });
      return null;
    }
  }

  /**
   * 构建初始问题生成的提示词
   */
  private buildInitialQuestionPrompt(
    profile: UserProfile,
    language: ProgrammingLanguage,
    questionType: string
  ): string {
    const profileContext = `用户画像：${profile.name}
用户特征：${profile.characteristics.join('、')}`;

    const languageContext = `编程语言：${language.name}
常见问题领域：${language.commonIssues.join('、')}
学习主题：${language.learningTopics.join('、')}`;

    return `请根据以下信息生成一个高质量的编程问题：

${profileContext}

${languageContext}

问题类型：${questionType}

要求：
1. 问题应该符合用户画像的特点和需求
2. 问题应该与指定的编程语言相关
3. 问题应该属于指定的问题类型
4. 问题应该具有实际意义，能够测试AI编程助手的能力
5. 问题描述要清晰、具体，避免过于宽泛
6. 问题长度控制在50-150字之间

请直接返回问题内容，不需要额外的解释。`;
  }

  /**
   * 构建追问生成的提示词
   */
  private buildFollowUpPrompt(
    originalQuestion: string,
    aiResponse: string,
    followUpCount: number,
    context: QuestionContext
  ): string {
    return `请根据以下对话内容生成一个有针对性的追问：

用户画像：${context.userProfile}
编程语言：${context.programmingLanguage}

原始问题：
${originalQuestion}

AI回答：
${aiResponse}

当前追问轮次：${followUpCount + 1}/3

请生成一个追问，要求：
1. 基于AI的回答内容，提出更深入或更具体的问题
2. 追问应该有助于获得更实用的信息或更好的解决方案
3. 追问应该符合用户画像的特点
4. 追问长度控制在30-100字之间
5. 避免重复之前已经问过的内容

如果AI的回答已经很完整，不需要追问，请返回"无需追问"。
否则请直接返回追问内容，不需要额外的解释。`;
  }

  /**
   * 分析是否需要追问
   */
  private async analyzeNeedForFollowUp(originalQuestion: string, aiResponse: string): Promise<boolean> {
    try {
      const analysisPrompt = `请分析以下AI回答是否需要追问：

原始问题：${originalQuestion}

AI回答：${aiResponse}

请从以下角度分析：
1. 回答是否完整和详细
2. 是否提供了具体的代码示例
3. 是否解释了相关概念
4. 是否给出了实用的建议
5. 是否还有可以深入探讨的方面

请回答"需要追问"或"无需追问"，并简要说明理由。`;

      const response = await this.openai.chat.completions.create({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的编程教育评估专家，擅长判断AI回答的完整性和是否需要进一步追问。'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 200
      });

      const analysis = response.choices[0]?.message?.content?.trim() || '';
      return analysis.includes('需要追问');
    } catch (error) {
      log.error('Failed to analyze need for follow-up', { error });
      // 默认情况下进行追问
      return true;
    }
  }

  /**
   * 解析包含多个问题的内容字符串，拆分成独立的问题对象数组
   */
  private parseQuestionsFromContent(
    content: string, 
    questionType: string, 
    profile: UserProfile, 
    language: ProgrammingLanguage
  ): Question[] {
    const questions: Question[] = [];
    
    // 使用正则表达式匹配所有数字编号的问题
    const questionRegex = /(\d+\.\s+)([^]*?)(?=\d+\.\s+|$)/g;
    let match;
    
    while ((match = questionRegex.exec(content)) !== null) {
      const questionContent = match[2].trim();
      if (questionContent.length > 0) {
        const question: Question = {
          id: uuidv4(),
          content: questionContent,
          type: questionType,
          context: {
            userProfile: profile.name,
            programmingLanguage: language.name
          },
          followUpLevel: 0,
          createdAt: new Date()
        };
        questions.push(question);
      }
    }
    
    // 如果没有通过正则匹配成功，尝试其他分割方式
    if (questions.length === 0) {
      // 尝试按换行符分割
      const lines = content.split('\n').filter(line => line.trim().length > 0);
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.length > 0) {
          const question: Question = {
            id: uuidv4(),
            content: trimmedLine,
            type: questionType,
            context: {
              userProfile: profile.name,
              programmingLanguage: language.name
            },
            followUpLevel: 0,
            createdAt: new Date()
          };
          questions.push(question);
        }
      });
    }
    
    console.log('questions==========》1', questions)  
    
    return questions;
  }

  /**
   * 根据问题内容推断问题类型
   */
  private inferQuestionType(questionContent: string): string {
    const content = questionContent.toLowerCase();
    
    if (content.includes('学习') || content.includes('入门') || content.includes('基础')) {
      return 'learning';
    } else if (content.includes('项目') || content.includes('开发') || content.includes('实现')) {
      return 'project';
    } else if (content.includes('错误') || content.includes('调试') || content.includes('问题')) {
      return 'debugging';
    } else if (content.includes('最佳') || content.includes('规范') || content.includes('建议')) {
      return 'best_practices';
    } else if (content.includes('性能') || content.includes('优化') || content.includes('效率')) {
      return 'performance';
    }
    
    return 'learning'; // 默认类型
  }

  /**
   * 批量生成问题
   */
  async generateQuestionBatch(
    profile: UserProfile,
    language: ProgrammingLanguage,
    questionTypes: string[],
    count: number = 1
  ): Promise<Question[]> {
    const questions: Question[] = [];
    
    for (const questionType of questionTypes) {
      try {
        const questionArray = await this.generateInitialQuestion(profile, language, questionType);
        
        // 将返回的问题数组添加到总数组中
        questions.push(...questionArray);
        
        // 添加延迟以避免API限流
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error: any) {
        log.error('Failed to generate question in batch', { error, questionType});
        // 如果是认证错误，直接抛出，避免继续尝试
        if (error?.status === 401) {
          throw new Error('OpenRouter API认证失败。请检查API密钥是否正确配置');
        }
      }
    }
    console.log('generateQuestionBatch 最终返回问题数量:', questions.length);
    return questions;
  }
}

