import { Router } from 'express';
import * as authController from '../controllers/auth.controller';
import { validateRequest } from '../middleware/validate.middleware';
import { loginSchema, registerSchema, refreshSchema } from '../utils/validationSchemas';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/rbac.middleware';

const router = Router();

router.post('/login', validateRequest(loginSchema), authController.login);
router.post('/refresh', validateRequest(refreshSchema), authController.refresh);
router.post('/logout', protect, authController.logout);

// Admin only registration
router.post(
  '/register',
  protect,
  restrictTo('admin'),
  validateRequest(registerSchema),
  authController.register
);

export default router;