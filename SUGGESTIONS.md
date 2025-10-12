# Suggestions for Improvement and Potential Missing APIs

## Suggestions for Improvement

1.  **Real-time Monitoring and Sound Generation:**

    - In the UML diagram, the client makes a separate API call to fetch the text-to-speech audio file. A more efficient approach would be to generate the audio file on the server when a ticket is called and then broadcast the URL to the audio file via the socket event. This would eliminate the need for an extra client-side API call.
    - **Leverage Cloud Storage (e.g., S3) for TTS Audio Caching:** To further optimize costs and performance, store generated audio files in a cloud storage bucket (like AWS S3 or Google Cloud Storage). This ensures you only pay for TTS generation once per unique announcement. Subsequent requests retrieve the file from storage, significantly reducing latency and TTS API costs. Your `GoogleTextToSpeechServiceProxy` can be extended to manage this persistent caching layer, potentially integrating with a CDN for even faster global delivery.

2.  **Queue Management Features:**
    - **Analytics and Reporting:** To provide more value to administrators, you could create API endpoints for analytics, such as average wait times, peak hours, and counter performance reports.

3.  **Reporting and Data Archiving Strategy (Cron Jobs):**

    - **Reporting with Pre-calculated Statistics:** Instead of running complex analytical queries on the fly, create a scheduled job (e.g., using `node-cron`) that runs nightly to pre-calculate key metrics.
        - The scheduled job would populate this table, and your reporting APIs would query this table for fast and efficient reporting.

    - **Housekeeping with Archiving:** To keep the main `Ticket` table lean and fast, periodically move old, resolved tickets to an archive table.
        - Create an `ArchivedTicket` table with the exact same structure as the `Ticket` table.
        - Create a scheduled job to run periodically (e.g., nightly or weekly) to copy resolved tickets older than a certain threshold (e.g., 30 days) to the `ArchivedTicket` table.
        - After a successful copy, delete the old tickets from the main `Ticket` table.

## Cron Job and Service Structure

For implementing scheduled tasks like reporting and data archiving, the recommended approach is to separate the cron job runner from the main API server.

-   **API Service (`src/server.js`):** This remains your main entry point for handling user-facing API requests. You would add new reporting endpoints (e.g., `GET /api/analytics/summary`) to this service.

-   **Cron Service (`src/cron.js`):** This will be a new entry point for a background service that runs scheduled jobs. You would run this as a separate process (e.g., `node src/cron.js`).

    -   **Configuration:**
        1.  **Create `src/cron.js`:** This file will initialize the DI container and schedule the jobs.
        2.  **Add a Scheduler Library:** Use a library like `node-cron` (`npm install node-cron`).
        3.  **Create a `ReportingService`:** This service will contain the logic for calculating statistics and saving them to the database.
        4.  **Implement the Job:** In `src/cron.js`, use `node-cron` to schedule calls to your `ReportingService`.

    -   **Example `src/cron.js`:**
        ```javascript
        require('dotenv').config();
        const cron = require('node-cron');
        const container = require('./container');
        const logger = container.resolve('logger');
        const reportingService = container.resolve('reportingService');

        logger.info('[CRON] Starting cron service...');

        // Schedule a job to run every day at midnight
        cron.schedule('0 0 * * *', async () => {
          logger.info('[CRON] Running daily report generation...');
          try {
            await reportingService.generateDailyStatistics();
            logger.info('[CRON] Daily report generation completed successfully.');
          } catch (error) {
            logger.error('[CRON] Error generating daily report:', error);
          }
        });
        ```

## Refined `DailyServiceStats` Table Schema

To efficiently support the reporting APIs, the `DailyServiceStats` table should include the `organizationId` and additional metrics:

```prisma
model DailyServiceStats {
  id                  String    @id @default(uuid())
  organizationId      String    @db.Uuid
  serviceId           String    @db.Uuid
  date                DateTime  @db.Date
  totalTickets        Int       // Total tickets created for the day
  resolvedTickets     Int
  ticketsInProgress   Int       // Tickets called but not resolved on that day
  avgWaitTime         Float     // in minutes
  minWaitTime         Float     // New
  maxWaitTime         Float     // New
  medianWaitTime      Float     // New
  peakHour            Int       // New (e.g., 0-23)

  @@unique([serviceId, date])
  @@index([organizationId, serviceId, date]) // For efficient querying
}
```

## Refined Reporting APIs

Based on the `DailyServiceStats` table, here are the refined reporting APIs:

- **`GET /api/analytics/summary`**
  - **Purpose:** To get a high-level, aggregated overview of the entire system.
  - **Query Parameters:** `startDate` (e.g., '2025-10-01'), `endDate` (e.g., '2025-10-31').
  - **Logic:** Queries the `DailyServiceStats` table, filters by the date range, and aggregates the results (e.g., sum of `totalTickets`, average of `avgWaitTime`, min/max/median wait times) across all records to produce a single summary object.
  - **Example Response:**
    ```json
    {
      "query": {
        "startDate": "2025-09-01",
        "endDate": "2025-09-30"
      },
      "totalTicketsServed": 15000,
      "overallAverageWaitTime": 12.5,
      "overallMinWaitTime": 1.2,
      "overallMaxWaitTime": 45.0,
      "overallMedianWaitTime": 10.0
    }
    ```

- **`GET /api/analytics/report-overview`**
  - **Purpose:** To get a high-level, aggregated overview of the entire system, grouped by organization and service.
  - **Query Parameters:** `startDate`, `endDate`, `organizationId` (optional), `serviceId` (optional).
  - **Logic:** Queries the `DailyServiceStats` table, filters by the date range and any optional IDs, then groups the results by `organizationId` and `serviceId` to provide aggregated totals for each service, including min/max/median wait times and tickets in progress.
  - **Example Response:**
    ```json
    {
      "query": {
        "startDate": "2025-09-01",
        "endDate": "2025-09-30"
      },
      "report": [
        {
          "organizationId": "org-uuid-1",
          "organizationName": "Main Branch",
          "serviceId": "service-uuid-A",
          "serviceName": "General Inquiries",
          "totalTicketsServed": 850,
          "averageWaitTime": 15.2,
          "minWaitTime": 2.1,
          "maxWaitTime": 30.5,
          "medianWaitTime": 14.0,
          "ticketsInProgress": 5,
          "peakHour": 14
        },
        {
          "organizationId": "org-uuid-1",
          "organizationName": "Main Branch",
          "serviceId": "service-uuid-B",
          "serviceName": "New Accounts",
          "totalTicketsServed": 620,
          "averageWaitTime": 11.8,
          "minWaitTime": 1.5,
          "maxWaitTime": 25.0,
          "medianWaitTime": 10.0,
          "ticketsInProgress": 2,
          "peakHour": 11
        }
      ]
    }
    ```

- **CSV Export (via `GET /api/analytics/report-overview?format=csv`)**
  - **Purpose:** To export the data from the `report-overview` in CSV format.
  - **How it works:** The controller logic for `/api/analytics/report-overview` would check for a `format=csv` query parameter. If present, it would convert the JSON data to a CSV string and send it back with appropriate `Content-Type` and `Content-Disposition` headers to trigger a file download.