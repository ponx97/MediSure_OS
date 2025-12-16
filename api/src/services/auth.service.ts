import bcrypt from 'bcryptjs';
import jwt, { SignOptions, Secret } from 'jsonwebtoken';
import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import type { UserRole } from '@prisma/client';

const jwtSecret = (process.env.JWT_SECRET || '').trim();
if (!jwtSecret) {
  // Fail fast so we don't sign with undefined secrets in production
  throw new Error('JWT_SECRET is not set');
}

const signTokens = (userId: string, role: UserRole) => {
  const accessOpts: SignOptions = {
    expiresIn: (process.env.JWT_ACCESS_EXPIRATION || '15m') as any,
  };

  const refreshOpts: SignOptions = {
    expiresIn: (process.env.JWT_REFRESH_EXPIRATION || '7d') as any,
  };

  const accessToken = jwt.sign(
    { userId, role },
    jwtSecret as Secret,
    accessOpts
  );

  const refreshToken = jwt.sign(
    { userId },
    jwtSecret as Secret,
    refreshOpts
  );

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

export const register = async (email: string, password: string, role: UserRole) => {
  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) throw new AppError('Email already in use', 400);

  const passwordHash = await bcrypt.hash(password, 12);
  const newUser = await prisma.user.create({
    data: { email, passwordHash, role },
  });

  return { id: newUser.id, email: newUser.email, role: newUser.role };
};

export const refresh = async (refreshToken: string) => {
  try {
    const decoded = jwt.verify(refreshToken, jwtSecret as Secret) as any;
    const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

    if (!user) throw new AppError('User not found', 401);

    return signTokens(user.id, user.role);
  } catch {
    throw new AppError('Invalid refresh token', 401);
  }
};
