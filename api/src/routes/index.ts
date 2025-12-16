import { Router } from 'express';
import authRoutes from './auth.routes';
import memberRoutes from './member.routes';
import providerRoutes from './provider.routes';
import policyRoutes from './policy.routes';
import claimRoutes from './claim.routes';

const router = Router();

router.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));

router.use('/auth', authRoutes);
router.use('/members', memberRoutes);
router.use('/providers', providerRoutes);
router.use('/policies', policyRoutes);
router.use('/claims', claimRoutes);

export default router;
