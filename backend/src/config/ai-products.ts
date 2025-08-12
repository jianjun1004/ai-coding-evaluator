import { AIProduct, UserProfile, ProgrammingLanguage } from '../models';

export const AI_PRODUCTS: AIProduct[] = [
  {
    id: 'doubao',
    name: '豆包',
    url: 'https://www.doubao.com/chat/',
    modelConfig: {
      defaultModel: '自动',
      availableModels: ['自动'],
      specialModes: ['深度思考']
    },
    interactionConfig: {
      selectors: {
        modeSelector: '[data-testid="skill_bar_button_16"]', // AI编程按钮
        inputField: '[data-slate-editor="true"]', // Slate.js富文本编辑器
        submitButton: 'button[type="button"]',
        responseArea: '#flow-end-msg-send'
      },
      waitConditions: {
        pageLoad: 5000,
        responseGeneration: 30000
      },
      specialInstructions: [
        '点击AI编程按钮',
        // '选择深度思考为"自动"'
      ]
    }
  },
  {
    id: 'deepseek',
    name: 'Deepseek',
    url: 'https://www.deepseek.com/',
    modelConfig: {
      defaultModel: 'DeepSeek-V3',
      availableModels: ['DeepSeek-V3'],
      specialModes: ['深度思考']
    },
    interactionConfig: {
      selectors: {
        modeSelector: '[data-testid="deep-think-toggle"]',
        inputField: 'textarea[placeholder*="输入"]',
        submitButton: 'button[aria-label="发送"]',
        responseArea: '.chat-message-content'
      },
      waitConditions: {
        pageLoad: 5000,
        responseGeneration: 45000
      },
      specialInstructions: [
        '打开深度思考开关'
      ]
    }
  },
  {
    id: 'kimi',
    name: 'Kimi k2',
    url: 'https://www.kimi.com/',
    modelConfig: {
      defaultModel: 'K2',
      availableModels: ['K2', 'K1'],
      specialModes: []
    },
    interactionConfig: {
      selectors: {
        modelSelector: '[data-testid="model-selector"]',
        inputField: 'textarea[placeholder*="输入"]',
        submitButton: 'button[type="submit"]',
        responseArea: '.message-content'
      },
      waitConditions: {
        pageLoad: 5000,
        responseGeneration: 30000
      },
      specialInstructions: [
        '选择K2模型'
      ]
    }
  },
  {
    id: 'yuanbao',
    name: '元宝AI编程',
    url: 'https://yuanbao.tencent.com/chat/naQivTmsDa',
    modelConfig: {
      defaultModel: 'HUNYuan',
      availableModels: ['HUNYuan'],
      specialModes: ['深度思考', 'AI编程']
    },
    interactionConfig: {
      selectors: {
        modelSelector: '[data-testid="model-selector"]',
        modeSelector: '[data-testid="deep-think-toggle"]',
        inputField: 'textarea[placeholder*="输入"]',
        submitButton: 'button[type="submit"]',
        responseArea: '.message-content'
      },
      waitConditions: {
        pageLoad: 5000,
        responseGeneration: 35000
      },
      specialInstructions: [
        '选择HUNYuan模型',
        '开启深度思考模式'
      ]
    }
  },
  {
    id: 'qwen',
    name: '千问',
    url: 'https://chat.qwen.ai/',
    modelConfig: {
      defaultModel: 'Qwen2.5-72B',
      availableModels: ['Qwen2.5-72B', 'Qwen2.5-32B', 'Qwen2.5-14B'],
      specialModes: []
    },
    interactionConfig: {
      selectors: {
        modelSelector: '[data-testid="model-selector"]',
        inputField: 'textarea[placeholder*="输入"]',
        submitButton: 'button[type="submit"]',
        responseArea: '.message-content'
      },
      waitConditions: {
        pageLoad: 5000,
        responseGeneration: 40000
      },
      specialInstructions: [
        '选择Qwen2.5-72B模型'
      ]
    }
  }
];

/**
 * 处理自定义用户画像
 * @param customProfile 自定义用户画像数据
 * @returns 处理后的用户画像对象
 */
export const processCustomUserProfile = (customProfile: { name: string }): UserProfile => {
  return {
    id: 'custom',
    name: customProfile.name,
    characteristics: [
      '具有特定的学习需求',
      '可能有特殊的应用场景',
      '需要个性化的建议',
      '关注特定领域的问题'
    ],
    questionTemplates: [
      {
        type: 'learning',
        template: `作为${customProfile.name}，我想学习{language}来解决{question}。`,
        variables: ['language', 'question']
      }
    ]
  };
};

/**
 * 处理自定义编程语言
 * @param customLanguage 自定义编程语言数据
 * @returns 处理后的编程语言对象
 */
export const processCustomProgrammingLanguage = (customLanguage: { name: string }): ProgrammingLanguage => {
  return {
    id: 'custom',
    name: customLanguage.name,
    commonIssues: [
      '基础语法掌握',
      '编程概念理解',
      '实际应用场景',
      '开发工具使用',
      '最佳实践学习'
    ],
    learningTopics: [
      '基础语法',
      '核心概念',
      '实际应用',
      '开发工具',
      '最佳实践'
    ]
  };
};

