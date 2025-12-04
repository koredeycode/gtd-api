# Frontend Integration Guide

This guide outlines the steps and logic required to integrate a frontend application (e.g., React Native, React, Vue) with the GTD API.

## 1. Authentication
The API uses JWT (JSON Web Tokens) for authentication.

*   **Register**: POST `/auth/register` with email, password, first name, last name.
*   **Login**: POST `/auth/login` with email and password.
*   **Response**: Both endpoints return `{ access_token, user: { id, email, firstName, lastName } }`.
*   **Storage**: Store the `access_token` securely. Store the `user` object (especially `user.id`) for local logic (e.g., creating habits).
*   **Headers**: Add `Authorization: Bearer <access_token>` to all subsequent requests.

## 2. Initial Data Setup (Categories)
The app uses global, predefined categories.

*   **Fetch**: On app startup (or after login), call `GET /categories`.
*   **Store**: Save these categories locally (e.g., in a local SQLite DB or Redux/Context state). You will need the `id` of these categories when creating habits.

## 3. Offline-First Sync Engine
The core of the app is the offline-first capability. You need a local database (like SQLite, WatermelonDB, or Realm).

### Data Models
Replicate the backend schema locally:
*   **Habit**: `id` (UUID), `user_id`, `category_id`, `title`, `type` (BOOLEAN, NUMERIC, TEXT, RATING, DURATION), `target_value`, `frequency_json`, `updated_at`, `deleted_at`.
*   **Log**: `id` (UUID), `habit_id`, `user_id`, `date` (YYYY-MM-DD), `val_numeric`, `val_bool`, `val_text`, `updated_at`, `deleted_at`.

### Sync Logic (The "Sync Loop")
Implement a sync function that runs periodically (e.g., every minute) or on app focus/online status change.

1.  **Track Changes**:
    *   Maintain a `last_pulled_at` timestamp (default to 0).
    *   Track local changes that haven't been pushed yet (created, updated, deleted items).

2.  **Push & Pull (POST /api/v1/sync)**:
    *   Construct the payload:
        ```json
        {
          "last_pulled_at": <timestamp>,
          "changes": {
            "habits": { "created": [...], "updated": [...], "deleted": [...] },
            "logs": { "created": [...], "updated": [...], "deleted": [...] }
          }
        }
        ```
    *   **Send**: POST to `/api/v1/sync`.
    *   **Process Response**:
        *   **Apply Changes**: Insert/Update/Delete items from the response into your local DB.
        *   **Update Timestamp**: Update `last_pulled_at` with the `timestamp` from the response.
        *   **Clear Queue**: Mark the pushed local changes as "synced".

## 4. Analytics (Radar Chart)
*   **Fetch**: Call `GET /analytics/radar?range=week` (or `1m`, `3m`, etc.).
*   **Display**: Use a charting library (e.g., `react-native-chart-kit`, `recharts`) to display the data.
*   **Data Format**: The API returns `{ labels: string[], data: number[] }` where `data` is the completion percentage (0-100).

## 5. Habit Types Handling
The UI needs to adapt based on `habit.type`:

*   **BOOLEAN**: Show a checkbox or toggle.
*   **NUMERIC**: Show a number input or stepper.
*   **TEXT**: Show a text input area.
*   **RATING**: Show a 1-10 star/slider rating.
*   **DURATION**: Show a timer or time picker (minutes).

## 6. Error Handling
*   **401 Unauthorized**: Redirect to Login.
*   **Network Error**: Queue changes locally and retry when online.

## 7. Data Structure Examples

### Category
```json
{
  "id": "c1b2a3e4-...",
  "name": "Health & Fitness",
  "color": "#FF5733",
  "createdAt": "2023-12-01T10:00:00Z",
  "updatedAt": "2023-12-01T10:00:00Z"
}
```

### Habit Examples

**1. Boolean Habit (e.g., "Morning Jog")**
```json
{
  "id": "h1...",
  "user_id": "u1...",
  "category_id": "c1...",
  "title": "Morning Jog",
  "type": "BOOLEAN",
  "target_value": null,
  "frequency_json": { "type": "daily" },
  "updated_at": "2023-12-04T08:00:00Z"
}
```

**2. Numeric Habit (e.g., "Drink Water")**
```json
{
  "id": "h2...",
  "user_id": "u1...",
  "category_id": "c1...",
  "title": "Drink Water",
  "type": "NUMERIC",
  "target_value": 2000, // mL
  "frequency_json": { "type": "daily" },
  "updated_at": "2023-12-04T08:00:00Z"
}
```

**3. Rating Habit (e.g., "Mood")**
```json
{
  "id": "h3...",
  "user_id": "u1...",
  "category_id": "c3...",
  "title": "Daily Mood",
  "type": "RATING",
  "target_value": 10, // Max rating
  "frequency_json": { "type": "daily" },
  "updated_at": "2023-12-04T08:00:00Z"
}
```

**4. Duration Habit (e.g., "Meditation")**
```json
{
  "id": "h4...",
  "user_id": "u1...",
  "category_id": "c6...",
  "title": "Meditation",
  "type": "DURATION",
  "target_value": 30, // Minutes
  "frequency_json": { "type": "daily" },
  "updated_at": "2023-12-04T08:00:00Z"
}
```

### Log Examples

**1. Log for Boolean Habit**
```json
{
  "id": "l1...",
  "habit_id": "h1...",
  "user_id": "u1...",
  "date": "2023-12-04",
  "val_bool": true,
  "val_numeric": null,
  "val_text": null,
  "updated_at": "2023-12-04T09:00:00Z"
}
```

**2. Log for Numeric/Rating/Duration Habit**
```json
{
  "id": "l2...",
  "habit_id": "h2...",
  "user_id": "u1...",
  "date": "2023-12-04",
  "val_bool": null,
  "val_numeric": 1500, // The value recorded (mL, Rating, or Minutes)
  "val_text": null,
  "updated_at": "2023-12-04T10:00:00Z"
}
```

## 8. New Features Integration

### Profile Management
*   **Update**: `PATCH /users/profile` with `{ firstName, lastName }`.
*   **Delete**: `DELETE /users/profile` with `{ password }`. Prompt user for password before calling this.

### Feedback
*   **Submit**: `POST /feedback` with `{ message }`. Show a success toast "Feedback sent!".

### Data Export
*   **Request**: `POST /export` with `{ format: 'csv' | 'excel', range: 'week' | '1m' ... }`.
*   **UI**: Show a "Export Data" button in settings. When clicked, show a modal to select format and range. After success, show "Export started. Check your email."
