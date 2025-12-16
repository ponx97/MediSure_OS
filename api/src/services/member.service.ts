import prisma from '../utils/prisma';

export const create = async (data: any) => {
  // ISO Date conversion if needed
  if (typeof data.dob === 'string') data.dob = new Date(data.dob);
  return await prisma.member.create({ data });
};

export const findAll = async () => {
  return await prisma.member.findMany();
};

export const findById = async (id: string) => {
  return await prisma.member.findUnique({ where: { id }, include: { policies: true } });
};

export const update = async (id: string, data: any) => {
  if (typeof data.dob === 'string') data.dob = new Date(data.dob);
  return await prisma.member.update({ where: { id }, data });
};

export const remove = async (id: string) => {
  return await prisma.member.delete({ where: { id } });
};
