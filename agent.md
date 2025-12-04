Role: Senior Backend Architect (NestJS & Drizzle ORM) Objective: Build the API and Sync Engine for "Get Things Done".

You are building the backend for "Get Things Done".

**Tech Stack Constraints:**
- **Framework:** NestJS.
- **Language:** TypeScript.
- **Database:** PostgreSQL.
- **ORM:** Drizzle ORM.
- **Pattern:** Domain-Driven Design (DDD).

implement testing, use docker for the database for both test, development and production.

implement swagger ui for the api documentation.

**1. Database Schema (Drizzle)**
You must define these exact tables with these critical sync columns: `created_at`, `updated_at`, `deleted_at` (for soft deletes). uuid for the id.

- **Table: `users`** (id, email, password_hash, created_at...)
- **Table: `categories`** (id, user_id, name, color, updated_at, deleted_at...)
- **Table: `habits`**
  - id, user_id, category_id, goal_id
  - title, type (enum), target_value
  - frequency_json
  - updated_at, deleted_at
- **Table: `logs`**
  - id, habit_id, user_id (denormalized for speed)
  - date (date type)
  - val_numeric (float, nullable)
  - val_text (text, nullable)
  - val_bool (boolean, nullable)
  - updated_at, deleted_at
- **Table: `goals`**
  - id: 
  - user_id
  - title: String (e.g., "Buy a House")
  - target_date: Date
  - updated_at, deleted_at

**2. API Modules & Endpoints**

**Module: `SyncModule` (The most critical part)**
- **POST `/api/v1/sync`**
  - **Input:**
    ```json
    {
      "last_pulled_at": 1700000000,
      "changes": {
        "habits": { "created": [], "updated": [], "deleted": [] },
        "logs": { "created": [], "updated": [], "deleted": [] }
      }
    }
    ```
  - **Logic:**
    1.  **Push:** Execute a transaction. Upsert all `created`/`updated` items. Mark `deleted` items by setting `deleted_at = NOW()`.
    2.  **Pull:** Query all tables where `updated_at > last_pulled_at` AND `user_id == current_user`.
  - **Output:**
    ```json
    {
      "changes": { ... },
      "timestamp": 1700000050
    }
    ```

**Module: `AuthModule`**
- `POST /auth/register` (Validate email, hash password).
- `POST /auth/login` (Return JWT access token + refresh token).

**Module: `AnalyticsModule`**
- `GET /analytics/radar`
  - Logic: Calculate completion rates per category for the current week.
  - Return: `{ labels: ["Health", "Career"], data: [80, 45] }`.

**3. Domain Rules (DDD)**
- **Entity:** `Habit`
- **Invariant:** A habit cannot have a `target_value` if type is `BOOLEAN`.
- **Invariant:** A log entry date cannot be in the future.

**Deliverables:**
1.  Full `schema.ts` (Drizzle) with relations defined.
2.  The `SyncService` code handling the complex Push/Pull logic with Transactions.
3.  The `AppModule` structure.

do anything you think is necessary to build the api. implement the best practices.

the current directory is the working directory. also do everything without my permission. initialize git repository. s