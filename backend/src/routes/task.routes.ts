import { Router } from 'express';
import { TaskController } from '../controllers/task.controller';

const router = Router();
const taskController = new TaskController();

// 任务管理路由
router.get('/', taskController.getTasks.bind(taskController));
router.post('/', taskController.createTask.bind(taskController));
router.get('/running', taskController.getRunningTasks.bind(taskController));
router.get('/:id', taskController.getTask.bind(taskController));
router.post('/:id/execute', taskController.executeTask.bind(taskController));
router.get('/:id/progress', taskController.getTaskProgress.bind(taskController));
router.post('/:id/cancel', taskController.cancelTask.bind(taskController));
router.delete('/:id', taskController.deleteTask.bind(taskController));

export default router;

