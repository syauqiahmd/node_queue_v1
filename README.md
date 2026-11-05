# Node.js Queue Management System

This is a robust and scalable queue management system built with Node.js, Express, and Prisma. It leverages a modular architecture with dependency injection and a proxy pattern for caching, making it easy to maintain and extend.

## Features

*   **Core Queue Management**:
    *   Create, call, recall, and resolve tickets.
    *   Public-facing endpoints for customers to create tickets for a specific service.
    *   Real-time queue list for display monitors.
*   **Multi-tenancy Support**:
    *   **Organization Management**: Full CRUD operations for managing multiple organizations.
    *   **Service Management**: Manage distinct services (e.g., "Customer Support", "New Accounts") within each organization.
    *   **Counter Management**: Assign counters to specific services.
*   **Authentication & Authorization**:
    *   JWT-based authentication for secure API access.
    *   Role-based access control (`ADMIN`, `USER`) to protect administrative endpoints.
*   **Real-time Experience**:
    *   **Live Updates**: Uses **Socket.IO** to broadcast events (`new-ticket`, `call-ticket`, etc.) to all clients for a seamless, real-time UI.
    *   **Audio Announcements**: Integrates with **Google Cloud Text-to-Speech** to generate and play audio for called tickets.
*   **Performance & Scalability**:
    *   **Caching Layer**: Implements a Proxy Pattern with **Redis** to cache frequently accessed data, reducing database load.
    *   **Background Jobs**: Uses **node-cron** to run scheduled jobs for daily report calculation and data housekeeping, preventing performance impact on the main application.
*   **Developer Experience**:
    *   **Dependency Injection**: Leverages **Awilix** for a clean, decoupled, and testable architecture.
    *   **API Documentation**: Auto-generated and interactive API documentation with **Swagger**.
    *   **Comprehensive Logging**: Uses **Winston** for detailed and structured logging.
    *   **Code Quality**: Enforced with **ESLint** and **Prettier**.

## Technologies

### Backend & Framework
*   **Node.js**: JavaScript runtime environment (v22.15.1)
*   **Express**: Web framework for creating the REST API.

### Database & ORM
*   **PostgreSQL**: Primary relational database.
*   **Prisma**: Next-generation ORM for database access and migrations.
*   **Redis**: In-memory data store used for caching.

### Real-time & Communication
*   **Socket.IO**: Enables real-time, bidirectional communication for live queue updates.
*   **Google Cloud Text-to-Speech**: For generating audio announcements.

### Authentication & Security
*   **JSON Web Token (JWT)**: For creating secure access tokens.
*   **bcrypt**: For hashing user passwords.
*   **express-rate-limit**: To protect the API from brute-force attacks.

### Tooling & Architecture
*   **Awilix**: A powerful dependency injection container for managing services and dependencies.
*   **node-cron**: A simple cron-like job scheduler for background tasks.
*   **Winston**: A versatile logging library for Node.js.
*   **Jest**: A delightful JavaScript testing framework.
*   **ESLint & Prettier**: For maintaining code quality and consistent formatting.
*   **express-jsdoc-swagger**: For generating interactive API documentation.

## Getting Started

### Prerequisites

*   Node.js (v22.15.1, as specified in `.nvmrc`)
*   `npm`
*   PostgreSQL
*   Redis
*   Google Cloud credentials (for Text-to-Speech)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/node_queue.git
    cd node_queue
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Set up Environment Variables:**
    Create a `.env` file in the root of the project by copying the example file.
    ```bash
    cp .env.example .env
    ```
    Then, update the variables in the `.env` file with your local configuration. See the "Environment Variables" section below for details.


4.  **Run Database Migrations:**
    Ensure your PostgreSQL server is running and the `DATABASE_URL` in your `.env` file is correct. Then, apply the Prisma migrations:
    ```bash
    npx prisma migrate dev
    ```
    This command will also generate the Prisma Client based on your schema.

## Usage

This project runs as two separate services: the main API server and a background cron job runner.

### Running in Development

For development, you can run both services concurrently with Nodemon for automatic restarts on file changes.

```bash
npm run dev
```

You can also run each service individually:
```bash
# Run the API server only
npm run dev:api

# Run the cron service only
npm run dev:cron
```

### Running in Production

In production, you should run the services directly with Node.

```bash
# Start the API server
npm run start:api

# Start the cron service
npm run start:cron
```

### Running Tests

Execute the test suite using Jest:
```bash
npm test
```

### Linting

This project uses ESLint to enforce code quality.

```bash
# Check for linting errors
npm run lint

# Automatically fix linting errors
npm run lint-fix
```

## Environment Variables

The following environment variables are used to configure the application. These should be defined in a `.env` file in the project root.

| Variable | Description | Default in `.env.example` |
| :--- | :--- | :--- |
| `PORT` | The port for the API server to listen on. | `3000` |
| `DATABASE_URL` | The connection string for the PostgreSQL database. | |
| `JWT_SECRET` | The secret key used to sign JSON Web Tokens. | |
| `JWT_EXPIRES_IN` | The expiration time for JWTs (e.g., `1h`, `7d`). | |
| `BCRYPT_SALT_ROUNDS` | The number of salt rounds for bcrypt password hashing. | |
| `REDIS_HOST` | The hostname for the Redis server. | |
| `REDIS_PORT` | The port for the Redis server. | |
| `REDIS_PASSWORD` | The password for the Redis server. | |
| `RATE_LIMIT_WINDOW` | The time window for rate limiting in minutes. | `1` |
| `RATE_LIMIT_MAX` | The maximum number of requests allowed per IP within the time window. | |
| `GOOGLE_APPLICATION_CREDENTIALS` | The absolute path to your Google Cloud service account credentials JSON file. | |
| `S3_PUBLIC_URL` | Optional public base URL (including the bucket path) returned for uploaded files, e.g. generated call sounds. Set it when `S3_ENDPOINT` is internal-only (storage container behind a reverse proxy). Empty = use the URL reported by `S3_ENDPOINT`. | |
| `PRE_CALCULATE_TIME` | The cron schedule for the daily statistics calculation job. | `'0 21 * * *'` |
| `HOUSEKEEPING_TIME` | The cron schedule for the housekeeping/archiving job. | `'0 22 * * 0'` |


## Project Structure

The project is organized into a modular and layered architecture, making it easy to navigate and extend.

```
.
├── .env.example         # Example environment variables
├── package.json         # Project dependencies and scripts
├── README.md            # You are here
├── src/
│   ├── api/             # API layer (Express)
│   │   ├── controllers/ # Request handlers that orchestrate business logic
│   │   ├── middlewares/ # Custom Express middlewares (auth, error handling, etc.)
│   │   ├── routes/      # API route definitions
│   │   └── validations/ # Request validation schemas
│   │
│   ├── core/            # Core business logic, decoupled from the web layer
│   │   ├── services/    # Service classes containing business logic
│   │   └── dto/         # Data Transfer Objects for structured data exchange
│   │
│   ├── infra/           # Infrastructure concerns and external service integrations
│   │   ├── clients/     # Clients for external services (e.g., Redis)
│   │   ├── db/          # Database setup (Prisma client, schema, migrations)
│   │   └── socket/      # Socket.IO connection management
│   │
│   ├── jobs/            # Background jobs and cron service
│   │   └── cron.js      # Entry point for the cron service
│   │
│   ├── app.js           # Express application setup and configuration
│   ├── container.js     # Awilix dependency injection container setup
│   └── server.js        # Main API server entry point
│
└── tests/               # Automated tests (Jest)
```

## Architectural Patterns & SOLID Principles

This project follows a clean, layered architecture that adheres to **SOLID principles**, promoting separation of concerns and making the codebase modular, scalable, and easy to test.

*   **Dependency Injection (DI):** We use **Awilix** to manage dependencies. Classes receive their dependencies from the container rather than creating them, which decouples the components.
    *   **`D` - Dependency Inversion:** This is the core of our DI setup. High-level modules (like Controllers) depend on abstractions (like `IUserService`), not on concrete implementations.

*   **Proxy Pattern for Caching:** We use Proxies to add a caching layer (`UserServiceProxy`) on top of our core services (`UserService`) without modifying the service's code.
    *   **`S` - Single Responsibility:** The `UserService` is responsible only for user-related business logic, while the `UserServiceProxy` is responsible only for caching.
    *   **`O` - Open/Closed:** The system is open for extension (e.g., adding a caching layer) but closed for modification (the core service logic doesn't change).
    *   **`L` - Liskov Substitution:** The controller can use the `UserServiceProxy` as if it were the original `UserService` because they share the same interface (`IUserService`).

*   **Layered Architecture:** The code is separated into `api`, `core`, and `infra` layers.
    *   **`S` - Single Responsibility:** Each layer has a distinct responsibility. The `api` layer handles web concerns, `core` handles business rules, and `infra` handles data access and external services.

*   **Modular Routers:** The routing is modular, with each feature's routes defined in its own file and orchestrated by a main `routes.js` file.
    *   **`O` - Open/Closed:** New API modules can be added by creating a new route file and adding one line to `routes.js`, without modifying other routes.

## Integrations

### Real-time Updates with Socket.io

This project uses `Socket.io` to provide real-time updates to connected clients. The `SocketManager` class in `src/infra/socket/SocketManager.js` is responsible for managing the Socket.io server and emitting events.

When a new ticket is created or a ticket is called, the server emits an event to all connected clients, which can then update their UI accordingly.

### Google Cloud Text-to-Speech

Google Cloud Text-to-Speech is used to announce ticket numbers. The `GoogleTextToSpeechService` in `src/core/services/googleTextToSpeechService.js` is responsible for converting a ticket number into an audio file, which can then be played on the client-side.

## Developer Guide: Modifying the API

This guide provides practical, step-by-step examples for common development tasks, such as adding a new endpoint or modifying existing logic.

### Part A: Adding a New `POST` Endpoint (Example: Add a Note to a Ticket)

Let's add an endpoint `POST /tickets/:ticketId/notes` to add a text note to an existing ticket.

**1. Update the Database Schema**

First, add a `notes` field to the `Ticket` model in your Prisma schema.

**File:** `src/infra/db/prisma/schema.prisma`
```prisma
model Ticket {
  // ... existing fields
  notes     String?  @db.Text
}
```

After saving, apply the migration:
```bash
npx prisma migrate dev --name add_ticket_notes
```

**2. Create a Validation Schema**

Create a new schema to validate the request body.

**File:** `src/api/validation/ticket.schema.js`
```javascript
const Joi = require('joi');

const addNoteSchema = Joi.object({
  note: Joi.string().trim().required(),
}).required();

const ticketIdSchema = Joi.object({
  ticketId: Joi.string().uuid().required(),
}).required();

module.exports = {
  addNoteSchema,
  ticketIdSchema,
};
```

Then, register `ticketSchema` in `src/container.js` so it can be injected.

**3. Update the Service Layer**

Add the business logic to the `TicketService`.

**File:** `src/core/services/ticketService.js`
```javascript
class TicketService {
  // ... constructor and other methods

  async addNote(ticketId, note, updatedBy) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { notes: note, updatedBy },
    });
  }
}
```

**4. Update the Controller Layer**

Add a new method to the `ticketController` to handle the request.

**File:** `src/api/controllers/ticketController.js`
```javascript
class TicketController {
  // ... constructor and other methods

  async addNote(req, res, next) {
    try {
      const { ticketId } = req.params;
      const { note } = req.body;
      const updatedBy = this.identityHelper.getCurrentUserId();

      const data = await this.ticketService.addNote(ticketId, note, updatedBy);
      return res.status(200).json({ success: true, data, message: 'Note added' });
    } catch (err) {
      next(err);
    }
  }
}
```

**5. Create and Register the Route**

Create a new route file for ticket-related actions and wire it up.

**File:** `src/api/routes/ticketRoutes.js`
```javascript
const express = require('express');

module.exports = ({ ticketController, authMiddleware, validateMiddleware, ticketSchema }) => {
  const router = express.Router();

  /**
   * POST /tickets/{ticketId}/notes
   * @summary Add a note to a ticket
   * @tags Ticket
   * @security BearerAuth
   * @param {string} ticketId.path.required - The ID of the ticket.
   * @param {object} request.body.required - The note content.
   * @example request - Example payload
   * {
   *   "note": "Customer requires special assistance."
   * }
   * @returns {object} 200 - Success response
   */
  router.post(
    '/:ticketId/notes',
    authMiddleware.authorize(['ADMIN', 'USER']),
    validateMiddleware.validate(ticketSchema.ticketIdSchema, 'params'),
    validateMiddleware.validate(ticketSchema.addNoteSchema),
    ticketController.addNote.bind(ticketController)
  );

  return router;
};
```

**File:** `src/api/routes.js` (Main Router)
```javascript
// ... inside module.exports, after the other protected routes

const ticketRoutes = require('./routes/ticketRoutes')({
  ticketController,
  authMiddleware,
  validateMiddleware,
  ticketSchema, // Make sure ticketSchema is injected
});
router.use('/tickets', authMiddleware.authenticateToken, ticketRoutes);
```

### Part B: Updating Existing Logic (Example: Add a `role` filter to `GET /users`)

This is much simpler due to the layered architecture.

**1. Update the Validation Schema**

Allow `role` as a valid query parameter.

**File:** `src/api/validation/user.schema.js`
```javascript
// Inside the getUserSchema object
const getUserSchema = Joi.object({
  // ... existing fields (userName, fullName, etc.)
  role: Joi.string().valid('ADMIN', 'USER').optional(), // <-- Add this line
  // ... existing fields (page, pageSize, etc.)
});
```

**2. Update the Service Layer**

Modify the `getAll` method in the `UserService` to handle the new filter.

**File:** `src/core/services/userService.js`
```javascript
// Inside the UserService class, getAll method
async getAll(payload) {
  const where = {
    // ... existing filters (userName, fullName, etc.)
    role: payload.role ? payload.role : undefined, // <-- Add this line
  };

  // The rest of the method remains the same...
  const [data, count] = await Promise.all([
    this.prisma.user.findMany({ where, ... }),
    this.prisma.user.count({ where }),
  ]);

  return { totalRecord: count, data };
}
```

**That's it!** No changes are needed in the controller or router, as they simply pass the query parameters from the request to the service layer. This demonstrates the power of separation of concerns.

## Testing

To run the tests, use the following command:

```bash
npm test
```

## Logging

The application uses Winston for logging. Logs are stored in the `logs` directory.

## API Documentation

API documentation is automatically generated using `express-jsdoc-swagger`. You can access the documentation at `http://localhost:8000/docs` when the server is running.

## Deployment

Here are general guidelines for deploying this application to a production environment.

### 1. Server Preparation
- Ensure your production server has Node.js, a PostgreSQL database, and a Redis instance accessible.
- Set the `NODE_ENV` environment variable to `production`. This is crucial for performance and security.

### 2. Installation
- On your server, clone the repository and navigate into the project directory.
- Install only the production dependencies:
  ```bash
  npm install --production
  ```

### 3. Configuration
- Create a `.env` file and populate it with your production-level credentials and settings (database URL, JWT secret, etc.). Do not commit this file to version control.
- Ensure the `GOOGLE_APPLICATION_CREDENTIALS` variable points to the correct path on your server, or use a Base64 encoded string for the credentials.

### 4. Running the Application with a Process Manager
It is highly recommended to use a process manager like **PM2** to keep your application services (API and cron) alive and to manage logs and performance.

- Install PM2 globally:
  ```bash
  npm install pm2 -g
  ```

- **Using the Ecosystem File:**
  This project includes an `ecosystem.json` file configured for PM2. You can start both the API and cron services with a single command:
  ```bash
  pm2 start ecosystem.json
  ```

- **Manual Start with PM2:**
  If you prefer to start the services manually:
  ```bash
  # Start the API server
  pm2 start src/server.js --name "api-server"

  # Start the cron job runner
  pm2 start src/jobs/cron.js --name "cron-service"
  ```

- **Managing Processes:**
  ```bash
  pm2 list        # List all running processes
  pm2 logs        # View logs for all processes
  pm2 restart all # Restart all processes
  ```

## License

Copyright (c) 2025 [Your Company Name]. All Rights Reserved.

This project is proprietary and closed-source. You do not have permission to use, copy, modify, or distribute this software without explicit written permission from the copyright holder.