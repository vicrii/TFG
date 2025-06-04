import { Router } from 'express';
import { userController } from '../controllers/user.controller';
import { authenticateUser } from '../../db/server/middleware/auth';

const router = Router();

// Public routes
// None for this service

// Protected routes (require authentication)
router.get('/users', authenticateUser, userController.getAllUsers);
router.get('/users/:userId', authenticateUser, userController.getUserDetails);
router.get('/users/wallet/:walletAddress', authenticateUser, userController.getUserByWallet);
router.put('/users/:walletAddress', authenticateUser, userController.updateUser);
router.patch('/users/:walletAddress/avatar', authenticateUser, userController.updateUserAvatar);
router.patch('/users/:userId/role', authenticateUser, userController.updateUserRole);
router.patch('/users/:userId/active', authenticateUser, userController.toggleUserActive);

// Simple settings route to prevent 404
router.get('/users/settings', (req, res) => {
  res.json({
    uiPreferences: {
      theme: 'system',
      codeEditorTheme: 'vs-dark',
      fontSize: 'medium',
      animationsEnabled: true,
      highContrastMode: false
    }
  });
});

export default router;