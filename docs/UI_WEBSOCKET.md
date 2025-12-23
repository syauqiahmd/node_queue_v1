# UI Guide: Native WebSocket (WS) via `ws.qms-mpp.web.id`

## Connection

- URL: `ws://ws.qms-mpp.web.id/`
- Protocol: Native WebSocket (not Socket.IO)
- Path: `/` (no `/socket.io`)

## Vue Environment

```
VITE_WS_URL=ws://ws.qms-mpp.web.id/
```

## Basic Client

```
const ws = new WebSocket(import.meta.env.VITE_WS_URL);
ws.onopen = () => {};
ws.onmessage = (ev) => {
  const { event, data } = JSON.parse(ev.data);
};
ws.onclose = () => {};
ws.onerror = () => {};
```

## Reconnect Strategy

```
function createWS(url, { maxDelay = 10000 } = {}) {
  let delay = 1000;
  let socket;
  const connect = () => {
    socket = new WebSocket(url);
    socket.onopen = () => { delay = 1000; };
    socket.onclose = () => {
      setTimeout(connect, delay);
      delay = Math.min(delay * 2, maxDelay);
    };
    socket.onmessage = (ev) => {
      const { event, data } = JSON.parse(ev.data);
    };
  };
  connect();
  return () => socket && socket.close();
}
```

## Events

- `ticket:created`
  - Source: `src/core/services/ticketService.js:75`
  - Data: `src/core/dto/websocket/TicketCreatedDTO.js`
- `ticket:called`
  - Source: `src/core/services/queueService.js:190`
  - Data: `src/core/dto/websocket/TicketCalledDTO.js`
- `ticket:recalled`
  - Source: `src/core/services/queueService.js:189`
  - Data: `src/core/dto/websocket/TicketRecalledDTO.js`
- `ticket:resolved`
  - Source: `src/core/services/queueService.js:239`
  - Data: `src/core/dto/websocket/TicketResolvedDTO.js`
- `ticket:prioritized`
  - Source: `src/core/services/queueService.js:295`
  - Data: `src/core/dto/websocket/TicketPrioritizedDTO.js`

## UI Handling Example

```
const handlers = {
  'ticket:created': (d) => {},
  'ticket:called': (d) => {},
  'ticket:recalled': (d) => {},
  'ticket:resolved': (d) => {},
  'ticket:prioritized': (d) => {},
};
const ws = new WebSocket(import.meta.env.VITE_WS_URL);
ws.onmessage = (ev) => {
  const { event, data } = JSON.parse(ev.data);
  const h = handlers[event];
  if (h) h(data);
};
```

## Production Checklist

- DNS A records point to server for `ws.qms-mpp.web.id`
- Nginx site for WS includes upgrade headers
- Port `8080` open and service running

## Troubleshooting

- Handshake is 101 but no messages:
  - Ensure backend publishes to WS message broker channel
  - Verify with `wscat -c ws://ws.qms-mpp.web.id/`

