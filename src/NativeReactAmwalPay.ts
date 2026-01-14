import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export enum Environment {
  SIT = 'SIT',
  UAT = 'UAT',
  PROD = 'PROD',
}

export enum Currency {
  OMR = 'OMR',
}

export enum TransactionType {
  NFC = 'NFC',
  CARD_WALLET = 'CARD_WALLET',
  APPLE_PAY = 'APPLE_PAY',
}

export interface AmwalPayResponse {
  status: string;
  message: string;
  data?: Object; // Changed from 'any' to 'Object'
}

/**
 * Configuration interface for Amwal Pay SDK
 *
 * @interface AmwalPayConfig
 * @description Complete configuration for initializing and starting a payment session
 */
export interface AmwalPayConfig {
  /** Target environment (SIT, UAT, or PROD) */
  environment: Environment;
  /** Secure hash for authentication */
  secureHash: string;
  /** Transaction currency */
  currency: Currency;
  /** Transaction amount as string (e.g., "100.000") */
  amount: string;
  /** Merchant identifier */
  merchantId: string;
  /** Terminal identifier */
  terminalId: string;
  /** Locale for UI language ('en' or 'ar') */
  locale: string;
  /** Optional customer identifier */
  customerId: string | null;
  /** Type of transaction (NFC, CARD_WALLET, APPLE_PAY) */
  transactionType: TransactionType;
  /** Optional session token (auto-fetched if not provided) */
  sessionToken?: string;
  /** Optional transaction ID (auto-generated if not provided) */
  transactionId?: string;
  /**
   * Optional additional configuration values
   *
   * Supported keys:
   * - `useBottomSheetDesign`: 'true' | 'false' - Use bottom sheet design (v2) instead of full screen
   * - `ignoreReceipt`: 'true' | 'false' - Skip receipt display after transaction
   * - `primaryColor`: Hex color string (e.g., '#FF5733') - Primary theme color
   * - `secondaryColor`: Hex color string (e.g., '#33FF57') - Secondary theme color
   * - `merchantIdentifier`: String - Apple Pay merchant identifier (default: 'merchant.applepay.amwalpay')
   *
   * @example
   * ```typescript
   * additionValues: {
   *   useBottomSheetDesign: 'true',
   *   primaryColor: '#1E88E5',
   *   secondaryColor: '#FFC107',
   *   ignoreReceipt: 'false',
   *   merchantIdentifier: 'merchant.applepay.amwalpay'
   * }
   * ```
   */
  additionValues?: { [key: string]: string };
  /** Optional merchant reference for transaction tracking */
  merchantReference?: string;
  /** Callback for payment response */
  onResponse: (response: AmwalPayResponse) => void;
  /** Callback for customer ID updates */
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
  addListener(eventName: string): void;
  removeListeners(count: number): void;
}

export default TurboModuleRegistry.getEnforcing<Spec>('ReactAmwalPay');
