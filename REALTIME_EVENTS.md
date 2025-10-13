
# Real-time Events Documentation

This document outlines the WebSocket events used for real-time communication between the server and the clients. This is essential for features like the live queue management dashboard and the public monitoring screen.

## Connection

Clients connect to the WebSocket server and can join specific "rooms" to receive relevant events.

*   `join-service-room`: A client (like the Staff Application) sends this event with a `serviceId` to join a room for a specific service. This ensures they only receive updates for the queue they are managing.
    *   **Payload:** `string` (The `serviceId`)

*   `join-monitor-room`: A client (like the public Monitoring Screen) sends this event to receive updates from all services.

### Client-Side Connection Example
```javascript
import { io } from "socket.io-client";

const socket = io("http://localhost:3000"); // Replace with your server URL

// For Staff UI, join a specific service room
const serviceId = 'your-service-id';
socket.emit('join-service-room', serviceId);

// For Public Monitoring Display, join the global monitor room
socket.emit('join-monitor-room');
```

---

## Event Reference

The following are events broadcasted by the server.

### Event: `ticket:created`

*   **Description:** Emitted when a new ticket is created by a customer.
*   **Implementation Status:** Implemented
*   **Recipient:** Broadcasted to the `service-{serviceId}` room corresponding to the ticket's service.
*   **Payload:** A lightweight `TicketCreatedDTO` object.
    ```json
    {
      "id": "string <uuid>",
      "queueNumber": "number",
      "prefix": "string",
      "serviceId": "string <uuid>"
    }
    ```
*   **Client-Side Usage:**
    ```javascript
    socket.on('ticket:created', (newTicket) => {
      console.log('A new ticket has been created:', newTicket);
      // Logic to add the new ticket to the 'Waiting' list in the UI
    });
    ```

### Event: `ticket:called`

*   **Description:** Emitted when a staff member calls the next ticket.
*   **Implementation Status:** Implemented
*   **Recipient:** Broadcasted to both the `service-{serviceId}` room and the `monitor-room`.
*   **Payload:** A lightweight `TicketCalledDTO` object.
    ```json
    {
      "id": "string <uuid>",
      "queueNumber": "number",
      "prefix": "string",
      "serviceName": "string",
      "counterNumber": "string",
      "organizationName": "string"
    }
    ```
*   **Client-Side Usage:**
    ```javascript
    socket.on('ticket:called', (calledTicket) => {
      console.log('A ticket has been called:', calledTicket);
      // Logic to move the ticket from 'Waiting' to 'Called' in the Staff UI
      // Logic to display the called ticket on the Monitoring Screen and play the sound
    });
    ```

### Event: `ticket:resolved`

*   **Description:** Emitted when a staff member marks a ticket as resolved.
*   **Implementation Status:** Implemented
*   **Recipient:** Broadcasted to the `service-{serviceId}` room.
*   **Payload:** A lightweight `TicketResolvedDTO` object.
    ```json
    {
      "id": "string <uuid>",
      "isResolved": true,
      "serviceId": "string <uuid>"
    }
    ```
*   **Client-Side Usage:**
    ```javascript
    socket.on('ticket:resolved', (resolvedTicket) => {
      console.log('A ticket has been resolved:', resolvedTicket);
      // Logic to remove the ticket from the 'Called' list in the UI
    });
    ```

### Event: `ticket:prioritized`

*   **Description:** Emitted when a ticket is marked as a priority.
*   **Implementation Status:** Implemented
*   **Recipient:** Broadcasted to the `service-{serviceId}` room.
*   **Payload:** A lightweight `TicketPrioritizedDTO` object.
    ```json
    {
      "id": "string <uuid>",
      "isPriority": true,
      "serviceId": "string <uuid>"
    }
    ```
*   **Client-Side Usage:**
    ```javascript
    socket.on('ticket:prioritized', (prioritizedTicket) => {
      console.log('A ticket has been prioritized:', prioritizedTicket);
      // Logic to visually highlight the ticket in the 'Waiting' list
    });
    ```
