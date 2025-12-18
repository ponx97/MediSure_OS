import { Router } from 'express';
import * as memberController from '../controllers/member.controller';
import { protect } from '../middleware/auth.middleware';
import { restrictTo } from '../middleware/rbac.middleware';
import { validateRequest } from '../middleware/validate.middleware';
import { createMemberSchema } from '../utils/validationSchemas';

const router = Router();

router.use(protect);

router.get('/', restrictTo('admin', 'STAFF'), memberController.getMembers);
router.post('/', restrictTo('admin', 'STAFF'), validateRequest(createMemberSchema), memberController.createMember);
router.get('/:id', restrictTo('admin', 'STAFF', 'PROVIDER', 'MEMBER'), memberController.getMember);
router.put('/:id', restrictTo('admin', 'STAFF'), memberController.updateMember);
router.delete('/:id', restrictTo('admin'), memberController.deleteMember);

export default router;