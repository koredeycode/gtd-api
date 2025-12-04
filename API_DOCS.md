# GTD API Documentation

This document provides a detailed explanation of the available API endpoints for the GTD (Get Things Done) application.

## Base URL
`http://localhost:3000`

## Authentication

### Register
**POST** `/auth/register`

Registers a new user.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

### Login
**POST** `/auth/login`

Authenticates an existing user and returns a JWT.

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid-v4",
    "email": "user@example.com",
    "firstName": "John",
    "lastName": "Doe"
  }
}
```

## Synchronization
All sync endpoints require a valid Bearer token in the `Authorization` header.

### Sync Data (Push & Pull)
**POST** `/api/v1/sync`

This is the core endpoint for data synchronization. It handles both pushing local changes to the server and pulling remote changes from the server.

**Logic:**
1.  **Push**: The server processes the `changes` object.
    *   `created` and `updated` items are upserted (inserted or updated) into the database.
    *   `deleted` items are soft-deleted (marked with `deleted_at`).
2.  **Pull**: The server queries for any items belonging to the user that have an `updated_at` timestamp greater than the `last_pulled_at` timestamp provided in the request.

**Request Body:**
```json
{
  "last_pulled_at": 1701700000,
  "changes": {
    "habits": {
      "created": [
        {
          "id": "uuid-v4",
          "user_id": "uuid-v4",
          "category_id": "uuid-v4",
          "title": "Drink Water",
          "type": "NUMERIC",
          "target_value": 2000,
          "frequency_json": { "type": "daily" },
          "updated_at": "2023-12-04T10:00:00Z"
        }
      ],
      "updated": [],
      "deleted": ["uuid-to-delete"]
    },
    "logs": {
      "created": [],
      "updated": [
        {
          "id": "uuid-v4",
          "habit_id": "uuid-v4",
          "user_id": "uuid-v4",
          "date": "2023-12-04",
          "val_numeric": 1500,
          "updated_at": "2023-12-04T12:00:00Z"
        }
      ],
      "deleted": []
    }
  }
}
```

**Response (201 Created):**
Returns the changes that occurred on the server since `last_pulled_at`.
```json
{
  "changes": {
    "habits": {
      "created": [],
      "updated": [ ... ],
      "deleted": [ ... ]
    },
    "logs": {
      "created": [],
      "updated": [ ... ],
      "deleted": [ ... ]
    }
  },
  "timestamp": 1701710000
}
```

## Analytics

### Get Radar Chart Data
**GET** `/analytics/radar`

Calculates the completion rate for each category for the specified range.

**Query Parameters:**
*   `range` (optional): `week`, `1m`, `3m`, `6m`, `1y`. Defaults to `week`.

**Response (200 OK):**
```json
[
  {
    "category": "Health",
    "completionRate": 85
  },
  {
    "category": "Work",
    "completionRate": 60
  }
]
```

## Categories

### Get All Categories
**GET** `/categories`

Retrieves a list of all available global categories.

**Response (200 OK):**
```json
[
  {
    "id": "uuid-v4",
    "name": "Health & Fitness",
    "color": "#FF5733",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "deletedAt": null
  },
  {
    "id": "uuid-v4",
    "name": "Work & Career",
    "color": "#33FF57",
    "createdAt": "2023-01-01T00:00:00Z",
    "updatedAt": "2023-01-01T00:00:00Z",
    "deletedAt": null
  }
]
```
