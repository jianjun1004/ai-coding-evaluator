# AI编程产品评测工作流系统

一个自动化的AI编程产品评测系统，支持动态用户画像和编程语言配置，能够自动生成问题、向多个AI编程产品提问、收集回答、智能评分并记录到飞书多维表格。

## 功能特性

### 🎯 核心功能
- **动态配置**：支持多种用户画像和编程语言的动态配置
- **智能问题生成**：基于LLM自动生成针对性的编程问题
- **自动化交互**：通过浏览器自动化与AI编程产品进行交互
- **智能追问**：根据AI回答自动生成最多3次追问
- **智能评分**：基于多维度标准对AI回答进行0-4分评分
- **飞书集成**：自动将评测结果记录到飞书多维表格

### 🤖 支持的AI产品
- **豆包**：https://www.doubao.com/chat/
- **Deepseek**：https://www.deepseek.com/
- **Kimi k2**：https://www.kimi.com/
- **元宝AI编程**：https://yuanbao.tencent.com/chat/naQivTmsDa
- **千问**：https://chat.qwen.ai/

### 👥 用户画像
- 计算机专业学生
- 非计算机专业入门者
- 前后端算法研发
- 其他角色（可扩展）

### 💻 编程语言
- JavaScript
- Python
- Java
- C++
- Go
- Rust

## 技术架构

### 后端技术栈
- **Node.js + TypeScript**：后端服务
- **Express.js**：Web框架
- **Puppeteer**：浏览器自动化
- **SQLite**：本地数据存储
- **OpenAI API**：问题生成和评分分析
- **飞书开放平台API**：数据集成

### 系统架构
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   前端界面      │    │   API服务层     │    │   数据存储层    │
│                 │    │                 │    │                 │
│ - 任务配置      │◄──►│ - 任务管理      │◄──►│ - SQLite        │
│ - 进度监控      │    │ - 配置管理      │    │ - 飞书多维表格  │
│ - 结果查看      │    │ - 评测执行      │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   核心服务层    │
                    │                 │
                    │ - 问题生成引擎  │
                    │ - 浏览器自动化  │
                    │ - 评分分析引擎  │
                    │ - 任务调度器    │
                    └─────────────────┘
```

## 快速开始

### 环境要求
- Node.js >= 16.0.0
- npm >= 8.0.0
- Chrome/Chromium 浏览器

### 安装步骤

1. **克隆项目**
```bash
git clone <repository-url>
cd ai-coding-evaluator
```

2. **安装后端依赖**
```bash
cd backend
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，填入必要的配置信息
```

4. **启动后端服务**
```bash
# 开发模式
npm run dev

# 生产模式
npm run build
npm start
```

5. **访问API**
- API文档：http://localhost:3000
- 健康检查：http://localhost:3000/health

### 环境变量配置

创建 `.env` 文件并配置以下变量：

```env
# 基础配置
PORT=3000
NODE_ENV=development

# OpenAI配置（必需）
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_API_BASE=https://api.openai.com/v1

# 飞书配置（可选，不配置则不会写入飞书）
FEISHU_APP_ID=your_feishu_app_id
FEISHU_APP_SECRET=your_feishu_app_secret
FEISHU_TABLE_TOKEN=your_feishu_table_token
FEISHU_TABLE_ID=your_feishu_table_id
```

## API文档

### 任务管理 API

#### 创建评测任务
```http
POST /api/tasks
Content-Type: application/json

{
  "name": "JavaScript学习评测",
  "description": "针对计算机专业学生的JavaScript学习问题评测",
  "userProfileId": "cs-student",
  "programmingLanguageId": "javascript",
  "aiProductIds": ["doubao", "deepseek", "kimi"],
  "questionTypes": ["learning", "project"],
  "maxFollowUps": 3
}
```

#### 执行评测任务
```http
POST /api/tasks/{taskId}/execute
```

#### 获取任务进度
```http
GET /api/tasks/{taskId}/progress
```

### 配置管理 API

#### 获取用户画像列表
```http
GET /api/config/profiles
```

#### 获取编程语言列表
```http
GET /api/config/languages
```

#### 获取AI产品列表
```http
GET /api/config/ai-products
```

## 评分标准

系统采用0-4分的评分制度：

| 分数 | 等级 | 描述 |
|------|------|------|
| 0 | 完全不可用 | 完全不能解决问题，被劝退，以后不会再用 |
| 1 | 不可用，存在大量错误内容 | 不能解决问题，被劝退，以后不会再用 |
| 2 | 不可用，存在少量错误内容 | 不能解决问题，但回答中有部分参考信息，不会主动想起用 |
| 3 | 可用，存在可提升空间 | 能解决问题，有一些小瑕疵，愿意继续使用 |
| 4 | 满分 | 能够完美高效的解决问题，愿意推荐给其他人使用 |

### 评分维度
- **准确性**（30%）：回答是否正确，是否包含错误信息
- **完整性**（25%）：回答是否全面，是否遗漏重要信息
- **清晰度**（20%）：回答是否清晰易懂，结构是否合理
- **实用性**（15%）：回答对用户是否有实际帮助
- **代码质量**（10%）：如果包含代码，代码质量如何

## 飞书集成

### 表格字段设计

系统会自动在飞书多维表格中创建以下字段：

| 字段名称 | 类型 | 描述 |
|----------|------|------|
| 评测ID | 文本 | 每次评测的唯一标识 |
| 会话ID | 文本 | 同一轮对话的唯一标识 |
| 产品名称 | 文本 | AI编程产品名称 |
| 用户画像 | 文本 | 使用的用户画像 |
| 编程语言 | 文本 | 评测的编程语言 |
| 原始问题 | 文本 | 初始提问内容 |
| 追问次数 | 数字 | 追问的次数 |
| 追问内容 | 文本 | 追问的具体内容 |
| AI回答 | 文本 | AI的回答内容 |
| 评分 | 数字 | 0-4分的评分 |
| 评分理由 | 文本 | 详细的评分说明 |
| 提问时间 | 日期时间 | 提问的时间 |
| 回答时间 | 日期时间 | 收到回答的时间 |
| 耗时(秒) | 数字 | 从提问到回答的耗时 |

### 飞书配置步骤

1. 在飞书开放平台创建企业自建应用
2. 开通多维表格权限
3. 创建目标多维表格
4. 获取应用凭证和表格信息
5. 在环境变量中配置相关信息

## 开发指南

### 项目结构
```
ai-coding-evaluator/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务服务
│   │   ├── models/         # 数据模型
│   │   ├── routes/         # 路由定义
│   │   ├── utils/          # 工具函数
│   │   └── app.ts          # 应用入口
│   ├── tests/              # 测试文件
│   └── package.json
├── frontend/               # 前端应用（待开发）
├── docs/                   # 文档
└── README.md
```

### 添加新的AI产品

1. 在 `src/config/ai-products.ts` 中添加产品配置
2. 配置产品的URL、模型选择器、交互方式等
3. 在浏览器自动化服务中添加特殊处理逻辑（如需要）

### 添加新的用户画像

1. 在 `getUserProfiles()` 函数中添加新的画像配置
2. 定义画像的特征和问题模板
3. 更新相关的类型定义

## 部署指南

### Docker部署（推荐）

```bash
# 构建镜像
docker build -t ai-coding-evaluator .

# 运行容器
docker run -d \
  --name ai-coding-evaluator \
  -p 3000:3000 \
  -e OPENAI_API_KEY=your_key \
  -e FEISHU_APP_ID=your_app_id \
  ai-coding-evaluator
```

### 传统部署

```bash
# 构建项目
npm run build

# 使用PM2管理进程
npm install -g pm2
pm2 start dist/app.js --name ai-coding-evaluator

# 设置开机自启
pm2 startup
pm2 save
```

## 注意事项

### 浏览器自动化
- 系统依赖Chrome/Chromium浏览器
- 某些AI产品可能有反爬机制，需要适当调整策略
- 建议在稳定的网络环境下运行

### API限制
- OpenAI API有调用频率限制，系统已内置延迟机制
- 飞书API也有频率限制，批量操作时会自动分批处理

### 数据安全
- 所有敏感配置信息应通过环境变量管理
- 不要将API密钥提交到版本控制系统
- 定期备份评测数据

## 故障排除

### 常见问题

1. **浏览器启动失败**
   - 检查Chrome/Chromium是否正确安装
   - 在Docker环境中需要添加相应的参数

2. **OpenAI API调用失败**
   - 检查API密钥是否正确
   - 确认网络连接和API配额

3. **飞书集成失败**
   - 验证应用凭证和权限配置
   - 检查表格Token和表格ID是否正确

4. **AI产品交互失败**
   - 检查产品页面是否有变化
   - 调整选择器和等待时间

## 贡献指南

欢迎提交Issue和Pull Request来改进这个项目。

### 开发流程
1. Fork项目
2. 创建功能分支
3. 提交更改
4. 创建Pull Request

## 许可证

MIT License

## 联系方式

如有问题或建议，请通过以下方式联系：
- 提交GitHub Issue
- 发送邮件至项目维护者

---

**注意**：本系统仅用于学术研究和产品评测目的，请遵守各AI产品的使用条款和服务协议。

