import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import { ScoringResult, ScoringCriteria, ResponseAnalysis, UserProfile, ProgrammingLanguage } from '../models';
import { log } from '../utils/logger';

export interface ScoringContext {
  userProfile: UserProfile;
  programmingLanguage: ProgrammingLanguage;
  questionType: string;
  originalQuestion: string;
}

export class ScoringEngineService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENROUTER_API_KEY,
      baseURL: process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'
    });
  }

  /**
   * 对AI回答进行评分
   */
  async scoreResponse(
    question: string,
    response: string,
    context: ScoringContext
  ): Promise<ScoringResult> {
    try {
      // 分析回答质量
      const analysis = await this.analyzeResponse(question, response, context);
      
      // 计算综合评分
      const score = this.calculateOverallScore(analysis);
      
      // 生成评分理由
      const reasoning = await this.generateScoringReasoning(question, response, analysis, score, context);

      const scoringResult: ScoringResult = {
        id: uuidv4(),
        responseId: '', // 将在调用方设置
        score,
        reasoning,
        criteria: {
          accuracy: analysis.accuracy,
          completeness: analysis.completeness,
          clarity: analysis.clarity,
          usefulness: analysis.usefulness,
          codeQuality: analysis.codeQuality
        },
        analysis,
        timestamp: new Date()
      };

      log.info('响应评分成功', {
        score,
        accuracy: analysis.accuracy,
        completeness: analysis.completeness,
        clarity: analysis.clarity
      });

      return scoringResult;
    } catch (error) {
      log.error('Failed to score response', { error });
      throw error;
    }
  }

  /**
   * 分析回答质量
   */
  private async analyzeResponse(
    question: string,
    response: string,
    context: ScoringContext
  ): Promise<ResponseAnalysis> {
    try {
      const analysisPrompt = this.buildAnalysisPrompt(question, response, context);
      
      const completion = await this.openai.chat.completions.create({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的编程教育评估专家，擅长从多个维度分析AI编程助手回答的质量。请客观、准确地评估回答质量。'
          },
          {
            role: 'user',
            content: analysisPrompt
          }
        ],
        temperature: 0.3,
        max_tokens: 1000
      });

      const analysisText = completion.choices[0]?.message?.content?.trim();
      if (!analysisText) {
        throw new Error('Failed to get analysis from OpenAI');
      }

      // 解析分析结果
      return this.parseAnalysisResult(analysisText);
    } catch (error) {
      log.error('Failed to analyze response', { error });
      
      // 返回默认分析结果
      return {
        accuracy: 2,
        completeness: 2,
        clarity: 2,
        usefulness: 2,
        codeQuality: 2,
        strengths: ['无法分析'],
        weaknesses: ['分析失败'],
        suggestions: ['请重新评估']
      };
    }
  }

  /**
   * 构建分析提示词
   */
  private buildAnalysisPrompt(
    question: string,
    response: string,
    context: ScoringContext
  ): string {
    return `请分析以下AI编程助手的回答质量：

**用户背景：**
- 用户画像：${context.userProfile.name}
- 编程语言：${context.programmingLanguage.name}
- 问题类型：${context.questionType}

**原始问题：**
${question}

**AI回答：**
${response}

**评估标准：**
请从以下5个维度进行评估，每个维度给出0-4分的评分：

1. **准确性 (Accuracy)**：回答是否正确，是否包含错误信息
   - 0分：完全错误，误导性信息
   - 1分：大部分错误，少量正确信息
   - 2分：部分正确，但有明显错误
   - 3分：基本正确，有小的瑕疵
   - 4分：完全准确，无错误

2. **完整性 (Completeness)**：回答是否全面，是否遗漏重要信息
   - 0分：完全没有回答问题
   - 1分：回答很不完整，遗漏大量重要信息
   - 2分：回答不够完整，遗漏一些重要信息
   - 3分：回答比较完整，遗漏少量信息
   - 4分：回答非常完整，涵盖所有重要方面

3. **清晰度 (Clarity)**：回答是否清晰易懂，结构是否合理
   - 0分：完全无法理解
   - 1分：很难理解，结构混乱
   - 2分：部分清晰，但有些地方难以理解
   - 3分：基本清晰，结构合理
   - 4分：非常清晰，结构完美

4. **实用性 (Usefulness)**：回答对用户是否有实际帮助
   - 0分：完全没有帮助
   - 1分：帮助很小
   - 2分：有一定帮助，但不够实用
   - 3分：比较有用，能解决大部分问题
   - 4分：非常有用，完全解决问题

5. **代码质量 (Code Quality)**：如果包含代码，代码质量如何
   - 0分：代码完全错误或无法运行
   - 1分：代码有严重问题
   - 2分：代码基本可用，但有问题
   - 3分：代码质量良好，有小问题
   - 4分：代码质量优秀，无问题
   - 如果没有代码，请根据技术解释的质量评分

请按以下JSON格式返回分析结果：

\`\`\`json
{
  "accuracy": 分数,
  "completeness": 分数,
  "clarity": 分数,
  "usefulness": 分数,
  "codeQuality": 分数,
  "strengths": ["优点1", "优点2", "优点3"],
  "weaknesses": ["缺点1", "缺点2"],
  "suggestions": ["改进建议1", "改进建议2"]
}
\`\`\``;
  }

  /**
   * 解析分析结果
   */
  private parseAnalysisResult(analysisText: string): ResponseAnalysis {
    try {
      // 提取JSON部分
      const jsonMatch = analysisText.match(/```json\s*([\s\S]*?)\s*```/);
      if (!jsonMatch) {
        throw new Error('No JSON found in analysis result');
      }

      const jsonStr = jsonMatch[1];
      const parsed = JSON.parse(jsonStr);

      return {
        accuracy: this.validateScore(parsed.accuracy),
        completeness: this.validateScore(parsed.completeness),
        clarity: this.validateScore(parsed.clarity),
        usefulness: this.validateScore(parsed.usefulness),
        codeQuality: this.validateScore(parsed.codeQuality),
        strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
        weaknesses: Array.isArray(parsed.weaknesses) ? parsed.weaknesses : [],
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : []
      };
    } catch (error) {
      log.error('Failed to parse analysis result', { error, analysisText });
      
      // 返回默认值
      return {
        accuracy: 2,
        completeness: 2,
        clarity: 2,
        usefulness: 2,
        codeQuality: 2,
        strengths: ['无法解析分析结果'],
        weaknesses: ['解析失败'],
        suggestions: ['请重新分析']
      };
    }
  }

  /**
   * 验证评分是否在有效范围内
   */
  private validateScore(score: any): number {
    const numScore = Number(score);
    if (isNaN(numScore) || numScore < 0 || numScore > 4) {
      return 2; // 默认中等分数
    }
    return Math.round(numScore);
  }

  /**
   * 计算综合评分
   */
  private calculateOverallScore(analysis: ResponseAnalysis): number {
    // 权重配置
    const weights = {
      accuracy: 0.3,      // 准确性最重要
      completeness: 0.25, // 完整性次之
      clarity: 0.2,       // 清晰度
      usefulness: 0.15,   // 实用性
      codeQuality: 0.1    // 代码质量
    };

    let weightedScore = 0;
    weightedScore += analysis.accuracy * weights.accuracy;
    weightedScore += analysis.completeness * weights.completeness;
    weightedScore += analysis.clarity * weights.clarity;
    weightedScore += analysis.usefulness * weights.usefulness;
    weightedScore += analysis.codeQuality * weights.codeQuality;

    return Math.round(weightedScore);
  }

  /**
   * 生成评分理由
   */
  private async generateScoringReasoning(
    question: string,
    response: string,
    analysis: ResponseAnalysis,
    score: number,
    context: ScoringContext
  ): Promise<string> {
    try {
      const reasoningPrompt = `请为以下AI回答评分生成详细的评分理由：

**问题：** ${question}

**AI回答：** ${response.substring(0, 500)}${response.length > 500 ? '...' : ''}

**评分详情：**
- 准确性：${analysis.accuracy}/4
- 完整性：${analysis.completeness}/4
- 清晰度：${analysis.clarity}/4
- 实用性：${analysis.usefulness}/4
- 代码质量：${analysis.codeQuality}/4
- 综合评分：${score}/4

**优点：** ${analysis.strengths.join('、')}
**缺点：** ${analysis.weaknesses.join('、')}

请生成一段150-300字的评分理由，说明为什么给出这个分数，重点说明：
1. 回答的主要优点和亮点
2. 存在的问题和不足
3. 对于${context.userProfile.name}这类用户的适用性
4. 总体评价

要求：
- 语言客观、专业
- 结构清晰，逻辑性强
- 针对具体内容进行评价
- 避免空泛的表述`;

      const completion = await this.openai.chat.completions.create({
        model: 'deepseek/deepseek-chat-v3-0324:free',
        messages: [
          {
            role: 'system',
            content: '你是一个专业的编程教育评估专家，擅长撰写客观、详细的评分理由。'
          },
          {
            role: 'user',
            content: reasoningPrompt
          }
        ],
        temperature: 0.4,
        max_tokens: 400
      });

      const reasoning = completion.choices[0]?.message?.content?.trim();
      return reasoning || this.generateDefaultReasoning(score, analysis);
    } catch (error) {
      log.error('Failed to generate scoring reasoning', { error });
      return this.generateDefaultReasoning(score, analysis);
    }
  }

  /**
   * 生成默认评分理由
   */
  private generateDefaultReasoning(score: number, analysis: ResponseAnalysis): string {
    const scoreDescriptions: Record<number, string> = {
      0: '完全不可用',
      1: '不可用，存在大量错误内容',
      2: '不可用，存在少量错误内容',
      3: '可用，存在可提升空间',
      4: '满分'
    };

    const description = scoreDescriptions[score] || '评分异常';
    
    let reasoning = `综合评分：${score}/4分（${description}）。`;
    
    if (analysis.strengths.length > 0) {
      reasoning += `主要优点包括：${analysis.strengths.join('、')}。`;
    }
    
    if (analysis.weaknesses.length > 0) {
      reasoning += `存在的问题：${analysis.weaknesses.join('、')}。`;
    }
    
    if (analysis.suggestions.length > 0) {
      reasoning += `改进建议：${analysis.suggestions.join('、')}。`;
    }

    return reasoning;
  }

  /**
   * 批量评分
   */
  async batchScore(
    evaluations: Array<{
      question: string;
      response: string;
      context: ScoringContext;
    }>
  ): Promise<ScoringResult[]> {
    const results: ScoringResult[] = [];
    
    for (const evaluation of evaluations) {
      try {
        const result = await this.scoreResponse(
          evaluation.question,
          evaluation.response,
          evaluation.context
        );
        results.push(result);
        
        // 添加延迟以避免API限流
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        log.error('Failed to score response in batch', { error });
      }
    }
    
    return results;
  }

  /**
   * 获取评分统计
   */
  getScoreStatistics(scores: ScoringResult[]): {
    averageScore: number;
    distribution: Record<number, number>;
    criteriaAverages: ScoringCriteria;
  } {
    if (scores.length === 0) {
      return {
        averageScore: 0,
        distribution: { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 },
        criteriaAverages: {
          accuracy: 0,
          completeness: 0,
          clarity: 0,
          usefulness: 0,
          codeQuality: 0
        }
      };
    }

    const totalScore = scores.reduce((sum, score) => sum + score.score, 0);
    const averageScore = totalScore / scores.length;

    const distribution: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
    scores.forEach(score => {
      distribution[score.score] = (distribution[score.score] || 0) + 1;
    });

    const criteriaAverages: ScoringCriteria = {
      accuracy: scores.reduce((sum, s) => sum + s.criteria.accuracy, 0) / scores.length,
      completeness: scores.reduce((sum, s) => sum + s.criteria.completeness, 0) / scores.length,
      clarity: scores.reduce((sum, s) => sum + s.criteria.clarity, 0) / scores.length,
      usefulness: scores.reduce((sum, s) => sum + s.criteria.usefulness, 0) / scores.length,
      codeQuality: scores.reduce((sum, s) => sum + s.criteria.codeQuality, 0) / scores.length
    };

    return {
      averageScore: Math.round(averageScore * 100) / 100,
      distribution,
      criteriaAverages
    };
  }
}

