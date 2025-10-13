
# UI Blueprint

This document outlines a blueprint and development roadmap for the user interface of the queueing system. The UI will be composed of three distinct parts.

## 1. Staff Application (For Admin & USER roles)

This is the main, secure web application for staff to manage the queueing system. It will be a Single Page Application (SPA).

### 1.1. User Roles & Views

*   **ADMIN:** Has access to all views and all CRUD operations.
*   **USER (Customer Service):** Has a restricted view. Can only see and manage queues for their assigned organization. Cannot access administrative pages (Organizations, Services, Users, Counters).

### 1.2. Page Structure & Layout

*   **Main Layout:** A persistent sidebar for navigation and a main content area where the different pages will be rendered.
*   **Authentication:** All pages within this application are protected. Users are redirected to the `/login` page if not authenticated.

### 1.3. Pages & Components

#### **Page: Login (`/login`)**
*   **Description:** A simple form to log in.
*   **Components:** `LoginForm`.
*   **API Interaction:** `POST /api/v1/public/login`.

#### **Page: Dashboard (`/`)**
*   **Description:** The landing page after login. Shows a summary of queue activity.
*   **View (USER):** Shows `Total Tickets Today`, `Tickets Served`, and `Tickets Waiting` for their assigned organization's services.
*   **View (ADMIN):** Shows system-wide statistics.
*   **Components:** `StatCard`, `ActivityChart`.
*   **API Interaction:** `GET /api/v1/queues/:serviceId/summary` (called for each service in the org).

#### **Page: Queue Management (`/manage-queue`)**
*   **Description:** The primary workspace for `USER` roles to manage customer flow.
*   **Components:**
    *   `ServiceSelector`: A dropdown to select the active service the user is managing.
    *   `QueueDisplay`: Shows two lists of tickets for the selected service: "Waiting" and "Called". This component will have real-time updates via WebSockets.
    *   `ActionButtons`: Contains buttons like `Call Next`, `Recall`, `Mark as No-Show`, `Resolve`.
*   **API Interaction:**
    *   `GET /api/v1/queues/:serviceId`: To fetch the initial list of tickets.
    *   `POST /api/v1/queues/call`: For the "Call Next" button.
    *   `POST /api/v1/queues/action`: For recall/resolve actions.
    *   Listens to WebSocket events (`new-ticket`, `call-ticket`, `resolve-ticket`) to update the `QueueDisplay` in real-time.

#### **Page: Organizations (`/admin/organizations`)** - ADMIN ONLY
*   **Description:** CRUD interface for managing organizations.
*   **Components:** `OrganizationsTable`, `OrganizationForm` (in a modal or on a separate `/admin/organizations/new` page).
*   **API Interaction:** `GET`, `POST`, `PUT`, `DELETE` on `/api/v1/organizations`.

#### **Page: Services (`/admin/services`)** - ADMIN ONLY
*   **Description:** CRUD interface for managing services.
*   **Components:** `ServicesTable`, `ServiceForm`.
*   **API Interaction:** `GET`, `POST`, `PUT`, `DELETE` on `/api/v1/services`.

#### **Page: Counters (`/admin/counters`)** - ADMIN ONLY
*   **Description:** CRUD interface for managing counters.
*   **Components:** `CountersTable`, `CounterForm`.
*   **API Interaction:** `GET`, `POST`, `PUT`, `DELETE` on `/api/v1/counters`.

#### **Page: Users (`/admin/users`)** - ADMIN ONLY
*   **Description:** CRUD interface for managing users.
*   **Components:** `UsersTable`, `UserForm`.
*   **API Interaction:** `GET`, `POST`, `PUT`, `DELETE` on `/api/v1/users`.

---

## 2. Customer Kiosk Application

This is a simple, touch-friendly interface for customers to self-issue tickets.

### 2.1. Page Structure

*   **Welcome Page (`/`)**
    *   **Description:** A full-screen display showing the organization's name/logo and a grid of available services.
    *   **Components:** `ServiceSelectionGrid` with large, tappable `ServiceCard` components for each service.
    *   **API Interaction:** `GET /api/v1/public/organizations` to get the list of services to display.

*   **Ticket Confirmation & Print Page (`/ticket-generated`)**
    *   **Description:** Displayed after the customer selects a service. Shows the ticket number prominently and provides a print option.
    *   **Components:** `TicketDisplay` (shows e.g., "Your Number is A-101"), `PrintTicketButton`.
    *   **API Interaction:** Triggered by `POST /api/v1/public/tickets`. The response contains the ticket number to display. The print function will format this information for a thermal printer.

---

## 3. Queue Monitoring Display

This is a large-screen display, visible to all customers, showing the status of the queues.

### 3.1. Page Structure

*   **Main Display Page (`/`)**
    *   **Description:** A high-contrast, large-font view designed for readability from a distance. It might be a split screen.
    *   **Components:**
        *   `NowServingList`: A list showing the most recently called ticket numbers and their assigned counters (e.g., **A-101** -> **Counter 03**). This list is updated in real-time.
        *   `(Optional) MediaView`: The other part of the screen could display promotional videos or images.
    *   **API Interaction & Real-time:**
        *   On load, it can fetch initial state from `GET /api/v1/public/queues`.
        *   Crucially, it **must** connect to the WebSocket server and listen for the `call-ticket` event.
        *   When a `call-ticket` event is received, the `NowServingList` is updated, the new ticket is highlighted, and the corresponding audio is fetched from `GET /api/v1/public/call-queue/:queueId` and played automatically.
