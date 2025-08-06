import axios, { AxiosInstance } from 'axios';
import { FeishuConfig, FeishuRecord } from '../models';
import { log } from '../utils/logger';

export interface FeishuAccessToken {
  access_token: string;
  expires_in: number;
  token_type: string;
}

export interface FeishuTableInfo {
  app_token: string;
  table_id: string;
  name: string;
  revision: number;
}

export interface FeishuField {
  field_id: string;
  field_name: string;
  type: number;
  property: any;
}

export class FeishuIntegrationService {
  private config: FeishuConfig;
  private httpClient: AxiosInstance;
  private accessToken: string | null = null;
  private tokenExpiry: number = 0;

  constructor(config: FeishuConfig) {
    this.config = config;
    this.httpClient = axios.create({
      baseURL: 'https://open.feishu.cn/open-apis',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json'
      }
    });

    // 添加请求拦截器，自动添加认证头
    this.httpClient.interceptors.request.use(async (config) => {
      const token = await this.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // 添加响应拦截器，处理错误
    this.httpClient.interceptors.response.use(
      (response) => response,
      (error) => {
        log.error('Feishu API request failed', {
          url: error.config?.url,
          status: error.response?.status,
          data: error.response?.data
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取访问令牌
   */
  private async getAccessToken(): Promise<string> {
    // 检查当前token是否有效
    if (this.accessToken && Date.now() < this.tokenExpiry) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(
        'https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal',
        {
          app_id: this.config.appId,
          app_secret: this.config.appSecret
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to get access token: ${response.data.msg}`);
      }

      const tokenData: FeishuAccessToken = response.data;
      this.accessToken = tokenData.access_token;
      // 提前5分钟过期，确保token有效性
      this.tokenExpiry = Date.now() + (tokenData.expires_in - 300) * 1000;

      log.info('Feishu access token obtained successfully');
      return this.accessToken;
    } catch (error) {
      log.error('Failed to get Feishu access token', { error });
      throw error;
    }
  }

  /**
   * 获取表格信息
   */
  async getTableInfo(): Promise<FeishuTableInfo> {
    try {
      const response = await this.httpClient.get(
        `/bitable/v1/apps/${this.config.tableToken}/tables/${this.config.tableId}`
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to get table info: ${response.data.msg}`);
      }

      return response.data.data.table;
    } catch (error) {
      log.error('Failed to get table info', { error });
      throw error;
    }
  }

  /**
   * 获取表格字段信息
   */
  async getTableFields(): Promise<FeishuField[]> {
    try {
      const response = await this.httpClient.get(
        `/bitable/v1/apps/${this.config.tableToken}/tables/${this.config.tableId}/fields`
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to get table fields: ${response.data.msg}`);
      }

      return response.data.data.items;
    } catch (error) {
      log.error('Failed to get table fields', { error });
      throw error;
    }
  }

  /**
   * 写入评测记录
   */
  async writeEvaluationRecord(record: FeishuRecord): Promise<string> {
    try {
      const payload = {
        fields: this.transformRecordToFeishuFormat(record)
      };

      const response = await this.httpClient.post(
        `/bitable/v1/apps/${this.config.tableToken}/tables/${this.config.tableId}/records`,
        payload
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to write record: ${response.data.msg}`);
      }

      const recordId = response.data.data.record.record_id;
      
      log.info('Evaluation record written successfully', {
        recordId,
        evaluationId: record.evaluationId,
        productName: record.productName
      });

      return recordId;
    } catch (error) {
      log.error('Failed to write evaluation record', { error, record });
      throw error;
    }
  }

  /**
   * 批量写入评测记录
   */
  async batchWriteEvaluationRecords(records: FeishuRecord[]): Promise<string[]> {
    const recordIds: string[] = [];
    
    // 飞书API限制每次最多写入500条记录，这里分批处理
    const batchSize = 100;
    
    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);
      
      try {
        const payload = {
          records: batch.map(record => ({
            fields: this.transformRecordToFeishuFormat(record)
          }))
        };

        const response = await this.httpClient.post(
          `/bitable/v1/apps/${this.config.tableToken}/tables/${this.config.tableId}/records/batch_create`,
          payload
        );

        if (response.data.code !== 0) {
          throw new Error(`Failed to batch write records: ${response.data.msg}`);
        }

        const batchRecordIds = response.data.data.records.map((r: any) => r.record_id);
        recordIds.push(...batchRecordIds);

        log.info('Batch evaluation records written successfully', {
          batchSize: batch.length,
          totalWritten: recordIds.length
        });

        // 添加延迟以避免API限流
        if (i + batchSize < records.length) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      } catch (error) {
        log.error('Failed to write batch records', { error, batchIndex: Math.floor(i / batchSize) });
        throw error;
      }
    }

    return recordIds;
  }

  /**
   * 更新评测记录
   */
  async updateEvaluationRecord(recordId: string, updates: Partial<FeishuRecord>): Promise<void> {
    try {
      const payload = {
        fields: this.transformRecordToFeishuFormat(updates as FeishuRecord)
      };

      const response = await this.httpClient.put(
        `/bitable/v1/apps/${this.config.tableToken}/tables/${this.config.tableId}/records/${recordId}`,
        payload
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to update record: ${response.data.msg}`);
      }

      log.info('Evaluation record updated successfully', { recordId });
    } catch (error) {
      log.error('Failed to update evaluation record', { error, recordId });
      throw error;
    }
  }

  /**
   * 查询评测记录
   */
  async queryEvaluationRecords(filter?: string, pageSize: number = 100): Promise<any[]> {
    try {
      const params: any = {
        page_size: pageSize
      };

      if (filter) {
        params.filter = filter;
      }

      const response = await this.httpClient.get(
        `/bitable/v1/apps/${this.config.tableToken}/tables/${this.config.tableId}/records`,
        { params }
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to query records: ${response.data.msg}`);
      }

      return response.data.data.items;
    } catch (error) {
      log.error('Failed to query evaluation records', { error });
      throw error;
    }
  }

  /**
   * 删除评测记录
   */
  async deleteEvaluationRecord(recordId: string): Promise<void> {
    try {
      const response = await this.httpClient.delete(
        `/bitable/v1/apps/${this.config.tableToken}/tables/${this.config.tableId}/records/${recordId}`
      );

      if (response.data.code !== 0) {
        throw new Error(`Failed to delete record: ${response.data.msg}`);
      }

      log.info('Evaluation record deleted successfully', { recordId });
    } catch (error) {
      log.error('Failed to delete evaluation record', { error, recordId });
      throw error;
    }
  }

  /**
   * 将记录转换为飞书格式
   */
  private transformRecordToFeishuFormat(record: FeishuRecord): any {
    return {
      '评测ID': record.evaluationId,
      '会话ID': record.sessionId,
      '产品名称': record.productName,
      '产品URL': record.productUrl,
      '模型名称': record.modelName,
      '用户画像': record.userProfile,
      '编程语言': record.programmingLanguage,
      '问题类型': record.questionType,
      '原始问题': record.originalQuestion,
      '追问次数': record.followUpCount,
      '追问内容': record.followUpContent || '',
      'AI回答': record.aiResponse,
      '回答截图': record.responseScreenshot || '',
      '评分': record.score,
      '评分理由': record.scoringReason,
      '提问时间': this.formatDateTime(record.questionTime),
      '回答时间': this.formatDateTime(record.responseTime),
      '耗时 (秒)': record.duration
    };
  }

  /**
   * 格式化日期时间
   */
  private formatDateTime(date: Date): string {
    return date.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
  }

  /**
   * 测试连接
   */
  async testConnection(): Promise<boolean> {
    try {
      await this.getAccessToken();
      await this.getTableInfo();
      log.info('Feishu connection test successful');
      return true;
    } catch (error) {
      log.error('Feishu connection test failed', { error });
      return false;
    }
  }

  /**
   * 获取表格统计信息
   */
  async getTableStatistics(): Promise<{
    totalRecords: number;
    lastUpdateTime: string;
  }> {
    try {
      const records = await this.queryEvaluationRecords(undefined, 1);
      const tableInfo = await this.getTableInfo();

      return {
        totalRecords: records.length,
        lastUpdateTime: new Date().toISOString()
      };
    } catch (error) {
      log.error('Failed to get table statistics', { error });
      throw error;
    }
  }

  /**
   * 导出评测数据
   */
  async exportEvaluationData(filter?: string): Promise<any[]> {
    try {
      const allRecords: any[] = [];
      let hasMore = true;
      let pageToken = '';

      while (hasMore) {
        const params: any = {
          page_size: 500
        };

        if (filter) {
          params.filter = filter;
        }

        if (pageToken) {
          params.page_token = pageToken;
        }

        const response = await this.httpClient.get(
          `/bitable/v1/apps/${this.config.tableToken}/tables/${this.config.tableId}/records`,
          { params }
        );

        if (response.data.code !== 0) {
          throw new Error(`Failed to export data: ${response.data.msg}`);
        }

        allRecords.push(...response.data.data.items);
        hasMore = response.data.data.has_more;
        pageToken = response.data.data.page_token;
      }

      log.info('Evaluation data exported successfully', { totalRecords: allRecords.length });
      return allRecords;
    } catch (error) {
      log.error('Failed to export evaluation data', { error });
      throw error;
    }
  }
}

