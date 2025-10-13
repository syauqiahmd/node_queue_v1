# UML Sequence Diagrams

## 1. Get List with Sorting (Admin/Customer Service)

This diagram represents fetching a list of resources (e.g., organizations, services, counters, users) with optional sorting.

```mermaid
sequenceDiagram
    participant User as Admin/CS
    participant Routes as /api/{resource}
    participant Controller as {resource}Controller
    participant Service as {resource}Service
    participant DB as Database

    User->>Routes: GET /?sortBy=name&sortOrder=asc
    Routes->>Controller: getAll(req, res)
    Controller->>Service: getAll({ sortBy: 'name', sortOrder: 'asc', ... })
    Service->>DB: Find many resources with sorting
    DB-->>Service: Return resources
    Service-->>Controller: Return resources
    Controller-->>User: 200 OK with resource list
```

## 2. Create Queue (Customer)

```mermaid
sequenceDiagram
    participant User as Customer
    participant Routes as /api/public/ticket
    participant Controller as queueController
    participant Service as ticketService
    participant DB as Database
    participant Socket as SocketManager

    User->>Routes: POST / (with serviceId)
    Routes->>Controller: createTicket(req, res)
    Controller->>Service: createTicket(serviceId)
    Service->>DB: Create new ticket
    DB-->>Service: Return created ticket
    Service->>Socket: broadcast('new-ticket', newTicket)
    Service-->>Controller: Return created ticket
    Controller-->>User: 201 Created with ticket info
```

## 3. Call Queue (Admin/Customer Service)

```mermaid
sequenceDiagram
    participant User as Admin/CS
    participant Routes as /api/queues/call-next
    participant Controller as queueController
    participant Service as queueService
    participant DB as Database
    participant Socket as SocketManager

    User->>Routes: POST / (with serviceId, counterId)
    Routes->>Controller: callNextTicket(req, res)
    Controller->>Service: callNextTicket(serviceId, counterId)
    Service->>DB: Find next ticket and update status
    DB-->>Service: Return updated ticket
    Service->>Socket: broadcast('call-ticket', updatedTicket)
    Service-->>Controller: Return updated ticket
    Controller-->>User: 200 OK with called ticket
```

## 4. Monitoring Called Queue and Sound Generation

This diagram illustrates the real-time update on the monitoring screen and the subsequent sound generation.

```mermaid
sequenceDiagram
    participant MonitorClient as Monitoring Screen
    participant SocketServer as Socket.IO Server
    participant APIServer as API Server
    participant BroadcastService as broadcastService
    participant GoogleTTS as googleTextToSpeechService

    MonitorClient->>SocketServer: Connect
    SocketServer-->>MonitorClient: Connection established

    Note over MonitorClient, SocketServer: Client listens for 'call-ticket' event

    participant User as Admin/CS
    User->>APIServer: POST /api/queues/call-next
    APIServer->>BroadcastService: callTicket(ticket)
    BroadcastService->>SocketServer: Emit 'call-ticket' event with ticket data
    SocketServer->>MonitorClient: Push 'call-ticket' event
    
    MonitorClient->>MonitorClient: Update UI with new ticket info
    MonitorClient->>APIServer: GET /api/broadcast/tts?ticketNumber=...
    APIServer->>BroadcastService: generateTTS(ticketNumber)
    BroadcastService->>GoogleTTS: synthesizeSpeech("Ticket... A 1")
    GoogleTTS-->>BroadcastService: Return audio stream/file
    BroadcastService-->>APIServer: Return audio file
    APIServer-->>MonitorClient: Return audio file
    MonitorClient->>MonitorClient: Play audio
```