import { Router } from 'express';
import * as memberController from '../controllers/member.controller';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createMemberSchema } from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.get('/', restrictTo('ADMIN', 'STAFF'), memberController.getMembers);
router.post('/', restrictTo('ADMIN', 'STAFF'), validateRequest(createMemberSchema), memberController.createMember);
router.get('/:id', restrictTo('ADMIN', 'STAFF', 'PROVIDER', 'MEMBER'), memberController.getMember);
router.put('/:id', restrictTo('ADMIN', 'STAFF'), memberController.updateMember);
router.delete('/:id', restrictTo('ADMIN'), memberController.deleteMember);

export default router;