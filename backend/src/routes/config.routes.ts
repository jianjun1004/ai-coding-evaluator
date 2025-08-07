import { Router } from 'express';
import { ConfigController } from '../controllers/config.controller';

const router = Router();
const configController = new ConfigController();

// 配置管理路由
router.get('/ai-products', configController.getAIProducts.bind(configController));
router.get('/question-types', configController.getQuestionTypes.bind(configController));
router.get('/system', configController.getSystemConfig.bind(configController));
router.get('/scoring-criteria', configController.getScoringCriteria.bind(configController));
router.post('/test-feishu', configController.testFeishuConnection.bind(configController));

export default router;

