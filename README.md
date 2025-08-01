# react-amwal-pay

A React Native library for integrating Amwal Pay payment gateway into your React Native applications.

## Installation

```sh
npm install react-amwal-pay
```

### iOS Installation Note

After pod installation, you need to set "Build Libraries for Distribution" to NO in Xcode:

1. Open your iOS project in Xcode
2. Go to Pods project
3. Select amwalsdk target
4. In Build Settings, search for "Build Libraries for Distribution"
5. Set it to NO

![Build Libraries Setting](https://github.com/amwal-pay/AnwalPaySDKReactNative/raw/master/docs/images/ios_install_note.png)

#### Configuring amwalsdk Subspec

The library uses amwalsdk as a dependency and supports both Release and Debug subspecs. By default, it uses the Debug subspec. To change this, you can set the `AMWAL_SUBSPEC` environment variable in your Podfile:

```ruby
# In your Podfile
ENV['AMWAL_SUBSPEC'] = 'Release' # or 'Debug'
```

Or you can set it when running pod install:

```bash
AMWAL_SUBSPEC=Release pod install
```

## Usage

```js
import {
  AmwalPaySDK,
  Environment,
  Currency,
  TransactionType,
  UuidUtil,
  type AmwalPayConfig,
  type AmwalPayResponse
} from 'react-amwal-pay';

// Configure Amwal Pay
const config: AmwalPayConfig = {
  environment: Environment.SIT, // or Environment.PRODUCTION
  currency: Currency.OMR, // or other supported currencies
  transactionType: TransactionType.CARD_WALLET,
  locale: 'en', // or 'ar'
  merchantId: '84131',
  terminalId: '811018',
  amount: '1',
  secureHash: '8570CEED656C8818E4A7CE04F22206358F272DAD5F0227D322B654675ABF8F83',
  customerId: 'customer-id', // optional
  sessionToken: 'your-session-token', // optional
  transactionId: 'custom-transaction-id', // optional: auto-generated if not provided
  additionValues: { // optional: custom key-value pairs for SDK configuration
    merchantIdentifier: 'merchant.applepay.amwalpay', // for Apple Pay configuration
    customKey: 'customValue' // add more as needed
  },
  onCustomerId(customerId) {
    console.log('Customer ID:', customerId);
  },
  onResponse(response) {
    console.log('Payment Response:', response);
  }
};

// Initialize and start payment
const handlePayment = async () => {
  try {
    // Validate required fields
    if (!isConfigValid(config)) {
      console.error('Please fill in all required fields');
      return;
    }

    const amwalPay = AmwalPaySDK.getInstance();
    await amwalPay.startPayment(config);
  } catch (error) {
    console.error('Error starting payment:', error);
  }
};

// Helper function to validate config
const isConfigValid = (config: Partial<AmwalPayConfig>): boolean => {
  return Boolean(
    config.environment &&
    config.secureHash &&
    config.currency &&
    config.amount &&
    config.merchantId &&
    config.terminalId &&
    config.locale &&
    config.transactionType
  );
};
```

## UUID Generation

If you need to generate a custom transaction ID, you can use the built-in UUID utility:

```js
import { UuidUtil } from 'react-amwal-pay';

// Generate a UUID for transaction ID
const transactionId = UuidUtil.generateTransactionId();

// Or use the lower-level generator
const uuid = UuidUtil.generateV4();
```

The UUID utility generates lowercase UUIDs in v4 format, ensuring compatibility with the payment system.

## Addition Values Configuration

The SDK supports `additionValues` parameter for passing custom key-value pairs that can be used for various SDK functionalities.

### Default Addition Values

The SDK automatically provides default values:
- `merchantIdentifier`: "merchant.applepay.amwalpay" (used for Apple Pay configuration)

### Usage

```js
// Using default additionValues (automatically applied)
const config = {
  // ... other configuration
  // additionValues will automatically include merchantIdentifier
};

// Using custom additionValues
const customConfig = {
  // ... other configuration
  additionValues: {
    merchantIdentifier: 'merchant.custom.identifier',
    customKey: 'customValue'
  }
};
```

Custom `additionValues` will be merged with defaults, with custom values taking precedence.

## Configuration

The `AmwalPayConfig` interface includes the following properties:

- `environment`: The environment to use (SIT or PRODUCTION)
- `currency`: The currency for the transaction (e.g., OMR)
- `transactionType`: The type of transaction (e.g., CARD_WALLET)
- `locale`: The language locale ('en' or 'ar')
- `merchantId`: Your merchant ID
- `terminalId`: Your terminal ID
- `amount`: The transaction amount
- `secureHash`: Your secure hash for authentication
- `customerId`: (Optional) The customer's ID
- `sessionToken`: (Optional) Your session token
- `transactionId`: (Optional) Unique transaction identifier - auto-generated if not provided
- `additionValues`: (Optional) Custom key-value pairs for SDK configuration (includes merchantIdentifier for Apple Pay)
- `onCustomerId`: (Optional) Callback function for customer ID updates
- `onResponse`: (Optional) Callback function for payment response

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
