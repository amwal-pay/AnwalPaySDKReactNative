import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';
import type { EventEmitter } from 'react-native/Libraries/Types/CodegenTypes';

export enum Environment {
  SIT = 'SIT',
  UAT = 'UAT',
  PROD = 'PROD'
}

export enum Currency {
  OMR = 'OMR',
}

export enum TransactionType {
  NFC= 'NFC' ,
  CARD_WALLET= 'CARD_WALLET',
  APPLE_PAY= 'APPLE_PAY'
}

export interface AmwalPayResponse {
  status: string;
  message: string;
  data?: Object; // Changed from 'any' to 'Object'
}

// This interface is for JavaScript side only, not for the native module spec
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
  transactionId?: string;
  additionValues?: { [key: string]: string };
  merchantReference?: string;
  onResponse: (response: AmwalPayResponse) => void;
  onCustomerId: (customerId: string) => void;
}

// This is the configuration that will be passed to the native module
export interface AmwalPayNativeConfig {
  environment: string;
  secureHash: string;
  currency: string;
  amount: string;
  merchantId: string;
  terminalId: string;
  locale: string;
  customerId: string | null;
  transactionType: string;
  sessionToken?: string;
  transactionId?: string;
  additionValues?: { [key: string]: string };
  merchantReference?: string;
}

export interface Spec extends TurboModule {
  // Change the parameter type to AmwalPayNativeConfig
  initiate(config: AmwalPayNativeConfig): void;
  onResponse: EventEmitter<AmwalPayResponse>,
  onCustomerId: EventEmitter<string>,
}

export default TurboModuleRegistry.getEnforcing<Spec>('ReactAmwalPay');
