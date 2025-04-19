import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/database';

const SALT_ROUNDS = 10; // Standard salt rounds for bcrypt

// Register a new user
export const register = async (req: Request, res: Response) => {
  console.log('Registration attempt:', { ...req.body, password: '[HIDDEN]' });
  
  const { name, email, password } = req.body;

  // Basic Input Validation
  if (!name || !email || !password) {
    console.log('Registration failed: Missing required fields');
    return res.status(400).json({ message: 'Name, email, and password are required' });
  }

  // Consider adding more robust validation (e.g., email format, password strength)

  try {
    // Check if user already exists
    console.log('Checking for existing user with email:', email);
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      console.log('Registration failed: Email already exists:', email);
      return res.status(409).json({ message: 'Email already in use' }); // 409 Conflict
    }

    // Hash the password
    console.log('Hashing password...');
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create the user in the database
    console.log('Creating new user:', { name, email });
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // Add other fields if necessary (e.g., profile headline, avatar - set defaults or handle later)
      },
    });

    console.log('User created successfully:', { id: newUser.id, email: newUser.email });

    // Return success response (exclude password)
    const { password: _, ...userWithoutPassword } = newUser;
    return res.status(201).json({ message: 'User registered successfully', user: userWithoutPassword }); // 201 Created

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Login function
export const login = async (req: Request, res: Response) => {
  console.log('Login attempt:', { email: req.body.email, password: '[HIDDEN]' });
  
  const { email, password } = req.body;

  // Basic Input Validation
  if (!email || !password) {
    console.log('Login failed: Missing required fields');
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists
    if (!user) {
      console.log('Login failed: User not found with email:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Compare password with hashed password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    
    if (!isPasswordValid) {
      console.log('Login failed: Invalid password for user:', email);
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    console.log('Login successful for user:', email);

    // Return user data and token (exclude password)
    const { password: _, ...userWithoutPassword } = user;
    return res.status(200).json({
      message: 'Login successful',
      user: userWithoutPassword,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

// Get user profile (placeholder - implement if needed)
export const getProfile = async (_req: Request, res: Response): Promise<void> => {
  try {
    const userId = res.locals.userId;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json(user);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
}; 