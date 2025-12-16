import { Router } from 'express';
import * as providerController from '../controllers/provider.controller';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createProviderSchema } from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.get('/', restrictTo('ADMIN', 'STAFF'), providerController.getProviders);
router.post('/', restrictTo('ADMIN', 'STAFF'), validateRequest(createProviderSchema), providerController.createProvider);
router.get('/:id', restrictTo('ADMIN', 'STAFF'), providerController.getProvider);
router.put('/:id', restrictTo('ADMIN', 'STAFF'), providerController.updateProvider);
router.delete('/:id', restrictTo('ADMIN'), providerController.deleteProvider);

export default router;