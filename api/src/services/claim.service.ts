import prisma from '../utils/prisma';
import { AppError } from '../utils/AppError';
import { ClaimStatus } from '@prisma/client';

const logAudit = async (
  userId: string,
  action: string,
  entityId: string,
  metadata: any
) => {
  await prisma.auditLog.create({
    data: {
      actorUserId: userId,
      action,
      entityType: 'CLAIM',
      entityId,
      metadataJson: metadata,
    },
  });
};

export const create = async (data: any, userId: string) => {
  const { items, ...claimData } = data;

  const claim = await prisma.$transaction(async (tx) => {
    const newClaim = await tx.claim.create({
      data: {
        ...claimData,
        status: ClaimStatus.submitted,
      },
    });

    if (items && items.length > 0) {
      await tx.claimItem.createMany({
        data: items.map((item: any) => ({
          ...item,
          total: item.qty * item.unitCost,
          claimId: newClaim.id,
        })),
      });
    }

    return newClaim;
  });

  await logAudit(userId, 'CREATE_CLAIM', claim.id, { claimNo: claim.claimNo });
  return claim;
};

export const findAll = async () =>
  prisma.claim.findMany({
    include: { member: true, provider: true, items: true },
  });

export const findById = async (id: string) =>
  prisma.claim.findUnique({
    where: { id },
    include: { member: true, provider: true, items: true, payments: true },
  });

// Workflow actions
export const submit = async (id: string, userId: string) => {
  const claim = await prisma.claim.update({
    where: { id },
    data: { status: ClaimStatus.submitted },
  });
  await logAudit(userId, 'SUBMIT_CLAIM', id, { status: ClaimStatus.submitted });
  return claim;
};

export const review = async (id: string, notes: string, userId: string) => {
  const claim = await prisma.claim.update({
    where: { id },
    data: { status: ClaimStatus.review, notes },
  });
  await logAudit(userId, 'REVIEW_CLAIM', id, { status: ClaimStatus.review, notes });
  return claim;
};

export const approve = async (
  id: string,
  amountApproved: number,
  notes: string,
  userId: string
) => {
  const claim = await prisma.claim.update({
    where: { id },
    data: { status: ClaimStatus.approved, amountApproved, notes },
  });
  await logAudit(userId, 'APPROVE_CLAIM', id, {
    status: ClaimStatus.approved,
    amountApproved,
  });
  return claim;
};

export const reject = async (id: string, notes: string, userId: string) => {
  const claim = await prisma.claim.update({
    where: { id },
    data: { status: ClaimStatus.rejected, notes },
  });
  await logAudit(userId, 'REJECT_CLAIM', id, { status: ClaimStatus.rejected, notes });
  return claim;
};

export const pay = async (
  id: string,
  paidAmount: number,
  reference: string,
  userId: string
) => {
  const claim = await prisma.claim.findUnique({ where: { id } });
  if (!claim) throw new AppError('Claim not found', 404);

  if (claim.status !== ClaimStatus.approved && claim.status !== ClaimStatus.paid) {
    throw new AppError('Claim must be approved before payment', 400);
  }

  const result = await prisma.$transaction(async (tx) => {
    const payment = await tx.payment.create({
      data: {
        claimId: id,
        paidAmount,
        reference,
        paidAt: new Date(), // ✅ required in your schema
      },
    });

    const updatedClaim = await tx.claim.update({
      where: { id },
      data: { status: ClaimStatus.paid },
    });

    return { payment, updatedClaim };
  });

  await logAudit(userId, 'PAY_CLAIM', id, { amount: paidAmount, reference });
  return result;
};

export const addClaimItem = async (claimId: string, data: any) => {
  const total = data.qty * data.unitCost;
  return prisma.claimItem.create({ data: { ...data, total, claimId } });
};

export const removeClaimItem = async (itemId: string) => {
  return prisma.claimItem.delete({ where: { id: itemId } });
};
