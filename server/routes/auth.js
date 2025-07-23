import express from 'express';
import { ClerkExpressRequireAuth } from '@clerk/clerk-sdk-node';
import User from '../models/User.js';

const router = express.Router();

// Sync user with database - NO AUTH REQUIRED for initial sync
router.post('/sync', async (req, res) => {
  try {
    const { user } = req.body;
    
    if (!user || !user.id) {
      return res.status(400).json({ message: 'User data is required' });
    }

    let existingUser = await User.findOne({ clerkId: user.id });

    if (!existingUser) {
      // Create new user
      existingUser = new User({
        clerkId: user.id,
        email: user.emailAddresses[0]?.emailAddress,
        firstName: user.firstName,
        lastName: user.lastName,
        imageUrl: user.imageUrl,
        lastLogin: new Date()
      });
    } else {
      // Update existing user
      existingUser.email = user.emailAddresses[0]?.emailAddress;
      existingUser.firstName = user.firstName;
      existingUser.lastName = user.lastName;
      existingUser.imageUrl = user.imageUrl;
      existingUser.lastLogin = new Date();
    }

    await existingUser.save();
    console.log("User synced successfully:", existingUser.email);
    
    res.json({
      message: 'User synced successfully',
      user: existingUser
    });
  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({ message: 'Failed to sync user', error: error.message });
  }
});

// Get user profile - REQUIRES AUTH
router.get('/profile', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const user = await User.findOne({ clerkId: userId });

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to get user profile' });
  }
});

// Update user profile - REQUIRES AUTH
router.put('/profile', ClerkExpressRequireAuth(), async (req, res) => {
  try {
    const { userId } = req.auth;
    const { institution, role } = req.body;

    const user = await User.findOneAndUpdate(
      { clerkId: userId },
      { institution, role },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      message: 'Profile updated successfully',
      user
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
});

export default router;