import { Router } from 'express';
import * as policyController from '../controllers/policy.controller';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createPolicySchema } from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.get('/', restrictTo('admin', 'staff'), policyController.getPolicies);
router.post('/', restrictTo('admin', 'staff'), validateRequest(createPolicySchema), policyController.createPolicy);
router.get('/:id', restrictTo('admin', 'staff', 'member'), policyController.getPolicy);
router.put('/:id', restrictTo('admin', 'staff'), policyController.updatePolicy);
router.delete('/:id', restrictTo('admin'), policyController.deletePolicy);

export default router;