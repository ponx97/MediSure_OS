import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';

const signTokens = (userId: string, role: string) => {
  const accessToken = jwt.sign({ userId, role }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_ACCESS_EXPIRATION || '15m',
  });
  
  const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET as string, {
    expiresIn: process.env.JWT_REFRESH_EXPIRATION || '7d',
  });

  return { accessToken, refreshToken };
};

export const login = async (email: string, password: string) => {
  const user = await prisma.user.findUnique({ where: { email } });
  
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    throw new AppError('Incorrect email or password', 401);
  }

  const tokens = signTokens(user.id, user.role);
  return { user: { id: user.id, email: user.email, role: user.role }, ...tokens };
};

export const register = async (email: string, password: string, role: any) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    throw new AppError('Email already in use', 400);
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const newUser = await prisma.user.create({
    data: { email, passwordHash, role },
  });

  return { id: newUser.id, email: newUser.email, role: newUser.role };
};

export const refresh = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET as string) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });
    
    if (!user) {
      throw new AppError('User not found', 401);
    }

    const tokens = signTokens(user.id, user.role);
    return tokens;
  } catch (error) {
    throw new AppError('Invalid refresh token', 401);
  }
};
