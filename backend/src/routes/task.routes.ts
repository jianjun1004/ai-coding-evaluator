/*
 * @Author: 52385091@qq.com 52385091@qq.com
 * @Date: 2025-08-07 04:04:17
 * @LastEditors: 52385091@qq.com 52385091@qq.com
 * @LastEditTime: 2025-08-08 02:22:09
 * @FilePath: \ai-coding-evaluator\backend\src\routes\task.routes.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';

const router = Router();
const taskController = new TaskController();

// 简化的单任务路由 - 不需要ID
router.post('/generate-questions', taskController.generateQuestions.bind(taskController));
router.post('/execute', taskController.executeTask.bind(taskController));
router.get('/status', taskController.getTaskProgress.bind(taskController));
router.post('/cancel', taskController.cancelTask.bind(taskController));

// 测试路由
router.get('/test', (req, res) => {
  res.json({ message: 'Task routes are working' });
});

export default router;

