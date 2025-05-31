# react-amwal-pay

A React Native library for integrating Amwal Pay payment gateway into your React Native applications.

## Installation

```sh
npm install react-amwal-pay
```

## Usage

```js
import {
  initiate,
  onResponse,
  onCustomerId,
  Environment,
  Currency,
  TransactionType,
  type AmwalPayConfig,
  type AmwalPayResponse
} from 'react-amwal-pay';

// Configure Amwal Pay
const config: AmwalPayConfig = {
  environment: Environment.SANDBOX, // or Environment.PRODUCTION
  secureHash: 'your-secure-hash',
  currency: Currency.KWD, // or other supported currencies
  amount: '100.000',
  merchantId: 'your-merchant-id',
  terminalId: 'your-terminal-id',
  locale: 'en', // or 'ar'
  customerId: 'customer-id',
  transactionType: TransactionType.PURCHASE,
  sessionToken: 'your-session-token'
};

// Initialize payment
initiate(config);

// Listen for payment response
const responseSubscription = onResponse((response: AmwalPayResponse) => {
  console.log('Payment Response:', response);
  // Handle the payment response
});

// Listen for customer ID updates
const customerIdSubscription = onCustomerId((customerId: string) => {
  console.log('Customer ID:', customerId);
  // Handle customer ID updates
});

// Don't forget to clean up subscriptions when component unmounts
// responseSubscription.remove();
// customerIdSubscription.remove();
```

## Configuration

The `AmwalPayConfig` interface includes the following properties:

- `environment`: The environment to use (SANDBOX or PRODUCTION)
- `secureHash`: Your secure hash for authentication
- `currency`: The currency for the transaction (e.g., KWD)
- `amount`: The transaction amount
- `merchantId`: Your merchant ID
- `terminalId`: Your terminal ID
- `locale`: The language locale ('en' or 'ar')
- `customerId`: The customer's ID
- `transactionType`: The type of transaction (e.g., PURCHASE)
- `sessionToken`: Your session token

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
