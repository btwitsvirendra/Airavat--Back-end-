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
                email?: string;
                businessId?: string;
            };
        }
    }
}

// Interface for JWT payload
interface JwtPayload {
    userId: string;
    role: string;
    email?: string;
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

        // Get businessId from query, body, or headers if provided
        const businessId = req.query.business_id as string || 
                          req.body.business_id || 
                          req.headers['x-business-id'] as string;

        // Attach user info to request
        req.user = {
            userId: decoded.userId,
            role: decoded.role,
            email: decoded.email,
            businessId: businessId, // Optional - can be set by client
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
 * Middleware to verify if user is a Business Owner
 */
export const isBusinessOwner = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }

    if (req.user.role !== 'business_owner' && req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Access denied. Business owner privileges required.'
        });
        return;
    }

    next();
};

/**
 * Middleware to verify if user is a Seller (deprecated - use business roles instead)
 * @deprecated Use business-level role checking instead
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

    if (req.user.role !== 'seller' && req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Access denied. Seller privileges required.'
        });
        return;
    }

    next();
};

/**
 * Middleware to verify if user is a regular User (buyer) (deprecated)
 * @deprecated Use business-level role checking instead
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

    if (req.user.role !== 'user' && req.user.role !== 'admin') {
        res.status(403).json({
            error: 'Access denied. User privileges required.'
        });
        return;
    }

    next();
};

/**
 * Middleware to verify if user is either a Seller or Admin (deprecated)
 * @deprecated Use business-level role checking instead
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
 * Middleware to verify if user is either a User or Admin (deprecated)
 * @deprecated Use business-level role checking instead
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
