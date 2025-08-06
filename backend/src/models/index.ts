// 数据模型定义

export interface UserProfile {
  id: string;
  name: string;
  description: string;
  characteristics: string[];
  questionTemplates: QuestionTemplate[];
}

export interface QuestionTemplate {
  type: QuestionType;
  template: string;
  variables: string[];
}

export interface ProgrammingLanguage {
  id: string;
  name: string;
  description: string;
  commonIssues: string[];
  learningTopics: string[];
}

export interface AIProduct {
  id: string;
  name: string;
  url: string;
  modelConfig: {
    defaultModel: string;
    availableModels: string[];
    specialModes: string[];
  };
  interactionConfig: {
    selectors: {
      modelSelector?: string;
      modeSelector?: string;
      inputField: string;
      submitButton: string;
      responseArea: string;
    };
    waitConditions: {
      pageLoad: number;
      responseGeneration: number;
    };
    specialInstructions?: string[];
  };
}

export interface EvaluationTask {
  id: string;
  name: string;
  description: string;
  userProfile: UserProfile;
  programmingLanguage: ProgrammingLanguage;
  aiProducts: AIProduct[];
  questionTypes: QuestionType[];
  maxFollowUps: number;
  status: TaskStatus;
  createdAt: Date;
  updatedAt: Date;
}

export interface EvaluationSession {
  id: string;
  taskId: string;
  productId: string;
  userProfile: UserProfile;
  programmingLanguage: ProgrammingLanguage;
  questions: Question[];
  responses: AIResponse[];
  scores: ScoringResult[];
  status: SessionStatus;
  startTime: Date;
  endTime?: Date;
}

export interface Question {
  id: string;
  content: string;
  type: QuestionType;
  context: QuestionContext;
  followUpLevel: number;
  parentQuestionId?: string;
  createdAt: Date;
}

export interface QuestionContext {
  userProfile: string;
  programmingLanguage: string;
  previousResponses?: string[];
}

export interface AIResponse {
  id: string;
  questionId: string;
  productId: string;
  content: string;
  metadata: ResponseMetadata;
  screenshot?: string;
  timestamp: Date;
  duration: number;
}

export interface ResponseMetadata {
  model?: string;
  mode?: string;
  responseLength: number;
  hasCodeExamples: boolean;
  hasLinks: boolean;
  confidence?: number;
}

export interface ScoringResult {
  id: string;
  responseId: string;
  score: number;
  reasoning: string;
  criteria: ScoringCriteria;
  analysis: ResponseAnalysis;
  timestamp: Date;
}

export interface ScoringCriteria {
  accuracy: number;
  completeness: number;
  clarity: number;
  usefulness: number;
  codeQuality: number;
}

export interface ResponseAnalysis {
  accuracy: number;
  completeness: number;
  clarity: number;
  usefulness: number;
  codeQuality: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
}

// 枚举类型
export enum QuestionType {
  LEARNING = 'learning',
  PROJECT = 'project',
  DEBUGGING = 'debugging',
  BEST_PRACTICES = 'best_practices',
  PERFORMANCE = 'performance'
}

export enum TaskStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

export enum SessionStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

// API响应格式
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    total?: number;
    page?: number;
    pageSize?: number;
  };
}

// 飞书相关接口
export interface FeishuConfig {
  appId: string;
  appSecret: string;
  tableToken: string;
  tableId: string;
}

export interface FeishuRecord {
  evaluationId: string;
  sessionId: string;
  productName: string;
  productUrl: string;
  modelName: string;
  userProfile: string;
  programmingLanguage: string;
  questionType: string;
  originalQuestion: string;
  followUpCount: number;
  followUpContent?: string;
  aiResponse: string;
  responseScreenshot?: string;
  score: number;
  scoringReason: string;
  questionTime: Date;
  responseTime: Date;
  duration: number;
}

// 配置接口
export interface SystemConfig {
  feishu: FeishuConfig;
  openai: {
    apiKey: string;
    baseUrl?: string;
    model: string;
  };
  browser: {
    headless: boolean;
    timeout: number;
    userAgent?: string;
  };
  scheduler: {
    maxConcurrentTasks: number;
    retryAttempts: number;
    retryDelay: number;
  };
}

