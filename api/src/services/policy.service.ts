import prisma from '../utils/prisma';

export const create = async (data: any) => {
  if (typeof data.startDate === 'string') data.startDate = new Date(data.startDate);
  if (typeof data.endDate === 'string') data.endDate = new Date(data.endDate);
  return prisma.policy.create({ data });
};
export const findAll = async () => prisma.policy.findMany({ include: { member: true } });
export const findById = async (id: string) => prisma.policy.findUnique({ where: { id }, include: { member: true } });
export const update = async (id: string, data: any) => {
  if (typeof data.startDate === 'string') data.startDate = new Date(data.startDate);
  if (typeof data.endDate === 'string') data.endDate = new Date(data.endDate);
  return prisma.policy.update({ where: { id }, data });
};
export const remove = async (id: string) => prisma.policy.delete({ where: { id } });
