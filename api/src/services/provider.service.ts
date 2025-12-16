import prisma from '../utils/prisma';

export const create = async (data: any) => prisma.provider.create({ data });
export const findAll = async () => prisma.provider.findMany();
export const findById = async (id: string) => prisma.provider.findUnique({ where: { id } });
export const update = async (id: string, data: any) => prisma.provider.update({ where: { id }, data });
export const remove = async (id: string) => prisma.provider.delete({ where: { id } });
