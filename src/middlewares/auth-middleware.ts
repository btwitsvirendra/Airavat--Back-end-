import { Request, Response, NextFunction } from 'express';
import { verify } from 'jsonwebtoken';
import dotenv from 'dotenv';

dotenv.config();

// Extend Express Request interface to include user data
declare global {
    namespace Express {
        interface Request {
            user?: {
                userId: string;
                role: string;
            };
        }
    }
}

// Interface for JWT payload
interface JwtPayload {
    userId: string;
    role: string;
    iat?: number;
    exp?: number;
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticateToken = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            res.status(401).json({ error: 'Access denied. No token provided.' });
            return;
        }

        // Verify token
        const decoded = verify(
            token,
            process.env.JWT_SECRET || 'your_jwt_secret'
        ) as JwtPayload;

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
        };

        next();
    } catch (err: any) {
        if (err.name === 'TokenExpiredError') {
            res.status(401).json({ error: 'Token has expired.' });
            return;
        }
        if (err.name === 'JsonWebTokenError') {
            res.status(403).json({ error: 'Invalid token.' });
            return;
        }
        res.status(500).json({ error: 'Failed to authenticate token.' });
    }
};

/**
 * Middleware to verify if user is an Admin
 */
export const isAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    if (req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Access denied. Admin privileges required.'
        });
        return;
    }

    next();
};

/**
 * Middleware to verify if user is a Seller
 */
export const isSeller = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    if (req.user.role !== 'seller') {
        res.status(403).json({
            error: 'Access denied. Seller privileges required.'
        });
        return;
    }

    next();
};

/**
 * Middleware to verify if user is a regular User (buyer)
 */
export const isUser = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    if (req.user.role !== 'user') {
        res.status(403).json({
            error: 'Access denied. User privileges required.'
        });
        return;
    }

    next();
};

/**
 * Middleware to verify if user is either a Seller or Admin
 */
export const isSellerOrAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Access denied. Seller or Admin privileges required.'
        });
        return;
    }

    next();
};

/**
 * Middleware to verify if user is either a User or Admin
 */
export const isUserOrAdmin = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    if (req.user.role !== 'user' && req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Access denied. User or Admin privileges required.'
        });
        return;
    }

    next();
};

/**
 * Middleware to check if user has any of the specified roles
 */
export const hasRole = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({ error: 'Authentication required.' });
            return;
        }

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                error: `Access denied. Required roles: ${roles.join(', ')}`
            });
            return;
        }

        next();
    };
};
