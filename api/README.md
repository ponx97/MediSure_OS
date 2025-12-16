# Medisure OS API

Backend API for Medisure OS built with Express, TypeScript, Prisma, and PostgreSQL.

## Prerequisites

- Node.js 20+
- PostgreSQL

## Setup

1.  Navigate to `api/` folder.
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Configure `.env`:
    ```bash
    cp .env.example .env
    # Update DATABASE_URL and other secrets
    ```
4.  Run Prisma Migrations:
    ```bash
    npx prisma migrate dev --name init
    ```
5.  Start the server:
    ```bash
    npm run dev
    ```

## Authentication

- **Admin Bootstrap**: On first run, if no admin exists, one is created using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`.
- Use `/api/auth/login` to get an Access Token.
- Include header `Authorization: Bearer <token>` for protected routes.

## Documentation

Swagger UI is available at `http://localhost:3001/docs`.
