import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../config/database';
import { SessionRequest } from '../types/session';

// Admin Login View
export const getAdminLogin = (req: Request, res: Response): void => {
  res.render('admin-login', { error: req.query.error || null });
};

// Admin Login Post
export const postAdminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    // Check if user exists and is an admin
    if (!user || !user.isAdmin) {
      return res.render('admin-login', { error: 'Invalid email or password' });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.render('admin-login', { error: 'Invalid email or password' });
    }

    // Set session data
    const req2 = req as SessionRequest;
    req2.session.adminUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      isAdmin: true
    };
    
    // Redirect to admin dashboard
    res.redirect('/admin');
  } catch (error) {
    console.error('Admin login error:', error);
    res.render('admin-login', { error: 'An error occurred. Please try again.' });
  }
};

// Admin Logout
export const getAdminLogout = (req: Request, res: Response): void => {
  const req2 = req as SessionRequest;
  req2.session.destroy((err) => {
    if (err) {
      console.error('Error destroying session:', err);
    }
    res.redirect('/admin/login');
  });
};

// Dashboard View
export const getDashboardView = async (_req: Request, res: Response): Promise<void> => {
  try {
    const [
      userCount,
      postCount,
      messageCount,
      earlyBirdSignupCount,
      pendingEarlyBirdCount
    ] = await Promise.all([
      prisma.user.count(),
      prisma.post.count(),
      prisma.message.count(),
      prisma.earlyBirdSignup.count(),
      prisma.earlyBirdSignup.count({
        where: { approved: false }
      })
    ]);

    const stats = {
      users: userCount,
      posts: postCount,
      messages: messageCount,
      earlyBirdSignups: earlyBirdSignupCount,
      pendingEarlyBirdSignups: pendingEarlyBirdCount
    };

    res.render('admin/dashboard', { 
      title: 'Dashboard Overview',
      activeRoute: 'dashboard',
      stats
    });
  } catch (error) {
    console.error('Dashboard view error:', error);
    res.status(500).render('error', {
      status: 500,
      message: 'Error loading dashboard'
    });
  }
};

// Users View
export const getUsersView = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: {
              posts: true,
              sentMessages: true,
              receivedMessages: true
            }
          }
        }
      }),
      prisma.user.count()
    ]);

    res.render('admin/users', {
      title: 'User Management',
      activeRoute: 'users',
      users,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Users view error:', error);
    res.status(500).render('error', {
      status: 500,
      message: 'Error loading users'
    });
  }
};

// Posts View
export const getPostsView = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      }),
      prisma.post.count()
    ]);

    res.render('admin/posts', {
      title: 'Post Management',
      activeRoute: 'posts',
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Posts view error:', error);
    res.status(500).render('error', {
      status: 500,
      message: 'Error loading posts'
    });
  }
};

// Early Bird View
export const getEarlyBirdView = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    
    const filter = req.query.filter as string || 'all';
    const approved = filter === 'approved' ? true : 
                     filter === 'pending' ? false : undefined;

    const req2 = req as SessionRequest;
    const selectedIds = req2.session.selectedEarlyBirdIds || [];
    
    const whereClause = approved !== undefined ? { approved } : {};

    const [signups, total] = await Promise.all([
      prisma.earlyBirdSignup.findMany({
        skip,
        take: limit,
        where: whereClause,
        orderBy: { createdAt: 'desc' }
      }),
      prisma.earlyBirdSignup.count({ where: whereClause })
    ]);

    res.render('admin/early-bird', {
      title: 'Early Bird Signups',
      activeRoute: 'early-bird',
      signups,
      filter,
      selectedIds,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Early bird view error:', error);
    res.status(500).render('error', {
      status: 500,
      message: 'Error loading early bird signups'
    });
  }
};

// Ban User Action
export const postBanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    await prisma.user.update({
      where: { id },
      data: {
        banned: true,
        banReason: reason || 'Violated terms of service'
      }
    });

    res.redirect('/admin/users');
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).render('error', {
      status: 500,
      message: 'Error banning user'
    });
  }
};

// Unban User Action
export const postUnbanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.user.update({
      where: { id },
      data: {
        banned: false,
        banReason: null
      }
    });

    res.redirect('/admin/users');
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).render('error', {
      status: 500,
      message: 'Error unbanning user'
    });
  }
};

// Delete Post Action
export const postDeletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.post.delete({
      where: { id }
    });

    res.redirect('/admin/posts');
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).render('error', {
      status: 500,
      message: 'Error deleting post'
    });
  }
};

// Select Early Bird Signups
export const postSelectEarlyBirdSignups = (req: Request, res: Response): void => {
  const req2 = req as SessionRequest;
  req2.session.selectedEarlyBirdIds = req.body.ids || [];
  
  // Get the filter and page from the previous request to maintain state
  const filter = req.query.filter || 'pending';
  const page = req.query.page || '1';
  
  res.redirect(`/admin/early-bird?filter=${filter}&page=${page}`);
};

// Approve Early Bird Signups
export const postApproveEarlyBirdSignups = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.redirect('/admin/early-bird');
    }

    await prisma.earlyBirdSignup.updateMany({
      where: {
        id: { in: ids },
        approved: false
      },
      data: {
        approved: true
      }
    });

    // Clear the selection after approval
    const req2 = req as SessionRequest;
    req2.session.selectedEarlyBirdIds = [];
    
    res.redirect('/admin/early-bird?filter=pending');
  } catch (error) {
    console.error('Approve early bird signups error:', error);
    res.status(500).render('error', {
      status: 500,
      message: 'Error approving signups'
    });
  }
}; 