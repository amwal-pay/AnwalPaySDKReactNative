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
import Logger, { LogLevel, type LogEntry } from './utils/Logger';
import { NativeEventEmitter, type EventSubscription } from 'react-native';

// Create an event emitter for the native module
const eventEmitter = new NativeEventEmitter(ReactAmwalPay as any);

export function initiate(config: AmwalPayConfig): void {
  console.log('🟠 [index.tsx] initiate function called');

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

  console.log(
    '🟠 [index.tsx] Native config prepared:',
    JSON.stringify(nativeConfig, null, 2)
  );
  console.log('🟠 [index.tsx] About to call ReactAmwalPay.initiate');

  try {
    // Call the native module
    ReactAmwalPay.initiate(nativeConfig);
    console.log('🟢 [index.tsx] ReactAmwalPay.initiate call completed');
  } catch (error) {
    console.log('🔴 [index.tsx] Error calling ReactAmwalPay.initiate:', error);
    throw error;
  }
}

export function onResponse(
  callback: (response: AmwalPayResponse) => void
): EventSubscription {
  return eventEmitter.addListener('onResponse', callback);
}
export function onCustomerId(
  callback: (customerId: string) => void
): EventSubscription {
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
  Logger,
  LogLevel,
  type LogEntry,
};
