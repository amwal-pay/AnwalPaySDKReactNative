import { initiate, onCustomerId, onResponse, type AmwalPayConfig } from './index';
import NetworkClient from './network/NetworkClient';
import { NativeEventEmitter, NativeModules, type EventSubscription } from 'react-native';


class AmwalPaySDK {
  private static instance: AmwalPaySDK;
  private eventEmitter: NativeEventEmitter;
  private eventListeners: any[] = [];

  private onResponseSubscription: EventSubscription|null = null;

  private onCustomerIdSubscription: EventSubscription|null = null;
  
  private constructor() {
    // Initialize the event emitter
    
    this.eventEmitter = new NativeEventEmitter(NativeModules.ReactAmwalPay);
  }
  
  static getInstance(): AmwalPaySDK {
    if (!AmwalPaySDK.instance) {
      AmwalPaySDK.instance = new AmwalPaySDK();
    }
    return AmwalPaySDK.instance;
  }
  
  /**
   * Initiates the payment process by first fetching a session token and then starting the payment flow
   * @param config The payment configuration
   */
  async startPayment(config: Omit<AmwalPayConfig, 'sessionToken'>): Promise<void> {
    try {
      // Set up event listeners before starting the payment process
      this.setupEventListeners(config);
      
      // Get network client instance
      const networkClient = NetworkClient.getInstance();
      
      // Fetch session token
      const sessionToken = await networkClient.fetchSessionToken(
        config.environment,
        config.merchantId,
        config.customerId,
        config.secureHash
      );
      
      if (!sessionToken) {
        // If session token is null, the error has already been shown by NetworkClient
        return;
      }
      
      // Create complete config with session token
      const completeConfig: AmwalPayConfig = {
        ...config,
        sessionToken
      };
      
      // Initiate the payment process
      initiate(completeConfig);
    } catch (error) {
      console.error('Error starting payment:', error);
    }
  }

  dispose(): void {
    // Remove all event listeners
    this.removeEventListeners();
  }
  
  /**
   * Sets up event listeners for AmwalPay events
   * @param config The payment configuration containing callback functions
   */
  private setupEventListeners(config: Omit<AmwalPayConfig, 'sessionToken'>): void {
    // Remove any existing listeners
    this.removeEventListeners();
    
    this.onResponseSubscription = onResponse((response) => {
      console.log('Received AmwalPayResponse:', response);
      config.onResponse(response);
    });

    this.onCustomerIdSubscription = onCustomerId((customerId) => {
      console.log('Received customerId:', customerId);
      config.onCustomerId(customerId);
    });
  }
  
  /**
   * Removes all event listeners
   */
  private removeEventListeners(): void {
    this.onResponseSubscription?.remove();
    this.onCustomerIdSubscription?.remove();
    this.onResponseSubscription = null;
    this.onCustomerIdSubscription = null;
  }
}

export default AmwalPaySDK;