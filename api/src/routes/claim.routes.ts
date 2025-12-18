import { Router } from 'express';
import * as claimController from '../controllers/claim.controller';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { 
  createClaimSchema, 
  reviewClaimSchema, 
  approveClaimSchema, 
  rejectClaimSchema, 
  payClaimSchema 
} from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.get('/', restrictTo('admin', 'STAFF', 'PROVIDER', 'MEMBER'), claimController.getClaims);
router.post('/', restrictTo('admin', 'STAFF', 'PROVIDER'), validateRequest(createClaimSchema), claimController.createClaim);
router.get('/:id', restrictTo('admin', 'STAFF', 'PROVIDER', 'MEMBER'), claimController.getClaim);

// Workflow
router.post('/:id/submit', restrictTo('admin', 'STAFF', 'PROVIDER'), claimController.submitClaim);
router.post('/:id/review', restrictTo('admin', 'STAFF'), validateRequest(reviewClaimSchema), claimController.reviewClaim);
router.post('/:id/approve', restrictTo('admin', 'STAFF'), validateRequest(approveClaimSchema), claimController.approveClaim);
router.post('/:id/reject', restrictTo('admin', 'STAFF'), validateRequest(rejectClaimSchema), claimController.rejectClaim);
router.post('/:id/pay', restrictTo('admin', 'STAFF'), validateRequest(payClaimSchema), claimController.payClaim);

// Items
router.post('/:id/items', restrictTo('admin', 'STAFF', 'PROVIDER'), claimController.addItem);
router.delete('/:id/items/:itemId', restrictTo('admin', 'STAFF', 'PROVIDER'), claimController.deleteItem);

export default router;