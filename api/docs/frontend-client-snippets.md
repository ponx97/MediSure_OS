# Frontend Client Integration Snippets

This document provides TypeScript examples for integrating the Medisure OS API into a React frontend.

## Base Configuration

Ensure your API client (e.g., Axios or Fetch wrapper) handles the Authorization header.

```typescript
const API_URL = 'http://localhost:4010/api'; // Or https://api.medisureos.ithinksys.co.zw/api

// Helper for headers
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : '',
  };
};
```

---

## 1. Login (Authentication)

**Endpoint:** `POST /auth/login`

```typescript
interface LoginResponse {
  user: {
    id: string;
    email: string;
    role: 'ADMIN' | 'STAFF' | 'PROVIDER' | 'MEMBER';
  };
  accessToken: string;
  refreshToken: string;
}

export const login = async (email: string, password: string): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Login failed');
  }

  return response.json();
};
```

---

## 2. List Members

**Endpoint:** `GET /members`
**Requires:** `ADMIN` or `STAFF` role.

```typescript
interface Member {
  id: string;
  memberNo: string;
  fullName: string;
  status: string;
  // ... other fields
}

export const getMembers = async (): Promise<Member[]> => {
  const response = await fetch(`${API_URL}/members`, {
    method: 'GET',
    headers: getHeaders(),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch members');
  }

  return response.json();
};
```

---

## 3. Create Claim

**Endpoint:** `POST /claims`
**Requires:** `ADMIN`, `STAFF`, or `PROVIDER` role.

```typescript
interface CreateClaimPayload {
  claimNo: string;
  memberId: string;
  providerId: string;
  policyId: string;
  amountClaimed: number;
  notes?: string;
  items: Array<{
    description: string;
    qty: number;
    unitCost: number;
  }>;
}

export const createClaim = async (data: CreateClaimPayload) => {
  const response = await fetch(`${API_URL}/claims`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to create claim');
  }

  return response.json();
};
```

---

## 4. Approve Claim

**Endpoint:** `POST /claims/:id/approve`
**Requires:** `ADMIN` or `STAFF` role.

```typescript
interface ApproveClaimPayload {
  amountApproved: number;
  notes?: string;
}

export const approveClaim = async (claimId: string, data: ApproveClaimPayload) => {
  const response = await fetch(`${API_URL}/claims/${claimId}/approve`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Failed to approve claim');
  }

  return response.json();
};
```
