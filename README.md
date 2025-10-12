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

## Architectural Patterns

### Dependency Injection with Awilix

This project uses `Awilix` for dependency injection (DI). DI is a design pattern where a class receives its dependencies from an external source rather than creating them itself. This makes the code more modular, testable, and easier to maintain.

### Proxy Pattern for Caching

The proxy pattern provides a surrogate or placeholder for another object to control access to it. In this project, we use it to implement a caching layer for our services.

## Integrations

### Real-time Updates with Socket.io

This project uses `Socket.io` to provide real-time updates to connected clients. The `SocketManager` class in `src/infra/socket/SocketManager.js` is responsible for managing the Socket.io server and emitting events.

When a new ticket is created or a ticket is called, the server emits an event to all connected clients, which can then update their UI accordingly.

### Google Cloud Text-to-Speech

Google Cloud Text-to-Speech is used to announce ticket numbers. The `GoogleTextToSpeechService` in `src/core/services/googleTextToSpeechService.js` is responsible for converting a ticket number into an audio file, which can then be played on the client-side.

## How to Add a New API with Proxy Caching (A Detailed Guide)

Here’s a step-by-step guide to creating a new API for a `Product` entity, complete with a caching proxy and dependency injection.

### Step 1: Create the Core Service

**`src/core/services/ProductService.js`**
```javascript
class ProductService {
  constructor({ prismaClient }) {
    this.prisma = prismaClient;
  }

  async getAll(payload) {
    return this.prisma.product.findMany();
  }

  async getById(id) {
    return this.prisma.product.findUnique({ where: { id: Number(id) } });
  }
}

module.exports = ProductService;
```

### Step 2: Create the Caching Proxy Service

**`src/core/services/ProductServiceProxy.js`**
```javascript
class ProductServiceProxy {
  constructor({ productServiceReal, redisClient, logger }) {
    this.productService = productServiceReal;
    this.redisClient = redisClient;
    this.logger = logger;
    this.cacheKeyPrefix = 'product:';
    this.cacheDuration = 3600; // Cache for 1 hour
  }

  async getAll(payload) {
    const cacheKey = `${this.cacheKeyPrefix}all:${JSON.stringify(payload)}`;
    const cachedData = await this.redisClient.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for products: ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for products. Fetching from real service.`);
    const data = await this.productService.getAll(payload);
    await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', this.cacheDuration);
    return data;
  }

  async getById(id) {
    const cacheKey = `${this.cacheKeyPrefix}id:${id}`;
    const cachedData = await this.redisClient.get(cacheKey);

    if (cachedData) {
      this.logger.info(`Cache hit for product ${id}: ${cacheKey}`);
      return JSON.parse(cachedData);
    }

    this.logger.info(`Cache miss for product ${id}. Fetching from real service.`);
    const data = await this.productService.getById(id);
    if (data) {
      await this.redisClient.set(cacheKey, JSON.stringify(data), 'EX', this.cacheDuration);
    }
    return data;
  }
}

module.exports = ProductServiceProxy;
```

### Step 3: Register Services in the DI Container

**`src/container.js`**
```javascript
container.register({
  productServiceReal: asClass(require('./core/services/ProductService')).singleton(),
  productService: asClass(require('./core/services/ProductServiceProxy')).singleton(),
});
```

### Step 4: Create the Controller

**`src/api/controllers/productController.js`**
```javascript
class ProductController {
  constructor({ productService }) {
    this.productService = productService;
  }

  async getAll(req, res, next) {
    try {
      const products = await this.productService.getAll(req.query);
      res.status(200).json(products);
    } catch (error) {
      next(error);
    }
  }

  async getById(req, res, next) {
    try {
      const product = await this.productService.getById(req.params.id);
      res.status(200).json(product);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = ProductController;
```

### Step 5: Register the Controller

**`src/container.js`**
```javascript
container.register({
  productController: asClass(require('./api/controllers/productController')).singleton(),
});
```

### Step 6: Create and Register the Routes

**`src/api/routes/productRoutes.js`**
```javascript
const { Router } = require('express');

module.exports = ({ productController, authMiddleware }) => {
  const router = Router();

  router.get('/', authMiddleware.verifyToken, productController.getAll);
  router.get('/:id', authMiddleware.verifyToken, productController.getById);

  return router;
};
```

**`src/api/routes.js` (Main Router)**
```javascript
const { Router } = require('express');

module.exports = ({ productRoutes, userRoutes }) => {
  const router = Router();

  router.use('/products', productRoutes);
  router.use('/users', userRoutes);

  return router;
};
```

## Testing

To run the tests, use the following command:

```bash
npm test
```

## Logging

The application uses Winston for logging. Logs are stored in the `logs` directory.

## API Documentation

API documentation is automatically generated using `express-jsdoc-swagger`. You can access the documentation at `http://localhost:3000/api-docs` when the server is running.
