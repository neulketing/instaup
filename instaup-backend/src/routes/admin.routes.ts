import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';

const router = Router();

// TODO: Apply admin authentication middleware to all routes in this file
// Example: router.use(requireAdminAuth);

router.get('/metrics', adminController.getMetrics);

// Placeholder for other admin routes:
// router.post('/services', adminController.createService);
// router.put('/services/:id', adminController.updateService);
// router.get('/orders', adminController.getOrders);
// router.get('/users', adminController.getUsers);

export default router;
