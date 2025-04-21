import { Request, Response } from 'express';
import prisma from '../config/database';

export const signupForEarlyAccess = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, userType = 'startup' } = req.body;

    // Validate email
    if (!email || !email.includes('@')) {
      res.status(400).json({ message: 'Valid email is required' });
      return;
    }

    // Check if email already exists
    const existingSignup = await prisma.earlyBirdSignup.findUnique({
      where: { email },
    });

    if (existingSignup) {
      res.status(200).json({ 
        message: 'Email already registered for early access',
        alreadyRegistered: true
      });
      return;
    }

    // Create early bird signup
    await prisma.earlyBirdSignup.create({
      data: {
        email,
        userType: userType === 'enterprise' ? 'enterprise' : 'startup',
      },
    });

    res.status(201).json({ 
      message: 'Thank you for your interest! We will notify you when early access is available.',
      success: true
    });
  } catch (error) {
    console.error('Early bird signup error:', error);
    res.status(500).json({ message: 'Error processing your request' });
  }
};

export const getEarlyBirdSignups = async (_req: Request, res: Response): Promise<void> => {
  try {
    // This endpoint should be protected by admin authentication in production
    const signups = await prisma.earlyBirdSignup.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(signups);
  } catch (error) {
    console.error('Get early bird signups error:', error);
    res.status(500).json({ message: 'Error fetching signups' });
  }
};

export const approveEarlyBirdSignup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // This endpoint should be protected by admin authentication in production
    const signup = await prisma.earlyBirdSignup.update({
      where: { id },
      data: {
        approved: true,
      },
    });

    res.json({ 
      message: 'Early bird access approved',
      signup 
    });
  } catch (error) {
    console.error('Approve early bird signup error:', error);
    res.status(500).json({ message: 'Error approving signup' });
  }
}; 