# API Documentation

This document provides a static overview of the API endpoints available in the Node.js Queue Management System. For interactive documentation, please refer to the [Swagger UI](http://localhost:8000/docs) when the server is running.

---

### Public Routes (`/public`)

These endpoints are accessible without authentication.

#### `POST /public/login`
*   **Summary:** Login user
*   **Tags:** #Authorization
*   **Request Body:**
    | Name       | Type     | Required | Description |
    | :--------- | :------- | :------- | :---------- |
    | `userName` | `string` | Yes      | User's username |
    | `password` | `string` | Yes      | User's password |
    ```json
    {
      "userName": "test",
      "password": "password123"
    }
    ```
*   **Responses:**
    *   `200 OK`:
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
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `POST /public/tickets`
*   **Summary:** Create ticket data
*   **Tags:** #Public
*   **Request Body:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `serviceId` | `string` | Yes      | UUID of the service for the ticket |
    ```json
    {
      "serviceId": "123123-1234-1234-1234-123456789012"
    }
    ```
*   **Responses:**
    *   `201 Created`:
        ```json
        {
          "success": true,
          "data": { "id": "uuid", "ticketNumber": "A001", "serviceId": "123123-1234-1234-1234-123456789012" },
          "message": "Created"
        }
        ```
    *   `400 Bad Request`
    *   `500 Internal Server Error`

#### `GET /public/services`
*   **Summary:** Get services list
*   **Tags:** #Public
*   **Query Parameters:** None
*   **Responses:**
    *   `200 OK`:
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
    *   `500 Internal Server Error`

#### `GET /public/organizations`
*   **Summary:** Get organizations with all services list
*   **Tags:** #Public
*   **Query Parameters:** None
*   **Responses:**
    *   `200 OK`:
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
    *   `500 Internal Server Error`

#### `GET /public/queues`
*   **Summary:** Get current calling queue
*   **Tags:** #Public
*   **Query Parameters:** None
*   **Responses:**
    *   `200 OK`:
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
    *   `500 Internal Server Error`

#### `GET /public/call-queue/{queueId}`
*   **Summary:** get queue calling sound
*   **Tags:** #Public
*   **Path Parameters:**
    | Name      | Type     | Required | Description |
    | :-------- | :------- | :------- | :---------- |
    | `queueId` | `string` | Yes      | UUID of the queue |
*   **Responses:**
    *   `200 OK`: Binary audio data
    *   `400 Bad Request`
    *   `404 Not Found`
    *   `500 Internal Server Error`

---

### Auth Routes (`/auth`)

These endpoints require authentication.

#### `POST /auth/logout`
*   **Summary:** Logout user by ID
*   **Tags:** #Authorization
*   **Security:** BearerAuth
*   **Responses:**
    *   `200 OK`:
        ```json
        {
          "success": true,
          "data": { "message": "logout success" }
        }
        ```
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `GET /auth/validate-token`
*   **Summary:** Validate the current user's token
*   **Tags:** #Authorization
*   **Security:** BearerAuth
*   **Responses:**
    *   `200 OK`:
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
    *   `401 Unauthorized`:
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
*   **Summary:** Get list of users
*   **Tags:** User
*   **Security:** BearerAuth
*   **Query Parameters:**
    | Name         | Type                       | Required | Description                 |
    | :----------- | :------------------------- | :------- | :---------- |
    | `userName`   | `string`                   | No       | Filter by userName          |
    | `fullName`   | `string`                   | No       | Filter by full name         |
    | `role`       | `string` ('ADMIN' or 'USER') | No       | Filter by role              |
    | `organization` | `string`                   | No       | Filter by organization      |
    | `isActive`   | `boolean`                  | No       | Filter by active status     |
    | `page`       | `number`                   | No       | Page number (default: 1)    |
    | `pageSize`   | `number`                   | No       | Items per page (default: 10)|
    | `sortBy`     | `string`                   | No       | Sort by field (`userName`, `fullName`, `role`, `createdAt`) |
    | `sortOrder`  | `string` ('asc' or 'desc') | No       | Sort order                  |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `GET /users/{userId}`
*   **Summary:** Get user by ID
*   **Tags:** User
*   **Security:** BearerAuth
*   **Path Parameters:**
    | Name     | Type     | Required | Description |
    | :------- | :------- | :------- | :---------- |
    | `userId` | `string` | Yes      | UUID of the user |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `POST /users`
*   **Summary:** Create user data
*   **Tags:** User
*   **Security:** BearerAuth
*   **Request Body:**
    | Name           | Type                       | Required | Description |
    | :------------- | :------------------------- | :------- | :---------- |
    | `userName`     | `string`                   | Yes      | User's username |
    | `fullName`     | `string`                   | Yes      | User's full name |
    | `password`     | `string`                   | Yes      | User's password |
    | `role`         | `string` ('ADMIN' or 'USER') | Yes      | User's role |
    | `organizationId` | `string`                   | No       | UUID of the organization (required for USER role) |
    *   For 'USER' role:
        ```json
        {
          "userName": "john.doe",
          "fullName": "John Doe",
          "password": "password123",
          "role": "USER",
          "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
        }
        ```
    *   For 'ADMIN' role:
        ```json
        {
          "userName": "admin.user",
          "fullName": "Admin User",
          "password": "password123",
          "role": "ADMIN"
        }
        ```
*   **Responses:**
    *   `201 Created`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `PUT /users/{userId}`
*   **Summary:** Update user by ID
*   **Tags:** User
*   **Security:** BearerAuth
*   **Path Parameters:**
    | Name     | Type     | Required | Description |
    | :------- | :------- | :------- | :---------- |
    | `userId` | `string` | Yes      | UUID of the user |
*   **Request Body:**
    | Name           | Type                       | Required | Description |
    | :------------- | :------------------------- | :------- | :---------- |
    | `userName`     | `string`                   | Yes      | User's username |
    | `fullName`     | `string`                   | Yes      | User's full name |
    | `password`     | `string`                   | Yes      | User's password |
    | `role`         | `string` ('ADMIN' or 'USER') | Yes      | User's role |
    | `organizationId` | `string`                   | No       | UUID of the organization (required for USER role) |
    | `isActive`     | `boolean`                  | Yes      | User's active status |
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
*   **Responses:**
    *   `200 OK`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `DELETE /users/{userId}`
*   **Summary:** Delete user by ID
*   **Tags:** User
*   **Security:** BearerAuth
*   **Path Parameters:**
    | Name     | Type     | Required | Description |
    | :------- | :------- | :------- | :---------- |
    | `userId` | `string` | Yes      | UUID of the user |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

---

### Counter Routes (`/counters`)

These endpoints require authentication. Some endpoints require `ADMIN` role.

#### `GET /counters`
*   **Summary:** Get list of counters
*   **Tags:** Counter
*   **Security:** BearerAuth
*   **Roles:** ADMIN, USER
*   **Query Parameters:**
    | Name           | Type     | Required | Description |
    | :------------- | :------- | :------- | :---------- |
    | `counterNumber`| `string` | No       | Filter by counter number |
    | `serviceName`  | `string` | No       | Filter by service name |
    | `organizationName`| `string` | No       | Filter by name organization |
    | `isActive`     | `boolean`| No       | Filter by active status |
    | `page`         | `number` | No       | Page number (default: 1) |
    | `pageSize`     | `number` | No       | Items per page (default: 10)|
    | `sortBy`       | `string` | No       | Sort by field (`counterNumber`, `createdAt`) |
    | `sortOrder`    | `string` | No       | Sort order (`asc` or `desc`) |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `GET /counters/{counterId}`
*   **Summary:** Get counter by ID
*   **Tags:** Counter
*   **Security:** BearerAuth
*   **Roles:** ADMIN, USER
*   **Path Parameters:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `counterId` | `string` | Yes      | UUID of the service |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `POST /counters`
*   **Summary:** Create counter data
*   **Tags:** Counter
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Request Body:**
    | Name          | Type     | Required | Description |
    | :------------ | :------- | :------- | :---------- |
    | `counterNumber`| `string` | Yes      | Counter number (max 3 chars) |
    | `serviceId`   | `string` | Yes      | UUID of the associated service |
    ```json
    {
      "counterNumber": "A01",
      "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    }
    ```
*   **Responses:**
    *   `201 Created`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `PUT /counters/{counterId}`
*   **Summary:** Update counter by ID
*   **Tags:** Counter
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Path Parameters:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `counterId` | `string` | Yes      | UUID of the service |
*   **Request Body:**
    | Name          | Type     | Required | Description |
    | :------------ | :------- | :------- | :---------- |
    | `counterNumber`| `string` | Yes      | Counter number (max 3 chars) |
    | `serviceId`   | `string` | Yes      | UUID of the associated service |
    | `isActive`    | `boolean`| Yes      | Counter's active status |
    ```json
    {
      "counterNumber": "A02",
      "serviceId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "isActive": true
    }
    ```
*   **Responses:**
    *   `200 OK`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `DELETE /counters/{counterId}`
*   **Summary:** Delete counter by ID
*   **Tags:** Counter
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Path Parameters:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `counterId` | `string` | Yes      | UUID of the service |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

---

### Organization Routes (`/organizations`)

These endpoints require authentication and `ADMIN` role.

#### `GET /organizations`
*   **Summary:** Get list of organizations
*   **Tags:** Organization
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Query Parameters:**
    | Name           | Type     | Required | Description |
    | :------------- | :------- | :------- | :---------- |
    | `name`         | `string` | No       | Filter by name or acronym |
    | `fullName`     | `string` | No       | Filter by full name organization |
    | `isActive`     | `boolean`| No       | Filter by active status |
    | `page`         | `number` | No       | Page number (default: 1) |
    | `pageSize`     | `number` | No       | Items per page (default: 10)|
    | `sortBy`       | `string` | No       | Sort by field (`name`, `fullName`, `createdAt`) |
    | `sortOrder`    | `string` | No       | Sort order (`asc` or `desc`) |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `GET /organizations/{organizationId}`
*   **Summary:** Get organization by ID
*   **Tags:** Organization
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Path Parameters:**
    | Name           | Type     | Required | Description |
    | :------------- | :------- | :------- | :---------- |
    | `organizationId` | `string` | Yes      | UUID of the organization |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `POST /organizations`
*   **Summary:** Create organization data
*   **Tags:** Organization
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Request Body:**
    | Name       | Type     | Required | Description |
    | :--------- | :------- | :------- | :---------- |
    | `name`     | `string` | Yes      | Organization's name |
    | `fullName` | `string` | No       | Organization's full name |
    ```json
    {
      "name": "Main Branch",
      "fullName": "Main Branch Office"
    }
    ```
*   **Responses:**
    *   `201 Created`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `PUT /organizations/{organizationId}`
*   **Summary:** Update organization by ID
*   **Tags:** Organization
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Path Parameters:**
    | Name           | Type     | Required | Description |
    | :------------- | :------- | :------- | :---------- |
    | `organizationId` | `string` | Yes      | UUID of the organization |
*   **Request Body:**
    | Name       | Type     | Required | Description |
    | :--------- | :------- | :------- | :---------- |
    | `name`     | `string` | Yes      | Organization's name |
    | `fullName` | `string` | No       | Organization's full name |
    | `isActive` | `boolean`| Yes      | Organization's active status |
    ```json
    {
      "name": "Main Branch Updated",
      "fullName": "Main Branch Office (Renovated)",
      "isActive": false
    }
    ```
*   **Responses:**
    *   `200 OK`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `DELETE /organizations/{organizationId}`
*   **Summary:** Delete organization by ID
*   **Tags:** Organization
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Path Parameters:**
    | Name           | Type     | Required | Description |
    | :------------- | :------- | :------- | :---------- |
    | `organizationId` | `string` | Yes      | UUID of the organization |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

---

### Queue Routes (`/queues`)

These endpoints require authentication. Some endpoints require `ADMIN` or `USER` role.

#### `POST /queues/call`
*   **Summary:** Call next queue by serviceId
*   **Tags:** Queue
*   **Security:** BearerAuth
*   **Roles:** ADMIN, USER
*   **Request Body:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `serviceId` | `string` | Yes      | UUID of the service |
    | `counterId` | `string` | Yes      | UUID of the counter |
    ```json
    {
      "serviceId": "123123-1234-1234-1234-123456789012",
      "counterId": "123123-1234-1234-1234-123456789012"
    }
    ```
*   **Responses:**
    *   `200 OK`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `POST /queues/action`
*   **Summary:** Recall or resolve queue by queueId
*   **Tags:** Queue
*   **Security:** BearerAuth
*   **Roles:** ADMIN, USER
*   **Request Body:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `action`    | `string` | Yes      | Action to perform ('retry' or 'resolve') |
    | `queueId`   | `string` | Yes      | UUID of the queue |
    | `counterId` | `string` | No       | UUID of the counter (optional for some actions) |
    ```json
    {
      "action": "retry",
      "queueId": "123123-1234-1234-1234-123456789012",
      "counterId": "123123-1234-1234-1234-123456789012"
    }
    ```
*   **Responses:**
    *   `200 OK`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `GET /queues/{serviceId}`
*   **Summary:** Get queue list by serviceId
*   **Tags:** Queue
*   **Security:** BearerAuth
*   **Roles:** ADMIN, USER
*   **Path Parameters:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `serviceId` | `string` | Yes      | UUID of the service |
*   **Query Parameters:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `status`    | `string` | No       | Filter by status ('in-progress' or 'completed') |
    | `counterId` | `string` | No       | Filter by counter ID |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `GET /queues/{serviceId}/summary`
*   **Summary:** Get total queue by serviceId
*   **Tags:** Queue
*   **Security:** BearerAuth
*   **Roles:** ADMIN, USER
*   **Path Parameters:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `serviceId` | `string` | Yes      | UUID of the service |
*   **Query Parameters:**
    | Name     | Type     | Required | Description |
    | :------- | :------- | :------- | :---------- |
    | `status` | `string` | No       | Filter by status ('in-progress' or 'completed') |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `PUT /queues/{queueId}/prioritize`
*   **Summary:** Prioritize a ticket
*   **Tags:** Queue
*   **Security:** BearerAuth
*   **Roles:** ADMIN, USER
*   **Path Parameters:**
    | Name      | Type     | Required | Description |
    | :-------- | :------- | :------- | :---------- |
    | `queueId` | `string` | Yes      | The ID of the ticket to prioritize |
*   **Responses:**
    *   `200 OK`

---

### Service Routes (`/services`)

These endpoints require authentication. Some endpoints require `ADMIN` or `USER` role.

#### `GET /services`
*   **Summary:** Get list of services
*   **Tags:** Service
*   **Security:** BearerAuth
*   **Roles:** ADMIN, USER
*   **Query Parameters:**
    | Name           | Type     | Required | Description |
    | :------------- | :------- | :------- | :---------- |
    | `name`         | `string` | No       | Filter by service name |
    | `prefix`       | `string` | No       | Filter by service prefix |
    | `organizationName`| `string` | No       | Filter by name organization |
    | `isActive`     | `boolean`| No       | Filter by active status |
    | `page`         | `number` | No       | Page number (default: 1) |
    | `pageSize`     | `number` | No       | Items per page (default: 10)|
    | `sortBy`       | `string` | No       | Sort by field (`name`, `prefix`, `createdAt`) |
    | `sortOrder`    | `string` | No       | Sort order (`asc` or `desc`) |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `GET /services/{serviceId}`
*   **Summary:** Get services by ID
*   **Tags:** Service
*   **Security:** BearerAuth
*   **Roles:** ADMIN, USER
*   **Path Parameters:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `serviceId` | `string` | Yes      | UUID of the service |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `POST /services`
*   **Summary:** Create service data
*   **Tags:** Service
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Request Body:**
    | Name           | Type     | Required | Description |
    | :------------- | :------- | :------- | :---------- |
    | `name`         | `string` | Yes      | Service name |
    | `prefix`       | `string` | Yes      | Service prefix (max 2 chars) |
    | `organizationId` | `string` | Yes      | UUID of the associated organization |
    ```json
    {
      "name": "General Inquiries",
      "prefix": "A",
      "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef"
    }
    ```
*   **Responses:**
    *   `201 Created`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `500 Internal Server Error`

#### `PUT /services/{serviceId}`
*   **Summary:** Update services by ID
*   **Tags:** Service
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Path Parameters:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `serviceId` | `string` | Yes      | UUID of the service |
*   **Request Body:**
    | Name           | Type     | Required | Description |
    | :------------- | :------- | :------- | :---------- |
    | `name`         | `string` | Yes      | Service name |
    | `prefix`       | `string` | Yes      | Service prefix (max 2 chars) |
    | `organizationId` | `string` | Yes      | UUID of the associated organization |
    | `isActive`     | `boolean`| Yes      | Service's active status |
    ```json
    {
      "name": "Specialized Support",
      "prefix": "S",
      "organizationId": "a1b2c3d4-e5f6-7890-1234-567890abcdef",
      "isActive": true
    }
    ```
*   **Responses:**
    *   `200 OK`
    *   `400 Bad Request`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`

#### `DELETE /services/{serviceId}`
*   **Summary:** Delete services by ID
*   **Tags:** Service
*   **Security:** BearerAuth
*   **Roles:** ADMIN
*   **Path Parameters:**
    | Name        | Type     | Required | Description |
    | :---------- | :------- | :------- | :---------- |
    | `serviceId` | `string` | Yes      | UUID of the service |
*   **Responses:**
    *   `200 OK`
    *   `401 Unauthorized`
    *   `404 Not Found`
    *   `500 Internal Server Error`