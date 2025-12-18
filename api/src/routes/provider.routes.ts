import { Router } from 'express';
import * as providerController from '../controllers/provider.controller';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createProviderSchema } from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.get('/', restrictTo('admin', 'STAFF'), providerController.getProviders);
router.post('/', restrictTo('admin', 'STAFF'), validateRequest(createProviderSchema), providerController.createProvider);
router.get('/:id', restrictTo('admin', 'STAFF'), providerController.getProvider);
router.put('/:id', restrictTo('admin', 'STAFF'), providerController.updateProvider);
router.delete('/:id', restrictTo('admin'), providerController.deleteProvider);

export default router;