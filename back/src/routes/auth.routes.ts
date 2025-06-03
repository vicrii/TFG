import { Router } from 'express';
import { authController } from '../controllers/auth.controller';
import { authenticateUser } from '../../db/server/middleware/auth';

const router = Router();

// Rutas públicas
router.get('/users/:walletAddress', authController.checkUserExists);
router.post('/users', authController.registerUser);
router.get('/health', authController.checkHealth);

export default router; 