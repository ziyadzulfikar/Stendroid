import { Request, Response } from 'express';
import prisma from '../config/database';

// Get dashboard overview stats
export const getDashboardStats = async (_req: Request, res: Response): Promise<void> => {
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

    res.json({
      stats: {
        users: userCount,
        posts: postCount,
        messages: messageCount,
        earlyBirdSignups: earlyBirdSignupCount,
        pendingEarlyBirdSignups: pendingEarlyBirdCount
      },
      lastUpdated: new Date()
    });
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Error fetching dashboard statistics' });
  }
};

// Get all users with pagination
export const getUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
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

    // Filter out the password field from each user
    const sanitizedUsers = users.map(({ password, ...rest }) => rest);

    res.json({
      users: sanitizedUsers,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
};

// Get all posts with pagination
export const getPosts = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
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

    res.json({
      posts,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ message: 'Error fetching posts' });
  }
};

// Delete a post (admin privilege)
export const deletePost = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await prisma.post.delete({
      where: { id }
    });

    res.json({ message: 'Post deleted successfully' });
  } catch (error) {
    console.error('Delete post error:', error);
    res.status(500).json({ message: 'Error deleting post' });
  }
};

// Ban a user
export const banUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    const user = await prisma.user.update({
      where: { id },
      data: {
        banned: true,
        banReason: reason || 'Violated terms of service'
      }
    });

    res.json({ 
      message: 'User banned successfully',
      user
    });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Error banning user' });
  }
};

// Unban a user
export const unbanUser = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const user = await prisma.user.update({
      where: { id },
      data: {
        banned: false,
        banReason: null
      }
    });

    res.json({ 
      message: 'User unbanned successfully',
      user
    });
  } catch (error) {
    console.error('Unban user error:', error);
    res.status(500).json({ message: 'Error unbanning user' });
  }
};

// Toggle admin status of a user
export const toggleUserAdmin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;
    
    if (typeof isAdmin !== 'boolean') {
      res.status(400).json({ message: 'Invalid request. isAdmin must be a boolean value.' });
      return;
    }

    const user = await prisma.user.update({
      where: { id },
      data: { isAdmin }
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    res.json({ 
      message: isAdmin ? 'User promoted to admin successfully' : 'Admin privileges removed successfully',
      user: userWithoutPassword
    });
  } catch (error) {
    console.error('Toggle admin status error:', error);
    res.status(500).json({ message: 'Error updating user admin status' });
  }
};

// Get all early bird signups with pagination
export const getEarlyBirdSignups = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const approved = req.query.approved === 'true' ? true : 
                     req.query.approved === 'false' ? false : undefined;

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

    res.json({
      signups,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get early bird signups error:', error);
    res.status(500).json({ message: 'Error fetching early bird signups' });
  }
};

// Approve multiple early bird signups at once
export const bulkApproveEarlyBirdSignups = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ message: 'Invalid request. No IDs provided.' });
      return;
    }

    const result = await prisma.earlyBirdSignup.updateMany({
      where: {
        id: { in: ids },
        approved: false
      },
      data: {
        approved: true
      }
    });

    res.json({ 
      message: `${result.count} signups approved successfully`,
      updated: result.count
    });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ message: 'Error approving signups' });
  }
}; 