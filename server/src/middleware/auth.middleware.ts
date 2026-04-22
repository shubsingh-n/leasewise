import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface AdminRequest extends Request {
  admin?: { email: string };
}

export const requireAdmin = (req: AdminRequest, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Unauthorized: No token provided' });
    return;
  }

  const parts = authHeader.split(' ');
  const token = parts[1];
  
  if (!token) {
    res.status(401).json({ message: 'Unauthorized: Malformed token' });
    return;
  }

  try {
    const secret = process.env.JWT_SECRET!;
    // @ts-ignore
    const decoded = jwt.verify(token, secret) as any;
    req.admin = { email: decoded.email };
    next();
  } catch (err) {
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};
