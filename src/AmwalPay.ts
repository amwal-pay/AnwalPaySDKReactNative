import { NativeModules, NativeEventEmitter } from 'react-native';
import NetworkClient from './services/NetworkClient';
import SecureHashUtil from './utils/SecureHashUtil';

const { AmwalPaySDK } = NativeModules;

// Convert enums to string literal types with const objects
export type Environment = 'SIT' | 'UAT' | 'PROD';
export const Environment = {
  SIT: 'SIT' as Environment,
  UAT: 'UAT' as Environment,
  PROD: 'PROD' as Environment
};

export type Currency = 'OMR';
export const Currency = {
  OMR: 'OMR' as Currency
};

export type TransactionType = 'NFC' | 'CARD_WALLET' | 'APPLE_PAY';
export const TransactionType = {
  NFC: 'NFC' as TransactionType,
  CARD_WALLET: 'CARD_WALLET' as TransactionType,
  APPLE_PAY: 'APPLE_PAY' as TransactionType
};

export interface AmwalPayConfig {
  environment: Environment;
  secureHash: string;
  currency: Currency;
  amount: string;
  merchantId: string;
  terminalId: string;
  locale: string;
  customerId: string | null;
  transactionType: TransactionType;
  sessionToken?: string;
  onResponse: (response: AmwalPayResponse) => void;
  onCustomerIdResponse: (customerId: string) => void;
}

export interface AmwalPayResponse {
  success: boolean;
  transactionId?: string;
  message?: string;
  error?: string;
}

class AmwalPay {
  private static instance: AmwalPay;
  private eventEmitter: NativeEventEmitter;

  private constructor() {
    this.eventEmitter = new NativeEventEmitter(AmwalPaySDK);
  }

  public static getInstance(): AmwalPay {
    if (!AmwalPay.instance) {
      AmwalPay.instance = new AmwalPay();
    }
    return AmwalPay.instance;
  }

  private async getSessionToken(config: AmwalPayConfig): Promise<string | null> {
    const { environment, merchantId, customerId, secureHash } = config;
    const sessionToken = await NetworkClient.getInstance().fetchSessionToken(
      environment,
      merchantId,
      customerId,
      secureHash,
    );
    return sessionToken;
  }

  public async start(amwalPayConfig: AmwalPayConfig): Promise<void> {
   
    const token = await this.getSessionToken(amwalPayConfig);
    console.log(token);

    if (token) {
      amwalPayConfig.sessionToken = token;

      try {
        // Initialize the AmwalPay SDK
        await AmwalPaySDK.initialize(amwalPayConfig);

        // Register event listeners
        this.registerEventListeners(amwalPayConfig);
      } catch (error) {
        throw new Error(`Failed to initialize AmwalPay SDK: ${error}`);
      }
    }
  }

  private registerEventListeners(amwalPayConfig: AmwalPayConfig): void {
    this.eventEmitter.addListener('AmwalPayEvent', async (event) => {
      if (event.type === 'onResponse') {
        amwalPayConfig.onResponse(event.data as AmwalPayResponse);
      } else if (event.type === 'onCustomerId') {
        amwalPayConfig.onCustomerIdResponse(event.data as string);
      }
    });
  }

  public removeEventListeners(): void {
    this.eventEmitter.removeAllListeners('AmwalPayEvent');
  }
}

export default AmwalPay;
