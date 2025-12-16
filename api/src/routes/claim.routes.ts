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

router.get('/', restrictTo('ADMIN', 'STAFF', 'PROVIDER', 'MEMBER'), claimController.getClaims);
router.post('/', restrictTo('ADMIN', 'STAFF', 'PROVIDER'), validateRequest(createClaimSchema), claimController.createClaim);
router.get('/:id', restrictTo('ADMIN', 'STAFF', 'PROVIDER', 'MEMBER'), claimController.getClaim);

// Workflow
router.post('/:id/submit', restrictTo('ADMIN', 'STAFF', 'PROVIDER'), claimController.submitClaim);
router.post('/:id/review', restrictTo('ADMIN', 'STAFF'), validateRequest(reviewClaimSchema), claimController.reviewClaim);
router.post('/:id/approve', restrictTo('ADMIN', 'STAFF'), validateRequest(approveClaimSchema), claimController.approveClaim);
router.post('/:id/reject', restrictTo('ADMIN', 'STAFF'), validateRequest(rejectClaimSchema), claimController.rejectClaim);
router.post('/:id/pay', restrictTo('ADMIN', 'STAFF'), validateRequest(payClaimSchema), claimController.payClaim);

// Items
router.post('/:id/items', restrictTo('ADMIN', 'STAFF', 'PROVIDER'), claimController.addItem);
router.delete('/:id/items/:itemId', restrictTo('ADMIN', 'STAFF', 'PROVIDER'), claimController.deleteItem);

export default router;