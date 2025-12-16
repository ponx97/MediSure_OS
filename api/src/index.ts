import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import prisma from './utils/prisma';
import bcrypt from 'bcryptjs';
import { logger } from './utils/logger';

const PORT = process.env.PORT || 3001;

const bootstrapAdmin = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminEmail || !adminPassword) {
      logger.warn('ADMIN_EMAIL or ADMIN_PASSWORD not set. Skipping admin bootstrap.');
      return;
    }

    const existingAdmin = await prisma.user.findFirst({
      where: { role: 'ADMIN' },
    });

    if (!existingAdmin) {
      logger.info('No admin found. Creating initial admin user...');
      const passwordHash = await bcrypt.hash(adminPassword, 12);
      await prisma.user.create({
        data: {
          email: adminEmail,
          passwordHash,
          role: 'ADMIN',
        },
      });
      logger.info(`Admin user created: ${adminEmail}`);
    } else {
      logger.info('Admin user already exists.');
    }
  } catch (error) {
    logger.error('Error during admin bootstrap:', error);
  }
};

const startServer = async () => {
  try {
    // Check DB connection
    await prisma.$connect();
    logger.info('Connected to Database');

    await bootstrapAdmin();

    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Documentation available at http://localhost:${PORT}/docs`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    (process as any).exit(1);
  }
};

startServer();