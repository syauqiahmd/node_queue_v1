# API Documentation

This document provides a static overview of the API endpoints available in the Node.js Queue Management System. For interactive documentation, please refer to the [Swagger UI](http://localhost:8000/docs) when the server is running.

---

### Public Routes (`/public`)

These endpoints are accessible without authentication.

#### `POST /public/login`

- **Summary:** Login user
- **Tags:** #Authorization
- **Request Body:**
  | Name | Type | Required | Description |
  | :--------- | :------- | :------- | :---------- |
  | `userName` | `string` | Yes | User's username |
  | `password` | `string` | Yes | User's password |
  ```json
  {
    "userName": "test",
    "password": "password123"
  }
  ```
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "userDetail": {
          "id": "uuid",
          "userName": "test",
          "fullName": "Test User",
          "role": "user",
          "isActive": true,
          "organization": {
            "organizationId": "uuid",
            "name": "Test Org",
            "fullName": "Test Organization"
          }
        },
        "token": "jwt_token_string"
      }
    }
    ```
  - `401 Unauthorized`
  - `500 Internal Server Error`

#### `POST /public/tickets`

- **Summary:** Create ticket data
- **Tags:** #Public
- **Request Body:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `serviceId` | `string` | Yes | UUID of the service for the ticket |
  ```json
  {
    "serviceId": "123123-1234-1234-1234-123456789012"
  }
  ```
- **Responses:**
  - `201 Created`:
    ```json
    {
      "success": true,
      "data": {
        "id": "6f3d2b3a-1c2d-4e5f-8a9b-0123456789ab",
        "queueNumber": "A-001",
        "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "serviceName": "General Service",
        "organizationId": "0f1e2d3c-4b5a-6978-9012-3456789abcde",
        "organizationName": "Main Branch",
        "organizationFullName": "Main Branch Office",
        "createdAt": "2025-11-25T09:00:00.000Z",
        "totalWaitingQueue": 7
      },
      "message": "Created"
    }
    ```
  - `400 Bad Request`
  - `500 Internal Server Error`

#### `GET /public/services`

- **Summary:** Get services list
- **Tags:** #Public
- **Query Parameters:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": {
        "totalRecord": 1,
        "data": [
          {
            "id": "uuid",
            "name": "Service 1",
            "prefix": "S1",
            "organization": {
              "id": "uuid",
              "name": "Org 1",
              "fullName": "Organization 1"
            }
          }
        ]
      }
    }
    ```
  - `500 Internal Server Error`

#### `GET /public/organizations`

- **Summary:** Get organizations with all services list
- **Tags:** #Public
- **Query Parameters:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "name": "Org 1",
          "fullName": "Organization 1",
          "services": [
            {
              "id": "uuid",
              "name": "Service 1",
              "prefix": "S1"
            }
          ]
        }
      ]
    }
    ```
  - `500 Internal Server Error`

#### `GET /public/queues`

- **Summary:** Get current calling queue
- **Tags:** #Public
- **Query Parameters:** None
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": [
        {
          "id": "uuid",
          "ticketNumber": "A001",
          "counterNumber": "C01",
          "serviceName": "Service 1",
          "organizationName": "Org 1"
        }
      ]
    }
    ```
  - `500 Internal Server Error`

#### `GET /public/call-queue/{queueId}`

- **Summary:** (Not available in current code)

* **Tags:** #Public
* **Path Parameters:**
  | Name | Type | Required | Description |
  | :-------- | :------- | :------- | :---------- |
  | `queueId` | `string` | Yes | UUID of the queue |
* **Responses:**
  - `200 OK`: Binary audio data
  - `400 Bad Request`
  - `404 Not Found`
  - `500 Internal Server Error`

---

### Private Routes (`/private`)

These endpoints are for service-to-service calls only — no user JWT is involved. Every request must include an `X-Service-Key` header matching one of the values configured in the `SERVICE_API_KEYS` env var (format: `serviceName:key,...`). Generate a new key with `npm run generate:service-key -- <serviceName>`. Regular browser/user traffic must never call these routes or hold these keys.

#### `GET /private/ping`

- **Summary:** Verify service-to-service authentication
- **Tags:** #Private
- **Security:** `X-Service-Key` header
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "pong",
      "data": { "service": "exampleService" }
    }
    ```
  - `401 Unauthorized`: missing or invalid `X-Service-Key`

---

### Auth Routes (`/auth`)

These endpoints require authentication.

#### `POST /auth/logout`

- **Summary:** Logout user by ID
- **Tags:** #Authorization
- **Security:** BearerAuth
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "data": { "message": "logout success" }
    }
    ```
  - `401 Unauthorized`
  - `500 Internal Server Error`

#### `GET /auth/validate-token`

- **Summary:** Validate the current user's token
- **Tags:** #Authorization
- **Security:** BearerAuth
- **Responses:**
  - `200 OK`:
    ```json
    {
      "success": true,
      "message": "Token is valid",
      "data": {
        "id": "uuid",
        "userName": "test",
        "fullName": "Test User",
        "role": "ADMIN",
        "isActive": true,
        "organization": {
          "organizationId": "uuid",
          "name": "Test Org",
          "fullName": "Test Organization"
        },
        "expiresAt": "2025-10-26T12:00:00.000Z"
      }
    }
    ```
  - `401 Unauthorized`:
    ```json
    {
      "success": false,
      "error": {
        "code": "UNAUTHORIZED",
        "message": "Invalid or expired token"
      }
    }
    ```

---

### User Routes (`/users`)

These endpoints require authentication and `ADMIN` role.

#### `GET /users`

- **Summary:** Get list of users
- **Tags:** User
- **Security:** BearerAuth
- **Query Parameters:**
  | Name | Type | Required | Description |
  | :--------- | :------- | :------- | :---------- |
  | `userName` | `string` | No | Filter by userName |
  | `fullName` | `string` | No | Filter by full name |
  | `isActive` | `boolean` | No | Filter by active status |
  | `page` | `number` | No | Page number (default: 1) |
  | `pageSize` | `number` | No | Items per page (default: 10) |
  | `sortBy` | `string` | No | Sort by field (`userName`, `fullName`, `createdAt`) |
  | `sortOrder` | `string` | No | Sort order (`asc` or `desc`) |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "totalRecord": 2,
      "data": [
        {
          "id": "user-1-id",
          "userName": "john.doe",
          "fullName": "John Doe",
          "role": "USER",
          "isActive": true,
          "createdAt": "2025-11-25T08:00:00.000Z"
        }
      ]
    }
  }
  ```

#### `GET /users/{userId}`

- **Summary:** Get user by ID
- **Tags:** User
- **Security:** BearerAuth
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :------- | :------- | :------- | :---------- |
  | `userId` | `string` | Yes | UUID of the user |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "user-1-id",
      "userName": "john.doe",
      "fullName": "John Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-11-25T08:00:00.000Z"
    }
  }
  ```

#### `POST /users`

- **Summary:** Create user data
- **Tags:** User
- **Security:** BearerAuth
- **Request Body:**
  | Name | Type | Required | Description |
  | :------------- | :------------------------- | :------- | :---------- |
  | `userName` | `string` | Yes | User's username |
  | `fullName` | `string` | Yes | User's full name |
  | `password` | `string` | Yes | User's password |
  | `role` | `string` ('ADMIN' or 'USER') | Yes | User's role |
  | `organizationId` | `string` | No | UUID of the organization (required for USER role) |
  - For 'USER' role:
    ```json
    {
      "userName": "john.doe",
      "fullName": "John Doe",
      "password": "password123",
      "role": "USER",
      "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    }
    ```
  - For 'ADMIN' role:
    ```json
    {
      "userName": "admin.user",
      "fullName": "Admin User",
      "password": "password123",
      "role": "ADMIN"
    }
    ```
- **Responses:**

  - `201 Created`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "user-1-id",
      "userName": "john.doe",
      "fullName": "John Doe",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-11-25T08:00:00.000Z"
    },
    "message": "Created"
  }
  ```

#### `PUT /users/{userId}`

- **Summary:** Update user by ID
- **Tags:** User
- **Security:** BearerAuth
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :------- | :------- | :------- | :---------- |
  | `userId` | `string` | Yes | UUID of the user |
- **Request Body:**
  | Name | Type | Required | Description |
  | :------------- | :------------------------- | :------- | :---------- |
  | `userName` | `string` | Yes | User's username |
  | `fullName` | `string` | Yes | User's full name |
  | `password` | `string` | Yes | User's password |
  | `role` | `string` ('ADMIN' or 'USER') | Yes | User's role |
  | `organizationId` | `string` | No | UUID of the organization (required for USER role) |
  | `isActive` | `boolean` | Yes | User's active status |
  ```json
  {
    "userName": "john.doe.updated",
    "fullName": "John Doe Updated",
    "password": "newPassword123",
    "role": "USER",
    "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "isActive": true
  }
  ```
- **Responses:**

  - `200 OK`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "user-1-id",
      "userName": "john.doe.updated",
      "fullName": "John Doe Updated",
      "role": "USER",
      "isActive": true,
      "updatedAt": "2025-11-25T08:10:00.000Z"
    },
    "message": "Updated"
  }
  ```

#### `DELETE /users/{userId}`

- **Summary:** Delete user by ID
- **Tags:** User
- **Security:** BearerAuth
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :------- | :------- | :------- | :---------- |
  | `userId` | `string` | Yes | UUID of the user |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "user-1-id",
      "userName": "john.doe"
    },
    "message": "Deleted"
  }
  ```

---

### Counter Routes (`/counters`)

These endpoints require authentication. Some endpoints require `ADMIN` role.

#### `GET /counters`

- **Summary:** Get list of counters
- **Tags:** Counter
- **Security:** BearerAuth
- **Roles:** ADMIN, USER
- **Query Parameters:**
  | Name | Type | Required | Description |
  | :------------- | :------- | :------- | :---------- |
  | `counterNumber`| `string` | No | Filter by counter number |
  | `serviceId` | `string` | No | Filter by associated service (UUID) |
  | `isActive` | `boolean`| No | Filter by active status |
  | `page` | `number` | No | Page number (default: 1) |
  | `pageSize` | `number` | No | Items per page (default: 10)|
  | `sortBy` | `string` | No | Sort by field (`counterNumber`, `createdAt`) |
  | `sortOrder` | `string` | No | Sort order (`asc` or `desc`) |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "totalRecord": 2,
      "data": [
        {
          "id": "c0ffee12-3456-7890-abcd-ef0123456789",
          "counterNumber": "A01",
          "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "isActive": true,
          "createdAt": "2025-11-25T08:00:00.000Z"
        }
      ]
    }
  }
  ```

#### `GET /counters/{counterId}`

- **Summary:** Get counter by ID
- **Tags:** Counter
- **Security:** BearerAuth
- **Roles:** ADMIN, USER
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `counterId` | `string` | Yes | UUID of the service |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "c0ffee12-3456-7890-abcd-ef0123456789",
      "counterNumber": "A01",
      "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "isActive": true,
      "service": {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "General Service",
        "organization": {
          "id": "0f1e2d3c-4b5a-6978-9012-3456789abcde",
          "name": "Main Branch",
          "fullName": "Main Branch Office",
          "logoUrl": null
        }
      }
    }
  }
  ```

#### `POST /counters`

- **Summary:** Create counter data
- **Tags:** Counter
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Request Body:**
  | Name | Type | Required | Description |
  | :------------ | :------- | :------- | :---------- |
  | `counterNumber`| `string` | Yes | Counter number (max 3 chars) |
  | `serviceId` | `string` | Yes | UUID of the associated service |
  ```json
  {
    "counterNumber": "A01",
    "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
  ```
- **Responses:**

  - `201 Created`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "c0ffee12-3456-7890-abcd-ef0123456789",
      "counterNumber": "A01",
      "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "isActive": true,
      "createdAt": "2025-11-25T08:00:00.000Z"
    },
    "message": "Created"
  }
  ```

#### `PUT /counters/{counterId}`

- **Summary:** Update counter by ID
- **Tags:** Counter
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `counterId` | `string` | Yes | UUID of the service |
- **Request Body:**
  | Name | Type | Required | Description |
  | :------------ | :------- | :------- | :---------- |
  | `counterNumber`| `string` | Yes | Counter number (max 3 chars) |
  | `serviceId` | `string` | Yes | UUID of the associated service |
  | `isActive` | `boolean`| Yes | Counter's active status |
  ```json
  {
    "counterNumber": "A02",
    "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "isActive": true
  }
  ```
- **Responses:**

  - `200 OK`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "c0ffee12-3456-7890-abcd-ef0123456789",
      "counterNumber": "A02",
      "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "isActive": true,
      "updatedAt": "2025-11-25T08:05:00.000Z"
    },
    "message": "Updated"
  }
  ```

#### `DELETE /counters/{counterId}`

- **Summary:** Delete counter by ID
- **Tags:** Counter
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `counterId` | `string` | Yes | UUID of the service |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "c0ffee12-3456-7890-abcd-ef0123456789",
      "counterNumber": "A01"
    },
    "message": "Deleted"
  }
  ```

---

### Organization Routes (`/organizations`)

These endpoints require authentication and `ADMIN` role.

#### `GET /organizations`

- **Summary:** Get list of organizations
- **Tags:** Organization
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Query Parameters:**
  | Name | Type | Required | Description |
  | :------------- | :------- | :------- | :---------- |
  | `name` | `string` | No | Filter by name or acronym |
  | `fullName` | `string` | No | Filter by full name organization |
  | `isActive` | `boolean`| No | Filter by active status |
  | `page` | `number` | No | Page number (default: 1) |
  | `pageSize` | `number` | No | Items per page (default: 10)|
  | `sortBy` | `string` | No | Sort by field (`name`, `fullName`, `createdAt`) |
  | `sortOrder` | `string` | No | Sort order (`asc` or `desc`) |
- **Responses:**
  - `200 OK`
  - `401 Unauthorized`
  - `500 Internal Server Error`

#### `GET /organizations/{organizationId}`

- **Summary:** Get organization by ID
- **Tags:** Organization
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :------------- | :------- | :------- | :---------- |
  | `organizationId` | `string` | Yes | UUID of the organization |
- **Responses:**
  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

#### `POST /organizations`

- **Summary:** Create organization data
- **Tags:** Organization
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Request Body:**
  | Name | Type | Required | Description |
  | :--------- | :------- | :------- | :---------- |
  | `name` | `string` | Yes | Organization's name |
  | `fullName` | `string` | No | Organization's full name |
  ```json
  {
    "name": "Main Branch",
    "fullName": "Main Branch Office"
  }
  ```
- **Responses:**
  - `201 Created`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

#### `PUT /organizations/{organizationId}`

- **Summary:** Update organization by ID
- **Tags:** Organization
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :------------- | :------- | :------- | :---------- |
  | `organizationId` | `string` | Yes | UUID of the organization |
- **Request Body:**
  | Name | Type | Required | Description |
  | :--------- | :------- | :------- | :---------- |
  | `name` | `string` | Yes | Organization's name |
  | `fullName` | `string` | No | Organization's full name |
  | `isActive` | `boolean`| Yes | Organization's active status |
  ```json
  {
    "name": "Main Branch Updated",
    "fullName": "Main Branch Office (Renovated)",
    "isActive": false
  }
  ```
- **Responses:**
  - `200 OK`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

#### `DELETE /organizations/{organizationId}`

- **Summary:** Delete organization by ID
- **Tags:** Organization
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :------------- | :------- | :------- | :---------- |
  | `organizationId` | `string` | Yes | UUID of the organization |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "0f1e2d3c-4b5a-6978-9012-3456789abcde",
      "name": "Main Branch"
    },
    "message": "Deleted"
  }
  ```

---

### Queue Routes (`/queues`)

These endpoints require authentication. Some endpoints require `ADMIN` or `USER` role.

#### `POST /queues/call`

- **Summary:** Call next queue by serviceId
- **Tags:** Queue
- **Security:** BearerAuth
- **Roles:** ADMIN, USER
- **Request Body:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `serviceId` | `string` | Yes | UUID of the service |
  | `counterId` | `string` | Yes | UUID of the counter |
  ```json
  {
    "serviceId": "123123-1234-1234-1234-123456789012",
    "counterId": "123123-1234-1234-1234-123456789012"
  }
  ```
- **Responses:**

  - `200 OK`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "6f3d2b3a-1c2d-4e5f-8a9b-0123456789ab",
      "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "prefix": "A",
      "queueNumber": 1,
      "isCall": true,
      "isResolved": false,
      "soundUrl": "https://s3.example.com/sound-generated/2025-11-25/6f3d2b3a-1c2d.mp3",
      "latestAssigneeCounterId": "c0ffee12-3456-7890-abcd-ef0123456789",
      "latestAssigneeCounter": {
        "id": "c0ffee12-3456-7890-abcd-ef0123456789",
        "counterNumber": "A01"
      },
      "service": {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "General Service",
        "organization": {
          "id": "0f1e2d3c-4b5a-6978-9012-3456789abcde",
          "name": "Main Branch",
          "fullName": "Main Branch Office"
        }
      },
      "updatedAt": "2025-11-25T09:00:15.000Z",
      "createdAt": "2025-11-25T08:59:00.000Z"
    }
  }
  ```

#### `POST /queues/action`

- **Summary:** Recall or resolve queue by queueId
- **Tags:** Queue
- **Security:** BearerAuth
- **Roles:** ADMIN, USER
- **Request Body:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `action` | `string` | Yes | Action to perform ('retry' or 'resolve') |
  | `queueId` | `string` | Yes | UUID of the queue |
  | `counterId` | `string` | No | UUID of the counter (optional for some actions) |
  ```json
  {
    "action": "retry",
    "queueId": "123123-1234-1234-1234-123456789012",
    "counterId": "123123-1234-1234-1234-123456789012"
  }
  ```
- **Responses:**

  - `200 OK`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

  **Example success response (retry/recall)**

  ```json
  {
    "success": true,
    "data": {
      "id": "6f3d2b3a-1c2d-4e5f-8a9b-0123456789ab",
      "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "prefix": "A",
      "queueNumber": 1,
      "latestAssigneeCounterId": "c0ffee12-3456-7890-abcd-ef0123456789",
      "soundUrl": "https://s3.example.com/sound-generated/2025-11-25/6f3d2b3a-1c2d.mp3",
      "latestAssigneeCounter": {
        "id": "c0ffee12-3456-7890-abcd-ef0123456789",
        "counterNumber": "A01"
      },
      "service": {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "General Service",
        "organization": {
          "id": "0f1e2d3c-4b5a-6978-9012-3456789abcde",
          "name": "Main Branch",
          "fullName": "Main Branch Office"
        }
      }
    }
  }
  ```

  **Example success response (resolve)**

  ```json
  {
    "success": true,
    "data": {
      "id": "6f3d2b3a-1c2d-4e5f-8a9b-0123456789ab",
      "isResolved": true,
      "service": {
        "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "name": "General Service",
        "organization": {
          "id": "0f1e2d3c-4b5a-6978-9012-3456789abcde",
          "name": "Main Branch",
          "fullName": "Main Branch Office"
        }
      }
    },
    "message": "Ticket resolved"
  }
  ```

#### `GET /queues/{serviceId}`

- **Summary:** Get queue list by serviceId
- **Tags:** Queue
- **Security:** BearerAuth
- **Roles:** ADMIN, USER
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `serviceId` | `string` | Yes | UUID of the service |
- **Query Parameters:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `status` | `string` | No | Filter by status ('in-progress' or 'completed') |
  | `counterId` | `string` | No | Filter by counter ID |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": [
      {
        "id": "6f3d2b3a-1c2d-4e5f-8a9b-0123456789ab",
        "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
        "prefix": "A",
        "queueNumber": 1,
        "isCall": false,
        "isResolved": false,
        "isPriority": false,
        "latestAssigneeCounterId": null,
        "createdAt": "2025-11-25T08:30:00.000Z",
        "updatedAt": "2025-11-25T08:30:00.000Z"
      }
    ]
  }
  ```

#### `GET /queues/{serviceId}/summary`

- **Summary:** Get total queue by serviceId
- **Tags:** Queue
- **Security:** BearerAuth
- **Roles:** ADMIN, USER
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `serviceId` | `string` | Yes | UUID of the service |
- **Query Parameters:**
  | Name | Type | Required | Description |
  | :------- | :------- | :------- | :---------- |
  | `status` | `string` | No | Filter by status ('in-progress' or 'completed') |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": { "totalRecords": 12 }
  }
  ```

#### `PUT /queues/{queueId}/prioritize`

- **Summary:** Prioritize a ticket
- **Tags:** Queue
- **Security:** BearerAuth
- **Roles:** ADMIN, USER
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :-------- | :------- | :------- | :---------- |
  | `queueId` | `string` | Yes | The ID of the ticket to prioritize |
- **Responses:**
  - `200 OK`

---

### Service Routes (`/services`)

These endpoints require authentication. Some endpoints require `ADMIN` or `USER` role.

#### `GET /services`

- **Summary:** Get list of services
- **Tags:** Service
- **Security:** BearerAuth
- **Roles:** ADMIN, USER
- **Query Parameters:**
  | Name | Type | Required | Description |
  | :------------- | :------- | :------- | :---------- |
  | `name` | `string` | No | Filter by service name |
  | `prefix` | `string` | No | Filter by service prefix |
  | `organizationId`| `string` | No | Filter by organization (UUID) |
  | `isActive` | `boolean`| No | Filter by active status |
  | `page` | `number` | No | Page number (default: 1) |
  | `pageSize` | `number` | No | Items per page (default: 10)|
  | `sortBy` | `string` | No | Sort by field (`name`, `prefix`, `createdAt`) |
  | `sortOrder` | `string` | No | Sort order (`asc` or `desc`) |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "totalRecord": 1,
      "data": [
        {
          "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
          "name": "General Service",
          "prefix": "A",
          "organization": {
            "id": "0f1e2d3c-4b5a-6978-9012-3456789abcde",
            "name": "Main Branch",
            "fullName": "Main Branch Office"
          }
        }
      ]
    }
  }
  ```

#### `GET /services/{serviceId}`

- **Summary:** Get services by ID
- **Tags:** Service
- **Security:** BearerAuth
- **Roles:** ADMIN, USER
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `serviceId` | `string` | Yes | UUID of the service |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "General Service",
      "prefix": "A",
      "organization": {
        "id": "0f1e2d3c-4b5a-6978-9012-3456789abcde",
        "name": "Main Branch",
        "fullName": "Main Branch Office",
        "logoUrl": null
      }
    }
  }
  ```

#### `POST /services`

- **Summary:** Create service data
- **Tags:** Service
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Request Body:**
  | Name | Type | Required | Description |
  | :------------- | :------- | :------- | :---------- |
  | `name` | `string` | Yes | Service name |
  | `prefix` | `string` | Yes | Service prefix (max 2 chars) |
  | `organizationId` | `string` | Yes | UUID of the associated organization |
  ```json
  {
    "name": "General Inquiries",
    "prefix": "A",
    "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
  }
  ```
- **Responses:**

  - `201 Created`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "General Inquiries",
      "prefix": "A",
      "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "isActive": true,
      "createdAt": "2025-11-25T08:00:00.000Z"
    },
    "message": "Created"
  }
  ```

#### `PUT /services/{serviceId}`

- **Summary:** Update services by ID
- **Tags:** Service
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `serviceId` | `string` | Yes | UUID of the service |
- **Request Body:**
  | Name | Type | Required | Description |
  | :------------- | :------- | :------- | :---------- |
  | `name` | `string` | Yes | Service name |
  | `prefix` | `string` | Yes | Service prefix (max 2 chars) |
  | `organizationId` | `string` | Yes | UUID of the associated organization |
  | `isActive` | `boolean`| Yes | Service's active status |
  ```json
  {
    "name": "Specialized Support",
    "prefix": "S",
    "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
    "isActive": true
  }
  ```
- **Responses:**

  - `200 OK`
  - `400 Bad Request`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "Specialized Support",
      "prefix": "S",
      "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "isActive": true,
      "updatedAt": "2025-11-25T08:05:00.000Z"
    },
    "message": "Updated"
  }
  ```

#### `DELETE /services/{serviceId}`

- **Summary:** Delete services by ID
- **Tags:** Service
- **Security:** BearerAuth
- **Roles:** ADMIN
- **Path Parameters:**
  | Name | Type | Required | Description |
  | :---------- | :------- | :------- | :---------- |
  | `serviceId` | `string` | Yes | UUID of the service |
- **Responses:**

  - `200 OK`
  - `401 Unauthorized`
  - `404 Not Found`
  - `500 Internal Server Error`

  **Example success response**

  ```json
  {
    "success": true,
    "data": {
      "id": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "name": "General Inquiries"
    },
    "message": "Deleted"
  }
  ```
