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
*   **Response**:
    ```json
    [
      {
        "id": "c1b2a3e4-...",
        "name": "Health & Fitness",
        "color": "#FF5733"
      },
      ...
    ]
    ```
*   **Store**: Save these categories locally (e.g., in a local SQLite DB or Redux/Context state). You will need the `id` of these categories when creating habits.

## 3. Offline-First Sync Engine
The core of the app is the offline-first capability. You need a local database (like SQLite, WatermelonDB, or Realm).

### Data Models
Replicate the backend schema locally:
*   **Habit**: `id` (UUID), `user_id`, `category_id`, `title`, `frequency_json`, `updated_at`, `deleted_at`.
*   **Log**: `id` (UUID), `habit_id`, `user_id`, `date` (YYYY-MM-DD), `value` (BOOLEAN), `text` (TEXT), `updated_at`, `deleted_at`.

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

## 5. Habit Handling
All habits are now simple "Done / Not Done" checks.
*   **UI**: Show a checkbox or toggle for every habit.
*   **Optional Text**: Users can optionally add a note (text) to their log entry.

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

### Habit Example
```json
{
  "id": "h1...",
  "user_id": "u1...",
  "category_id": "c1...",
  "title": "Morning Jog",
  "frequency_json": { "type": "daily" },
  "updated_at": "2023-12-04T08:00:00Z"
}
```

### Log Example
```json
{
  "id": "l1...",
  "habit_id": "h1...",
  "user_id": "u1...",
  "date": "2023-12-04",
  "value": true,
  "text": "Felt great today!", // Optional
  "updated_at": "2023-12-04T09:00:00Z"
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

### AI Habit Generation
*   **Generate**: `POST /habits/generate`
*   **Payload**:
    ```json
    {
      "goal": "Improve sleep quality",
      "categories": ["Health", "Mindfulness"]
    }
    ```
*   **Response**:
    ```json
    {
      "categories": [
        {
          "name": "Health",
          "habits": [
            { "title": "No screens 1 hour before bed" }
          ]
        },
        ...
      ]
    }
    ```
*   **UI**:
    1.  Show a "Generate with AI" button in the Create Habit flow.
    2.  Open a modal or new screen asking for "Goal" (text input) and "Categories" (multi-select from existing categories).
    3.  Call the endpoint.
    4.  Display the results.
    5.  Allow user to select which generated habits to add to their list.
    6.  Call `POST /habits/bulk` with the selected habits.

### Bulk Create Habits
*   **Create**: `POST /habits/bulk`
*   **Payload**:
    ```json
    {
      "categories": [
        {
          "categoryId": "c1b2a3e4-...",
          "habits": ["No screens 1 hour before bed"]
        }
      ]
    }
    ```
*   **Response**: List of created habits objects.

