import ReactAmwalPay, {
  Environment,
  Currency,
  TransactionType,
  type AmwalPayResponse,
  type AmwalPayConfig,
  type AmwalPayNativeConfig,
} from './NativeReactAmwalPay';
import AmwalPaySDK from './AmwalPaySDK';
import { UuidUtil } from './utils/UuidUtil';
import {
  NativeEventEmitter,
  type EventSubscription,
} from 'react-native';

// Create an event emitter for the native module
const eventEmitter = new NativeEventEmitter(ReactAmwalPay as any);

export function initiate(config: AmwalPayConfig): void {
  // Create default additionValues with merchantIdentifier for iOS if not provided
  const defaultAdditionValues = {
    merchantIdentifier: 'merchant.applepay.amwalpay',
  };

  const finalAdditionValues = {
    ...defaultAdditionValues,
    ...config.additionValues,
  };

  const nativeConfig: AmwalPayNativeConfig = {
    environment: config.environment,
    secureHash: config.secureHash,
    currency: config.currency,
    amount: config.amount,
    merchantId: config.merchantId,
    terminalId: config.terminalId,
    locale: config.locale,
    customerId: config.customerId,
    transactionType: config.transactionType,
    sessionToken: config.sessionToken,
    transactionId: config.transactionId ?? UuidUtil.generateTransactionId(),
    additionValues: finalAdditionValues,
    merchantReference: config.merchantReference,
  };

  // Call the native module
  ReactAmwalPay.initiate(nativeConfig);
}

export function onResponse(callback: (response: AmwalPayResponse) => void): EventSubscription {
  return eventEmitter.addListener('onResponse', callback);
}
export function onCustomerId(callback: (customerId: string) => void): EventSubscription {
  return eventEmitter.addListener('onCustomerId', callback);
}

export {
  Environment,
  Currency,
  TransactionType,
  type AmwalPayResponse,
  type AmwalPayConfig,
  AmwalPaySDK,
  UuidUtil,
};
