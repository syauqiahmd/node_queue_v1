const redis = require('redis');
const logger = require('../utils/log.helper');

class MessageBroker {
  constructor(redisConfig) {
    this.publisher = redis.createClient(redisConfig);
    this.subscriber = redis.createClient(redisConfig);
    this.publisher.on('error', (err) => {
      logger.error('Redis publisher error', { error: err, context: 'MessageBroker' });
    });
    this.subscriber.on('error', (err) => {
      logger.error('Redis subscriber error', { error: err, context: 'MessageBroker' });
    });
    this.publisher.on('ready', () => {
      logger.info('Redis publisher ready', { context: 'MessageBroker' });
    });
    this.subscriber.on('ready', () => {
      logger.info('Redis subscriber ready', { context: 'MessageBroker' });
    });
    this.publisher.on('end', () => {
      logger.warn('Redis publisher connection ended', { context: 'MessageBroker' });
    });
    this.subscriber.on('end', () => {
      logger.warn('Redis subscriber connection ended', { context: 'MessageBroker' });
    });
    this.subscriber.on('message', this.handleMessage.bind(this));
    this.handlers = new Map();
  }

  subscribe(channel, handler) {
    try {
      this.subscriber.subscribe(channel);
      this.handlers.set(channel, handler);
      logger.info('Subscribed to channel', { channel, context: 'MessageBroker' });
    } catch (err) {
      logger.error('Failed to subscribe to channel', { error: err, channel, context: 'MessageBroker' });
    }
  }

  publish(channel, message) {
    try {
      this.publisher.publish(channel, JSON.stringify(message));
    } catch (err) {
      logger.error('Failed to publish message', { error: err, channel, context: 'MessageBroker' });
    }
  }

  handleMessage(channel, message) {
    try {
      const payload = JSON.parse(message);
      const handler = this.handlers.get(channel);
      if (handler) {
        handler(payload);
      } else {
        logger.warn('No handler for channel', { channel, context: 'MessageBroker' });
      }
    } catch (err) {
      logger.error('Failed to handle broker message', { error: err, channel, context: 'MessageBroker' });
    }
  }
  close() {
    try {
      this.subscriber.unsubscribe();
      this.publisher.quit();
      this.subscriber.quit();
      logger.info('MessageBroker closed', { context: 'MessageBroker' });
    } catch (err) {
      logger.error('Error closing MessageBroker', { error: err, context: 'MessageBroker' });
    }
  }
}

module.exports = MessageBroker;