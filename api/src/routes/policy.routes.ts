import { Router } from 'express';
import * as policyController from '../controllers/policy.controller';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createPolicySchema } from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.get('/', restrictTo('ADMIN', 'STAFF'), policyController.getPolicies);
router.post('/', restrictTo('ADMIN', 'STAFF'), validateRequest(createPolicySchema), policyController.createPolicy);
router.get('/:id', restrictTo('ADMIN', 'STAFF', 'MEMBER'), policyController.getPolicy);
router.put('/:id', restrictTo('ADMIN', 'STAFF'), policyController.updatePolicy);
router.delete('/:id', restrictTo('ADMIN'), policyController.deletePolicy);

export default router;