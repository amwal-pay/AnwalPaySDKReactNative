import {
  initiate,
  onCustomerId,
  onResponse,
  type AmwalPayConfig,
} from './index';
import NetworkClient from './network/NetworkClient';
import Logger from './utils/Logger';
import { type EventSubscription } from 'react-native';

class AmwalPaySDK {
  private static instance: AmwalPaySDK;
  private logger: Logger;

  private onResponseSubscription: EventSubscription | null = null;

  private onCustomerIdSubscription: EventSubscription | null = null;

  private constructor() {
    // Initialize the logger
    this.logger = Logger.getInstance();
    this.logger.info('AmwalPaySDK', 'SDK instance created');
  }

  static getInstance(): AmwalPaySDK {
    if (!AmwalPaySDK.instance) {
      AmwalPaySDK.instance = new AmwalPaySDK();
    }
    return AmwalPaySDK.instance;
  }

  /**
   * Enable or disable debug logging
   */
  setDebugEnabled(enabled: boolean): void {
    this.logger.setDebugEnabled(enabled);
    this.logger.info(
      'AmwalPaySDK',
      `Debug logging ${enabled ? 'enabled' : 'disabled'}`
    );
  }

  /**
   * Get SDK logs for debugging purposes
   */
  getLogs(): string {
    return this.logger.exportLogs();
  }

  /**
   * Clear all SDK logs
   */
  clearLogs(): void {
    this.logger.clearLogs();
    this.logger.info('AmwalPaySDK', 'Logs cleared');
  }

  /**
   * Initiates the payment process by first fetching a session token and then starting the payment flow
   * @param config The payment configuration
   */
  async startPayment(
    config: Omit<AmwalPayConfig, 'sessionToken'>
  ): Promise<void> {
    try {
      this.logger.info('AmwalPaySDK', 'Starting payment process', {
        merchantId: config.merchantId,
        customerId: config.customerId,
        environment: config.environment,
      });

      // Set up event listeners before starting the payment process
      this.setupEventListeners(config);

      // Get network client instance
      const networkClient = NetworkClient.getInstance();

      // Fetch session token
      this.logger.debug('AmwalPaySDK', 'Fetching session token', {
        environment: config.environment,
        merchantId: config.merchantId,
      });

      const sessionToken = await networkClient.fetchSessionToken(
        config.environment,
        config.merchantId,
        config.customerId,
        config.secureHash
      );

      if (!sessionToken) {
        this.logger.error('AmwalPaySDK', 'Failed to fetch session token');
        return;
      }

      this.logger.info('AmwalPaySDK', 'Session token fetched successfully');

      // Create complete config with session token
      const completeConfig: AmwalPayConfig = {
        ...config,
        sessionToken,
      };

      // Initiate the payment process
      this.logger.debug(
        'AmwalPaySDK',
        'Initiating native payment',
        completeConfig
      );
      initiate(completeConfig);

      this.logger.info('AmwalPaySDK', 'Payment process initiated successfully');
    } catch (error) {
      this.logger.error('AmwalPaySDK', 'Error starting payment', error);
    }
  }

  dispose(): void {
    this.logger.info('AmwalPaySDK', 'Disposing SDK instance');
    // Remove all event listeners
    this.removeEventListeners();
  }

  /**
   * Sets up event listeners for AmwalPay events
   * @param config The payment configuration containing callback functions
   */
  private setupEventListeners(
    config: Omit<AmwalPayConfig, 'sessionToken'>
  ): void {
    // Remove any existing listeners
    this.removeEventListeners();

    this.logger.debug('AmwalPaySDK', 'Setting up event listeners', {
      hasOnResponse: typeof config.onResponse === 'function',
      hasOnCustomerId: typeof config.onCustomerId === 'function',
    });

    this.onResponseSubscription = onResponse((response) => {
      this.logger.info('AmwalPaySDK', 'Received payment response', response);
      if (config.onResponse) {
        config.onResponse(response);
      } else {
        this.logger.error(
          'AmwalPaySDK',
          'onResponse callback is not a function'
        );
      }
    });

    this.onCustomerIdSubscription = onCustomerId((customerId) => {
      this.logger.info('AmwalPaySDK', 'Received customer ID', { customerId });
      if (config.onCustomerId) {
        config.onCustomerId(customerId);
      } else {
        this.logger.error(
          'AmwalPaySDK',
          'onCustomerId callback is not a function'
        );
      }
    });

    this.logger.debug('AmwalPaySDK', 'Event listeners setup completed');
  }

  /**
   * Removes all event listeners
   */
  private removeEventListeners(): void {
    if (this.onResponseSubscription || this.onCustomerIdSubscription) {
      this.logger.debug('AmwalPaySDK', 'Removing event listeners');
    }

    this.onResponseSubscription?.remove();
    this.onCustomerIdSubscription?.remove();
    this.onResponseSubscription = null;
    this.onCustomerIdSubscription = null;
  }
}

export default AmwalPaySDK;
