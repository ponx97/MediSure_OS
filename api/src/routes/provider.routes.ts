import { Router } from 'express';
import * as providerController from '../controllers/provider.controller';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createProviderSchema } from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.get('/', restrictTo('admin', 'staff'), providerController.getProviders);
router.post('/', restrictTo('admin', 'staff'), validateRequest(createProviderSchema), providerController.createProvider);
router.get('/:id', restrictTo('admin', 'staff'), providerController.getProvider);
router.put('/:id', restrictTo('admin', 'staff'), providerController.updateProvider);
router.delete('/:id', restrictTo('admin'), providerController.deleteProvider);

export default router;