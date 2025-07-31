# ⚽ Everest Warriors Pickup Game Manager

A web-based application for organizing, managing, and tracking pickup soccer games. It supports features like team creation, member and guest management, game payments (paid vs. free), admin roles (including finance admin), and AWS-integrated authentication and data storage.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

Visit https://ew-pickup.vercel.app for prod version

# EW Pickup Dev Setup & AWS CLI Guide

This document provides full instructions to set up your local development environment and interact with the DynamoDB Users table using AWS CLI.

---

## 1. Clone and Setup Project

```bash
git clone https://github.com/<your-fork-or-main-repo>.git
cd ew-pickup
```

Install dependencies:

```bash
npm install
```

Create `.env.local` based on `.env.example` or below:

```env
NEXT_PUBLIC_APP_NAME=EW Pickup
NEXT_PUBLIC_REGION=us-west-2
AMPLIFY_AUTH_IDENTITYPOOLID=...
AMPLIFY_AUTH_USERPOOLID=...
AMPLIFY_AUTH_USERPOOLWEBCLIENTID=...
AMPLIFY_AUTH_DOMAIN=...
```

You can find `amplify_outputs.json` already committed. Ensure your values are synced.

---

## 2. Run the Project Locally

```bash
npm run dev
```

Login via Google OAuth when prompted. On first login, a new user profile will be created in DynamoDB.

---

## 3. Authentication

- **Login Method**: Google OAuth via AWS Cognito
- **First-Time Users**: Will be redirected to `/profile/edit` to set basic info
- **Admin Privileges**: Controlled by `IsAdmin` and `IsFinanceAdmin` flags in the Users table

---

## 4. AWS CLI Setup

Install AWS CLI (if not already):

```bash
brew install awscli
```

Configure credentials:

```bash
aws configure
```

> Use the shared AWS access key ID and secret key:
> ```
> AWS Access Key ID:     <ask teammate>
> AWS Secret Access Key: <ask teammate>
> Default region:        us-west-2
> ```

---

## 5. Querying DynamoDB (PartiQL)

### Open AWS Console → DynamoDB → PartiQL Editor

#### Get all users:

```sql
SELECT * FROM "Users"
```

#### Find user by FirstName:

```sql
SELECT * FROM "Users" WHERE FirstName = 'Madhav'
```

---

## 6. Update Users to Finance Admin

To grant `IsFinanceAdmin = true` for specific `UserId`s:

```sql
UPDATE "Users"
SET IsFinanceAdmin = true
WHERE UserId = 'b8f18370-60d1-7009-6043-d33d2d05932b'
```

Repeat for other IDs:

```sql
UPDATE "Users"
SET IsFinanceAdmin = true
WHERE UserId = '18e1b3e0-80d1-70d1-da6d-54ba80f08943'
```

---

## 7. Role-Based Access in App

| Role Flag        | Description                                      |
|------------------|--------------------------------------------------|
| `IsAdmin`        | Allows access to admin-only views                |
| `IsFinanceAdmin` | Allows editing of `PaymentDue` field on Members |

- Only finance admins can edit member payments.
- All new users default to `IsFinanceAdmin = false`.

---

## 8. Testing Payments Editing

To test:
1. Log in as a user with `IsFinanceAdmin = true`
2. Visit `/members`
3. You should see ✎ (edit) next to Payment Due fields
4. Non-finance admins will not see this button

---

## 9. Git & Pull Requests

### Setup Git Auth (one-time):

```bash
git config --global credential.helper cache
git config --global credential.helper osxkeychain
```

Use your GitHub **Personal Access Token** when prompted for password.

---

## Notes

- If you face 403 pushing to upstream: make sure you're pushing to your **fork**, not original repo.
- After PR is merged, pull latest with:

```bash
git checkout main
git pull origin main
```

---

## Questions?

Contact @rajbaral or project maintainer for:

- AWS credentials
- GitHub repo permissions
- Missing config values

---

