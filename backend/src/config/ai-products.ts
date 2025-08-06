import { AIProduct } from '../models';

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
        modeSelector: '[data-testid="ai-coding-button"]', // AI编程按钮
        inputField: 'textarea[placeholder*="输入"]',
        submitButton: 'button[type="submit"]',
        responseArea: '.message-content'
      },
      waitConditions: {
        pageLoad: 5000,
        responseGeneration: 30000
      },
      specialInstructions: [
        '点击AI编程按钮',
        '选择深度思考为"自动"'
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
        '开启深度思考',
        '在输入框输入"@AI编程"后再输入问题'
      ]
    }
  },
  {
    id: 'qwen',
    name: '千问',
    url: 'https://chat.qwen.ai/',
    modelConfig: {
      defaultModel: 'Qwen3-Coder',
      availableModels: ['Qwen3-Coder', 'Qwen-Max'],
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
        responseGeneration: 25000
      },
      specialInstructions: [
        '选择Qwen3-Coder模型'
      ]
    }
  }
];

export const getUserProfiles = () => [
  {
    id: 'cs-student',
    name: '计算机专业学生',
    description: '在校学习编程课程的计算机专业学生',
    characteristics: [
      '有一定的编程基础',
      '正在学习多种编程语言',
      '需要完成课程作业和项目',
      '对新技术有好奇心',
      '希望获得清晰的解释和示例'
    ],
    questionTemplates: [
      {
        type: 'learning',
        template: '我是一名计算机专业的学生，正在学习{language}。{question}',
        variables: ['language', 'question']
      },
      {
        type: 'project',
        template: '我需要用{language}完成一个课程项目，{question}',
        variables: ['language', 'question']
      }
    ]
  },
  {
    id: 'non-cs-beginner',
    name: '非计算机专业入门者',
    description: '有入门编程基础的非计算机专业人员',
    characteristics: [
      '编程基础较薄弱',
      '需要详细的解释',
      '希望获得实用的建议',
      '对复杂概念需要简化说明',
      '更关注实际应用'
    ],
    questionTemplates: [
      {
        type: 'learning',
        template: '我是编程初学者，想学习{language}。{question}',
        variables: ['language', 'question']
      },
      {
        type: 'debugging',
        template: '我在学习{language}时遇到了问题，{question}',
        variables: ['language', 'question']
      }
    ]
  },
  {
    id: 'fullstack-developer',
    name: '前后端算法研发',
    description: '有经验的前后端和算法开发人员',
    characteristics: [
      '有丰富的编程经验',
      '关注性能和最佳实践',
      '需要深入的技术细节',
      '希望获得高质量的代码示例',
      '对新技术和框架感兴趣'
    ],
    questionTemplates: [
      {
        type: 'best_practices',
        template: '作为一名有经验的开发者，我想了解{language}中{question}的最佳实践。',
        variables: ['language', 'question']
      },
      {
        type: 'performance',
        template: '在{language}开发中，如何优化{question}的性能？',
        variables: ['language', 'question']
      }
    ]
  },
  {
    id: 'other-role',
    name: '其他角色',
    description: '其他类型的编程学习者或开发者',
    characteristics: [
      '具有特定的学习需求',
      '可能有特殊的应用场景',
      '需要个性化的建议',
      '关注特定领域的问题'
    ],
    questionTemplates: [
      {
        type: 'learning',
        template: '我想学习{language}来解决{question}。',
        variables: ['language', 'question']
      }
    ]
  }
];

export const getProgrammingLanguages = () => [
  {
    id: 'javascript',
    name: 'JavaScript',
    description: '动态编程语言，主要用于Web开发',
    commonIssues: [
      '异步编程和Promise',
      '作用域和闭包',
      '原型链和继承',
      'DOM操作',
      '模块化开发'
    ],
    learningTopics: [
      '基础语法',
      'ES6+新特性',
      '异步编程',
      '函数式编程',
      '面向对象编程'
    ]
  },
  {
    id: 'python',
    name: 'Python',
    description: '简洁易学的编程语言，广泛用于数据科学和Web开发',
    commonIssues: [
      '数据结构和算法',
      '面向对象编程',
      '异常处理',
      '文件操作',
      '第三方库使用'
    ],
    learningTopics: [
      '基础语法',
      '数据结构',
      '函数和模块',
      '面向对象',
      '标准库使用'
    ]
  },
  {
    id: 'java',
    name: 'Java',
    description: '面向对象的编程语言，广泛用于企业级开发',
    commonIssues: [
      '面向对象设计',
      '集合框架',
      '多线程编程',
      '异常处理',
      'JVM调优'
    ],
    learningTopics: [
      '基础语法',
      '面向对象',
      '集合框架',
      '多线程',
      '设计模式'
    ]
  },
  {
    id: 'cpp',
    name: 'C++',
    description: '高性能的系统编程语言',
    commonIssues: [
      '内存管理',
      '指针和引用',
      '模板编程',
      'STL使用',
      '性能优化'
    ],
    learningTopics: [
      '基础语法',
      '面向对象',
      '模板',
      'STL',
      '内存管理'
    ]
  },
  {
    id: 'go',
    name: 'Go',
    description: '简洁高效的系统编程语言',
    commonIssues: [
      '并发编程',
      '接口设计',
      '错误处理',
      '包管理',
      '性能优化'
    ],
    learningTopics: [
      '基础语法',
      '并发编程',
      '接口',
      '包和模块',
      '错误处理'
    ]
  },
  {
    id: 'rust',
    name: 'Rust',
    description: '内存安全的系统编程语言',
    commonIssues: [
      '所有权系统',
      '生命周期',
      '错误处理',
      '并发编程',
      '性能优化'
    ],
    learningTopics: [
      '所有权',
      '借用检查',
      '生命周期',
      '错误处理',
      '并发'
    ]
  }
];

