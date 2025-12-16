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

router.get('/', restrictTo('admin', 'staff', 'provider', 'member'), claimController.getClaims);
router.post('/', restrictTo('admin', 'staff', 'provider'), validateRequest(createClaimSchema), claimController.createClaim);
router.get('/:id', restrictTo('admin', 'staff', 'provider', 'member'), claimController.getClaim);

// Workflow
router.post('/:id/submit', restrictTo('admin', 'staff', 'provider'), claimController.submitClaim);
router.post('/:id/review', restrictTo('admin', 'staff'), validateRequest(reviewClaimSchema), claimController.reviewClaim);
router.post('/:id/approve', restrictTo('admin', 'staff'), validateRequest(approveClaimSchema), claimController.approveClaim);
router.post('/:id/reject', restrictTo('admin', 'staff'), validateRequest(rejectClaimSchema), claimController.rejectClaim);
router.post('/:id/pay', restrictTo('admin', 'staff'), validateRequest(payClaimSchema), claimController.payClaim);

// Items
router.post('/:id/items', restrictTo('admin', 'staff', 'provider'), claimController.addItem);
router.delete('/:id/items/:itemId', restrictTo('admin', 'staff', 'provider'), claimController.deleteItem);

export default router;