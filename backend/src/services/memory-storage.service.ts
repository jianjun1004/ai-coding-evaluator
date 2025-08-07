/* 内存存储服务 - 替代数据库功能 */

import { v4 as uuidv4 } from 'uuid';
import { EvaluationTask, EvaluationSession, Question, AIResponse, ScoringResult, TaskStatus, SessionStatus } from '../models';

export class MemoryStorageService {
  private static instance: MemoryStorageService;
  
  // 内存存储
  private tasks: Map<string, EvaluationTask> = new Map();
  private sessions: Map<string, EvaluationSession> = new Map();
  private questions: Map<string, Question> = new Map();
  private responses: Map<string, AIResponse> = new Map();
  private scores: Map<string, ScoringResult> = new Map();

  private constructor() {}

  public static getInstance(): MemoryStorageService {
    if (!MemoryStorageService.instance) {
      MemoryStorageService.instance = new MemoryStorageService();
    }
    return MemoryStorageService.instance;
  }

  // 任务管理
  public async createTask(task: EvaluationTask): Promise<EvaluationTask> {
    this.tasks.set(task.id, task);
    return task;
  }

  public async getTask(id: string): Promise<EvaluationTask | null> {
    return this.tasks.get(id) || null;
  }

  public async getTasks(page: number = 1, pageSize: number = 10, status?: string): Promise<{ tasks: EvaluationTask[], total: number }> {
    let filteredTasks = Array.from(this.tasks.values());
    
    if (status) {
      filteredTasks = filteredTasks.filter(task => task.status === status);
    }
    
    const total = filteredTasks.length;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginatedTasks = filteredTasks.slice(startIndex, endIndex);
    
    return { tasks: paginatedTasks, total };
  }

  public async updateTask(id: string, updates: Partial<EvaluationTask>): Promise<EvaluationTask | null> {
    const task = this.tasks.get(id);
    if (!task) return null;
    
    const updatedTask = { ...task, ...updates, updatedAt: new Date() };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  public async deleteTask(id: string): Promise<boolean> {
    // 删除相关数据
    const sessionsToDelete = Array.from(this.sessions.values()).filter(session => session.taskId === id);
    for (const session of sessionsToDelete) {
      await this.deleteSession(session.id);
    }
    
    return this.tasks.delete(id);
  }

  // 会话管理
  public async createSession(session: EvaluationSession): Promise<EvaluationSession> {
    this.sessions.set(session.id, session);
    return session;
  }

  public async getSession(id: string): Promise<EvaluationSession | null> {
    return this.sessions.get(id) || null;
  }

  public async getSessionsByTask(taskId: string): Promise<EvaluationSession[]> {
    return Array.from(this.sessions.values()).filter(session => session.taskId === taskId);
  }

  public async updateSession(id: string, updates: Partial<EvaluationSession>): Promise<EvaluationSession | null> {
    const session = this.sessions.get(id);
    if (!session) return null;
    
    const updatedSession = { ...session, ...updates };
    this.sessions.set(id, updatedSession);
    return updatedSession;
  }

  public async deleteSession(id: string): Promise<boolean> {
    // 删除相关问题
    const questionsToDelete = Array.from(this.questions.values()).filter(question => {
      const session = this.sessions.get(id);
      return session && session.questions.some(q => q.id === question.id);
    });
    
    for (const question of questionsToDelete) {
      await this.deleteQuestion(question.id);
    }
    
    return this.sessions.delete(id);
  }

  // 问题管理
  public async createQuestion(question: Question): Promise<Question> {
    this.questions.set(question.id, question);
    return question;
  }

  public async getQuestion(id: string): Promise<Question | null> {
    return this.questions.get(id) || null;
  }

  public async getQuestionsBySession(sessionId: string): Promise<Question[]> {
    return Array.from(this.questions.values()).filter(question => {
      const session = this.sessions.get(sessionId);
      return session && session.questions.some(q => q.id === question.id);
    });
  }

  public async deleteQuestion(id: string): Promise<boolean> {
    // 删除相关回答
    const responsesToDelete = Array.from(this.responses.values()).filter(response => response.questionId === id);
    for (const response of responsesToDelete) {
      await this.deleteResponse(response.id);
    }
    
    return this.questions.delete(id);
  }

  // 回答管理
  public async createResponse(response: AIResponse): Promise<AIResponse> {
    this.responses.set(response.id, response);
    return response;
  }

  public async getResponse(id: string): Promise<AIResponse | null> {
    return this.responses.get(id) || null;
  }

  public async getResponsesByQuestion(questionId: string): Promise<AIResponse[]> {
    return Array.from(this.responses.values()).filter(response => response.questionId === questionId);
  }

  public async deleteResponse(id: string): Promise<boolean> {
    // 删除相关评分
    const scoresToDelete = Array.from(this.scores.values()).filter(score => score.responseId === id);
    for (const score of scoresToDelete) {
      this.scores.delete(score.id);
    }
    
    return this.responses.delete(id);
  }

  // 评分管理
  public async createScore(score: ScoringResult): Promise<ScoringResult> {
    this.scores.set(score.id, score);
    return score;
  }

  public async getScore(id: string): Promise<ScoringResult | null> {
    return this.scores.get(id) || null;
  }

  public async getScoresByResponse(responseId: string): Promise<ScoringResult[]> {
    return Array.from(this.scores.values()).filter(score => score.responseId === responseId);
  }

  // 工具方法
  public generateId(): string {
    return uuidv4();
  }

  public async clearAll(): Promise<void> {
    this.tasks.clear();
    this.sessions.clear();
    this.questions.clear();
    this.responses.clear();
    this.scores.clear();
  }

  public getStats(): { tasks: number, sessions: number, questions: number, responses: number, scores: number } {
    return {
      tasks: this.tasks.size,
      sessions: this.sessions.size,
      questions: this.questions.size,
      responses: this.responses.size,
      scores: this.scores.size
    };
  }
}
