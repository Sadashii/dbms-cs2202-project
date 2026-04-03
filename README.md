# Banking Platform – DBMS CS2202 Project

A full-stack Next.js banking platform with role-based access control, OTP-based authentication, and MongoDB integration.

## Tech Stack

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **Database:** MongoDB via Mongoose
- **Auth:** JWT (HTTP-only cookies) + Email OTP (Nodemailer)

## Quick Start

### 1. Start MongoDB locally with Docker

```bash
docker compose up -d
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your SMTP credentials
```

### 3. Install dependencies and run

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
.
├── app/
│   ├── (auth)/
│   │   ├── login/         # Email entry → OTP request
│   │   └── verify/        # OTP verification → JWT cookie
│   ├── actions/
│   │   ├── auth.ts        # requestOTP, verifyOTP, signOut
│   │   ├── customer.ts    # transferFunds, getMyProfile, getMyTransactions
│   │   └── admin.ts       # createCustomer, depositFunds, withdrawFunds, adminTransfer
│   ├── dashboard/         # Customer portal
│   │   ├── page.tsx       # Account overview
│   │   ├── transactions/  # Transaction history with filters
│   │   └── transfer/      # Fund transfer form
│   └── admin/             # Employee portal
│       ├── page.tsx       # Admin overview
│       ├── customers/     # Create new customer
│       └── ledger/        # Deposit / withdraw / transfer
├── components/
│   ├── Navbar.tsx
│   └── SubmitButton.tsx
├── lib/
│   ├── db.ts              # Mongoose connection (cached)
│   ├── auth.ts            # JWT sign/verify + cookie helpers
│   ├── email.ts           # Nodemailer helpers
│   ├── utils.ts           # OTP/account number/transaction ID generators
│   └── models/
│       ├── User.ts        # collection: 'Users'
│       └── Transaction.ts # collection: 'Transactions'
├── proxy.ts               # Next.js 16 proxy (RBAC route guard)
└── docker-compose.yml
```

## Authentication Flow

1. User visits `/login` and submits their email.
2. Server generates a 6-digit OTP, saves it to the User document (with 10-minute expiry), and sends it via email.
3. User submits the OTP at `/verify`.
4. Server validates the OTP, clears it, and issues an HTTP-only JWT cookie.
5. Proxy (`proxy.ts`) enforces role-based routing:
   - `CUSTOMER` → `/dashboard/*`
   - `EMPLOYEE` → `/admin/*`

## Roles

| Role       | Access               |
|------------|----------------------|
| CUSTOMER   | `/dashboard/*`       |
| EMPLOYEE   | `/admin/*`           |

Employees create customer accounts; customers cannot self-register.

## Database Models

- **Users** – `name`, `email`, `role`, `accountNumber` (unique), `balance`, `otp`, `otpExpiry`
- **Transactions** – `transactionId`, `type` (DEPOSIT/WITHDRAWAL/TRANSFER), `amount`, `senderId`, `receiverId`, `status`, `timestamp`

All ledger operations use Mongoose sessions for atomicity.
