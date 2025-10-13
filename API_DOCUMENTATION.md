# API Documentation

This document outlines the available API endpoints for the queueing system. 

---

## 1. Public Endpoints

These endpoints are public and do not require authentication. They are subject to rate limiting.

### `POST /api/v1/public/login`

*   **Description:** Authenticates a user and returns a JWT token.
*   **Authorization:** Public.
*   **Request Body:**

| Field      | Type   | Required |
|------------|--------|----------|
| `userName` | string | Yes      |
| `password` | string | Yes      |

### `POST /api/v1/public/tickets`

*   **Description:** Creates a new ticket for a specific service.
*   **Authorization:** Public.
*   **Notes:** This will create a new ticket with the next sequential queue number for the given service on the current date.
*   **Request Body:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `serviceId` | string (uuid) | Yes      |

### `GET /api/v1/public/services`

*   **Description:** Gets a list of all available services.
*   **Authorization:** Public.
*   **Query Parameters:** None.

### `GET /api/v1/public/organizations`

*   **Description:** Gets a list of all organizations and their associated services.
*   **Authorization:** Public.
*   **Query Parameters:** None.

### `GET /api/v1/public/queues`

*   **Description:** Gets the currently calling queue numbers for real-time display.
*   **Authorization:** Public.
*   **Query Parameters:** None.

### `GET /api/v1/public/call-queue/:queueId`

*   **Description:** Fetches the generated text-to-speech audio file for a specific queue ID to be played.
*   **Authorization:** Public.
*   **URL Parameters:**

| Field     | Type          | Required |
|-----------|---------------|----------|
| `queueId` | string (uuid) | Yes      |

---

## 2. Authenticated Endpoints

All endpoints below require a `Bearer <token>` in the `Authorization` header.

### Organization Routes

*   **`GET /api/v1/organizations`**
    *   **Description:** Get a paginated list of organizations.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **Notes:** Supports pagination using `page` and `pageSize`.
    *   **Query Parameters:**

| Field        | Type    | Required |
|--------------|---------|----------|
| `name`       | string  | No       |
| `fullName`   | string  | No       |
| `isActive`   | boolean | No       |
| `page`       | number  | No       |
| `pageSize`   | number  | No       |

*   **`GET /api/v1/organizations/:organizationId`**
    *   **Description:** Get a single organization by ID.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **URL Parameters:**

| Field            | Type          | Required |
|------------------|---------------|----------|
| `organizationId` | string (uuid) | Yes      |

*   **`POST /api/v1/organizations`**
    *   **Description:** Create a new organization.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **Request Body:**

| Field      | Type   | Required |
|------------|--------|----------|
| `name`     | string | Yes      |
| `fullName` | string | No       |

*   **`PUT /api/v1/organizations/:organizationId`**
    *   **Description:** Update an organization.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **URL Parameters:**

| Field            | Type          | Required |
|------------------|---------------|----------|
| `organizationId` | string (uuid) | Yes      |

    *   **Request Body:**

| Field      | Type    | Required |
|------------|---------|----------|
| `name`     | string  | Yes      |
| `fullName` | string  | No       |
| `isActive` | boolean | Yes      |

*   **`DELETE /api/v1/organizations/:organizationId`**
    *   **Description:** Delete an organization.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **URL Parameters:**

| Field            | Type          | Required |
|------------------|---------------|----------|
| `organizationId` | string (uuid) | Yes      |

### User Routes

*   **`GET /api/v1/users`**
    *   **Description:** Get a paginated list of users.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **Notes:** Supports pagination using `page` and `pageSize`.
    *   **Query Parameters:**

| Field          | Type    | Required |
|----------------|---------|----------|
| `userName`     | string  | No       |
| `fullName`     | string  | No       |
| `role`         | string  | No       |
| `organization` | string  | No       |
| `isActive`     | boolean | No       |
| `page`         | number  | No       |
| `pageSize`     | number  | No       |

*   **`GET /api/v1/users/:userId`**
    *   **Description:** Get a single user by ID.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **URL Parameters:**

| Field    | Type          | Required |
|----------|---------------|----------|
| `userId` | string (uuid) | Yes      |

*   **`POST /api/v1/users`**
    *   **Description:** Create a new user.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **Notes:** `organizationId` is required only when the `role` is `USER`. `ADMIN` users are not tied to a specific organization.
    *   **Request Body:**

| Field          | Type          | Required                               |
|----------------|---------------|----------------------------------------|
| `userName`     | string        | Yes                                    |
| `fullName`     | string        | Yes                                    |
| `password`     | string        | Yes                                    |
| `role`         | string        | Yes (`ADMIN` or `USER`)                |
| `organizationId`| string (uuid) | Yes (if role is `USER`)                |

*   **`PUT /api/v1/users/:userId`**
    *   **Description:** Update a user.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **Notes:** `organizationId` is required only when the `role` is `USER`.
    *   **URL Parameters:**

| Field    | Type          | Required |
|----------|---------------|----------|
| `userId` | string (uuid) | Yes      |

    *   **Request Body:**

| Field          | Type          | Required                               |
|----------------|---------------|----------------------------------------|
| `userName`     | string        | Yes                                    |
| `fullName`     | string        | Yes                                    |
| `password`     | string        | Yes                                    |
| `role`         | string        | Yes (`ADMIN` or `USER`)                |
| `organizationId`| string (uuid) | Yes (if role is `USER`)                |
| `isActive`     | boolean       | Yes                                    |

*   **`DELETE /api/v1/users/:userId`**
    *   **Description:** Delete a user.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **URL Parameters:**

| Field    | Type          | Required |
|----------|---------------|----------|
| `userId` | string (uuid) | Yes      |

*   **`POST /api/v1/users/logout`**
    *   **Description:** Logs the current user out by invalidating the token.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **Request Body:** None.

### Service Routes

*   **`GET /api/v1/services`**
    *   **Description:** Get a list of services.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **Notes:** Supports pagination using `page` and `pageSize`.
    *   **Query Parameters:**

| Field              | Type    | Required |
|--------------------|---------|----------|
| `name`             | string  | No       |
| `prefix`           | string  | No       |
| `organizationName` | string  | No       |
| `isActive`         | boolean | No       |
| `page`             | number  | No       |
| `pageSize`         | number  | No       |

*   **`GET /api/v1/services/:serviceId`**
    *   **Description:** Get a single service by ID.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **URL Parameters:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `serviceId` | string (uuid) | Yes      |

*   **`POST /api/v1/services`**
    *   **Description:** Create a new service.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **Notes:** The `prefix` must be unique across all services.
    *   **Request Body:**

| Field          | Type          | Required |
|----------------|---------------|----------|
| `name`         | string        | Yes      |
| `prefix`       | string        | Yes      |
| `organizationId`| string (uuid) | Yes      |

*   **`PUT /api/v1/services/:serviceId`**
    *   **Description:** Update a service.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **URL Parameters:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `serviceId` | string (uuid) | Yes      |

    *   **Request Body:**

| Field          | Type          | Required |
|----------------|---------------|----------|
| `name`         | string        | Yes      |
| `prefix`       | string        | Yes      |
| `organizationId`| string (uuid) | Yes      |
| `isActive`     | boolean       | Yes      |

*   **`DELETE /api/v1/services/:serviceId`**
    *   **Description:** Delete a service.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **URL Parameters:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `serviceId` | string (uuid) | Yes      |

### Counter Routes

*   **`GET /api/v1/counters`**
    *   **Description:** Get a list of counters.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **Notes:** Supports pagination using `page` and `pageSize`.
    *   **Query Parameters:**

| Field              | Type    | Required |
|--------------------|---------|----------|
| `counterNumber`    | string  | No       |
| `serviceName`      | string  | No       |
| `organizationName` | string  | No       |
| `isActive`         | boolean | No       |
| `page`             | number  | No       |
| `pageSize`         | number  | No       |

*   **`GET /api/v1/counters/:counterId`**
    *   **Description:** Get a single counter by ID.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **URL Parameters:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `counterId` | string (uuid) | Yes      |

*   **`POST /api/v1/counters`**
    *   **Description:** Create a new counter.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **Notes:** `counterNumber` must be unique.
    *   **Request Body:**

| Field           | Type          | Required |
|-----------------|---------------|----------|
| `counterNumber` | string        | Yes      |
| `serviceId`     | string (uuid) | Yes      |

*   **`PUT /api/v1/counters/:counterId`**
    *   **Description:** Update a counter.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **URL Parameters:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `counterId` | string (uuid) | Yes      |

    *   **Request Body:**

| Field           | Type          | Required |
|-----------------|---------------|----------|
| `counterNumber` | string        | Yes      |
| `serviceId`     | string (uuid) | Yes      |
| `isActive`      | boolean       | Yes      |

*   **`DELETE /api/v1/counters/:counterId`**
    *   **Description:** Delete a counter.
    *   **Authorization:** Requires Authentication (`ADMIN` role).
    *   **URL Parameters:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `counterId` | string (uuid) | Yes      |

### Queue Routes

*   **`POST /api/v1/queues/call`**
    *   **Description:** Call the next waiting ticket for a given service and assign it to the specified counter.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **Request Body:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `serviceId` | string (uuid) | Yes      |
| `counterId` | string (uuid) | Yes      |

*   **`POST /api/v1/queues/action`**
    *   **Description:** Perform an action on a ticket.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **Notes:** The `retry` action re-calls a ticket. The `resolve` action marks a ticket as completed.
    *   **Request Body:**

| Field       | Type          | Required                |
|-------------|---------------|-------------------------|
| `action`    | string        | Yes (`retry` or `resolve`) |
| `queueId`   | string (uuid) | Yes                     |
| `counterId` | string (uuid) | No                      |

*   **`GET /api/v1/queues/:serviceId`**
    *   **Description:** Get the queue list for a specific service.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **URL Parameters:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `serviceId` | string (uuid) | Yes      |

    *   **Query Parameters:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `status`    | string        | No (`in-progress` or `completed`) |
| `counterId` | string (uuid) | No       |

*   **`GET /api/v1/queues/:serviceId/summary`**
    *   **Description:** Get a summary of queue counts for a service.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **URL Parameters:**

| Field       | Type          | Required |
|-------------|---------------|----------|
| `serviceId` | string (uuid) | Yes      |

    *   **Query Parameters:**

| Field    | Type   | Required |
|----------|--------|----------|
| `status` | string | No (`in-progress` or `completed`) |

*   **`PUT /api/v1/queues/:queueId/prioritize`**
    *   **Description:** Prioritize a ticket to be called next.
    *   **Authorization:** Requires Authentication (`ADMIN`, `USER` roles).
    *   **Notes:** This moves the specified ticket to the front of the line for its service.
    *   **URL Parameters:**

| Field     | Type          | Required |
|-----------|---------------|----------|
| `queueId` | string (uuid) | Yes      |