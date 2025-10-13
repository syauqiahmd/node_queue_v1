
# Production Readiness Checklist

This document contains a list of suggested improvements to ensure the application is secure, reliable, and maintainable for a production environment.

---

## High Priority

### 1. Security: CORS Configuration

*   **Issue:** The WebSocket server in `src/infra/socket/SocketManager.js` allows connections from any origin (`origin: '*'`). This is insecure.
*   **Suggestion:** Restrict the allowed origin to your specific frontend domain using an environment variable (e.g., `process.env.CORS_ORIGIN`).

*   **Issue:** The main Express app in `src/app.js` lacks an explicit CORS policy for the REST API.
*   **Suggestion:** Add the `cors` package to the project and configure it in `app.js` to control API access, also using an environment variable.

### 2. Reliability: Race Condition in `callNextQueue`

*   **Issue:** The `callNextQueue` method in `queueService.js` is not atomic. Two simultaneous requests could fetch the same ticket before it's marked as "called," leading to data inconsistency.
*   **Suggestion:** Wrap the logic for finding the next available ticket and updating its status within a `this.prisma.$transaction(...)` block to make the operation atomic.

### 3. Reliability: Unhandled Promise Rejections

*   **Issue:** Asynchronous controller methods do not have explicit `try...catch` blocks, which could lead to unhandled promise rejections that crash the server.
*   **Suggestion:** Add the `express-async-errors` package to your project. Simply requiring it once at the top of your `app.js` file will automatically catch these errors and pass them to your global error handler.

---

## Recommended Improvements

### 4. Maintainability: Graceful Shutdown

*   **Issue:** The application does not have a graceful shutdown procedure, which can cause abrupt disconnections and interrupt in-flight requests when the server restarts.
*   **Suggestion:** Implement a handler for `SIGTERM` and `SIGINT` signals. This handler should stop the server from accepting new requests, wait for existing requests to finish, and then properly close connections to the database (`prisma.$disconnect()`) and Redis before exiting the process.

### 5. Maintainability: Date and Time Logic

*   **Issue:** The logic for calculating the start and end of the day is duplicated in multiple services, making it prone to bugs and difficult to maintain.
*   **Suggestion:** Use a dedicated date/time library like `date-fns` or `dayjs`. Create a centralized helper function (e.g., in a `date.helper.js` utility file) to provide consistent timestamps throughout the application.
