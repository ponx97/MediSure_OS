import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
  }),
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string(),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(6),
    role: z.enum(['admin', 'staff', 'provider', 'member']),
  }),
});

export const createMemberSchema = z.object({
  body: z.object({
    memberNo: z.string().min(3),
    fullName: z.string().min(3),
    dob: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    phone: z.string(),
    address: z.string(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
});

export const createProviderSchema = z.object({
  body: z.object({
    name: z.string().min(2),
    type: z.string(),
    address: z.string(),
    phone: z.string(),
  }),
});

export const createPolicySchema = z.object({
  body: z.object({
    memberId: z.string().uuid(),
    planName: z.string(),
    startDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    endDate: z.string().datetime().or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
    status: z.enum(['ACTIVE', 'EXPIRED', 'CANCELLED']).optional(),
  }),
});

export const createClaimSchema = z.object({
  body: z.object({
    claimNo: z.string(),
    memberId: z.string().uuid(),
    providerId: z.string().uuid(),
    policyId: z.string().uuid(),
    amountClaimed: z.number().positive(),
    notes: z.string().optional(),
    items: z.array(z.object({
      description: z.string(),
      qty: z.number().int().positive(),
      unitCost: z.number().positive(),
    })).min(1),
  }),
});

export const reviewClaimSchema = z.object({
  body: z.object({
    notes: z.string().optional(),
  }),
});

export const approveClaimSchema = z.object({
  body: z.object({
    amountApproved: z.number().positive(),
    notes: z.string().optional(),
  }),
});

export const rejectClaimSchema = z.object({
  body: z.object({
    notes: z.string(),
  }),
});

export const payClaimSchema = z.object({
  body: z.object({
    paidAmount: z.number().positive(),
    reference: z.string(),
  }),
});
