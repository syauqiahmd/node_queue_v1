# Node.js Queue Management System

This is a robust and scalable queue management system built with Node.js, Express, and Prisma. It leverages a modular architecture with dependency injection and a proxy pattern for caching, making it easy to maintain and extend.

## Features

*   **Organization Management:** Create, read, update, and delete organizations.
*   **Service Management:** Manage services within each organization.
*   **Counter Management:** Manage counters for each service.
*   **User Management:** Handle user authentication and authorization.
*   **Queue Management:** A complete queueing system with ticket generation and management.
*   **Real-time Updates with Socket.io:** Uses Socket.io for real-time, bidirectional event-based communication to update clients instantly.
*   **Text-to-Speech with Google Cloud:** Integrates Google Cloud Text-to-Speech to announce ticket numbers.
*   **Caching:** Implements a proxy pattern with Redis for caching frequently accessed data.
*   **Logging:** Comprehensive logging with Winston.
*   **API Documentation:** Auto-generated API documentation with Swagger.

## Technologies

*   **Node.js:** JavaScript runtime environment (v22.15.1).
*   **Express:** Web framework for Node.js.
*   **Prisma:** Next-generation ORM for Node.js and TypeScript.
*   **Redis:** In-memory data store for caching.
*   **Socket.io:** Real-time, bidirectional event-based communication.
*   **Google Cloud Text-to-Speech:** Converts text into natural-sounding speech.
*   **Awilix:** Dependency injection container for JavaScript.
*   **Joi:** Object schema validation.
*   **Winston:** A multi-transport async logging library for Node.js.
*   **Jest:** JavaScript testing framework.

## Getting Started

### Prerequisites

*   Node.js (v22.15.1 or higher)
*   npm
*   PostgreSQL (or any other database compatible with Prisma)
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

3.  **Set up environment variables:**

    Create a `.env` file in the root directory and add the following environment variables (you can copy them from `.env.example`):

    ```
    DATABASE_URL="postgresql://user:password@host:port/database"
    REDIS_HOST="localhost"
    REDIS_PORT="6379"
    JWT_SECRET="your-jwt-secret"
    GOOGLE_APPLICATION_CREDENTIALS="/path/to/your/google-credentials.json"
    ```

4.  **Run database migrations:**

    ```bash
    npm run generate
    ```

### Running the Application

*   **Development mode:**

    ```bash
    npm run dev
    ```

    This will start the server with Nodemon, which will automatically restart the server on file changes.

*   **Production mode:**

    ```bash
    npm start
    ```

## Project Structure

```
.
├───src
│   ├───api
│   ├───core
│   ├───infra
│   ├───app.js
│   ├───container.js
│   └───server.js
└───tests
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
