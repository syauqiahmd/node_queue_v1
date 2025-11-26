const redis = require('redis');
const logger = require('../utils/log.helper');

class MessageBroker {
  constructor(redisConfig) {
    const { host = '127.0.0.1', port = 6379, password = '' } = redisConfig || {};
    const url = password
      ? `redis://:${encodeURIComponent(password)}@${host}:${port}`
      : `redis://@${host}:${port}`;
    this.publisher = redis.createClient({ url });
    this.subscriber = redis.createClient({ url });
    this.publisher.on('error', (err) => {
      logger.error('Redis publisher error', { error: err, context: 'MessageBroker' });
    });
    this.subscriber.on('error', (err) => {
      logger.error('Redis subscriber error', { error: err, context: 'MessageBroker' });
      Promise.resolve()
        .then(() => this.ensureSubscriber())
        .then(() => this.resubscribeAll())
        .catch((e) =>
          logger.error('Redis resubscribe failed', { error: e, context: 'MessageBroker' })
        );
    });
    this.publisher.on('ready', () => {
      logger.info('Redis publisher ready', { context: 'MessageBroker' });
    });
    this.subscriber.on('ready', () => {
      logger.info('Redis subscriber ready', { context: 'MessageBroker' });
      Promise.resolve()
        .then(() => this.resubscribeAll())
        .catch((e) =>
          logger.error('Redis resubscribe failed', { error: e, context: 'MessageBroker' })
        );
    });
    this.publisher.on('end', () => {
      logger.warn('Redis publisher connection ended', { context: 'MessageBroker' });
    });
    this.subscriber.on('end', () => {
      logger.warn('Redis subscriber connection ended', { context: 'MessageBroker' });
      Promise.resolve()
        .then(() => this.ensureSubscriber())
        .then(() => this.resubscribeAll())
        .catch((e) =>
          logger.error('Redis resubscribe failed', { error: e, context: 'MessageBroker' })
        );
    });
    this.handlers = new Map();
    this._connectingPub = false;
    this._connectingSub = false;
  }

  async ensurePublisher() {
    if (this.publisher.isOpen || this._connectingPub) {
      return;
    }
    this._connectingPub = true;
    try {
      await this.publisher.connect();
    } finally {
      this._connectingPub = false;
    }
  }

  async ensureSubscriber() {
    if (this.subscriber.isOpen || this._connectingSub) {
      return;
    }
    this._connectingSub = true;
    try {
      await this.subscriber.connect();
    } finally {
      this._connectingSub = false;
    }
  }

  subscribe(channel, handler) {
    try {
      this.handlers.set(channel, handler);
      Promise.resolve()
        .then(() => this.ensureSubscriber())
        .then(() =>
          this.subscriber.subscribe(channel, (message) => this.handleMessage(channel, message))
        )
        .then(() => logger.info('Subscribed to channel', { channel, context: 'MessageBroker' }))
        .catch((e) =>
          logger.error('Redis subscribe failed', { error: e, channel, context: 'MessageBroker' })
        );
    } catch (err) {
      logger.error('Failed to subscribe to channel', {
        error: err,
        channel,
        context: 'MessageBroker',
      });
    }
  }

  publish(channel, message) {
    try {
      Promise.resolve()
        .then(() => this.ensurePublisher())
        .then(() => this.publisher.publish(channel, JSON.stringify(message)))
        .catch((e) =>
          logger.error('Redis publish failed', { error: e, channel, context: 'MessageBroker' })
        );
    } catch (err) {
      logger.error('Failed to publish message', {
        error: err,
        channel,
        context: 'MessageBroker',
      });
    }
  }

  handleMessage(channel, message) {
    try {
      const payload = typeof message === 'string' ? JSON.parse(message) : message;
      const handler = this.handlers.get(channel);
      if (handler) {
        handler(payload);
      } else {
        logger.warn('No handler for channel', {
          channel,
          context: 'MessageBroker',
        });
      }
    } catch (err) {
      logger.error('Failed to handle broker message', {
        error: err,
        channel,
        context: 'MessageBroker',
      });
    }
  }
  async resubscribeAll() {
    if (!this.handlers.size) {
      return;
    }
    for (const [channel] of this.handlers.entries()) {
      await this.subscriber
        .subscribe(channel, (message) => this.handleMessage(channel, message))
        .catch((e) =>
          logger.error('Redis subscribe failed', { error: e, channel, context: 'MessageBroker' })
        );
    }
  }
  close() {
    try {
      this.subscriber.unsubscribe();
      if (this.publisher.isOpen) {
        this.publisher.quit();
      }
      if (this.subscriber.isOpen) {
        this.subscriber.quit();
      }
      logger.info('MessageBroker closed', { context: 'MessageBroker' });
    } catch (err) {
      logger.error('Error closing MessageBroker', { error: err, context: 'MessageBroker' });
    }
  }
}

module.exports = MessageBroker;
