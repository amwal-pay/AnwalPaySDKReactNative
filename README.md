# react-amwal-pay

A React Native library for integrating Amwal Pay payment gateway into your React Native applications.

## Installation

```sh
npm install react-amwal-pay
```

## Usage

```js
import {
  AmwalPaySDK,
  Environment,
  Currency,
  TransactionType,
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
- `onCustomerId`: (Optional) Callback function for customer ID updates
- `onResponse`: (Optional) Callback function for payment response

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
