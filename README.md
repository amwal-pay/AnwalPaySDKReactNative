# react-amwal-pay

A React Native library for integrating Amwal Pay payment gateway into your React Native applications.

## Installation

### Prerequisites

- React Native project (0.79+)
- Node.js 18 or higher
- iOS: Xcode and CocoaPods installed
- Android: Android Studio and JDK installed

### Step 1: Install the Package

```sh
npm install react-amwal-pay
# or
yarn add react-amwal-pay
```

### Step 2: Configure React Native (Required)

Create or update `react-native.config.js` in your project root:

```javascript
const path = require('path');
const pkg = require('react-amwal-pay/package.json');

module.exports = {
  project: {
    ios: {
      automaticPodsInstallation: true,
    },
  },
  dependencies: {
    [pkg.name]: {
      root: path.join(__dirname, 'node_modules/react-amwal-pay'),
      platforms: {
        ios: {},
        android: {},
      },
    },
  },
};
```

### Step 3: iOS Setup

#### 3.1 Update Podfile

Add the following configuration to your `ios/Podfile` inside the `post_install` block:

```ruby
post_install do |installer|
  react_native_post_install(installer, config[:reactNativePath])
  
  # Set "Build Libraries for Distribution" to NO for amwalsdk
  installer.pods_project.targets.each do |target|
    if target.name == 'amwalsdk'
      target.build_configurations.each do |config|
        config.build_settings['BUILD_LIBRARY_FOR_DISTRIBUTION'] = 'NO'
        config.build_settings['EXCLUDED_ARCHS[sdk=iphonesimulator*]'] = 'x86_64'
      end
    end
  end
end
```

#### 3.2 Install Pods

```bash
cd ios
pod install
cd ..
```

#### 3.3 iOS Build Setting (Manual Step)

After pod installation, you need to set "Build Libraries for Distribution" to NO in Xcode:

1. Open your iOS project in Xcode
2. Go to Pods project
3. Select amwalsdk target
4. In Build Settings, search for "Build Libraries for Distribution"
5. Set it to NO

![Build Libraries Setting](https://github.com/amwal-pay/AnwalPaySDKReactNative/raw/master/docs/images/ios_install_note.png)

#### 3.4 Configuring amwalsdk Subspec (Optional)

The library uses amwalsdk as a dependency and supports both Release and Debug subspecs. By default, it uses the Debug subspec. To change this, you can set the `AMWAL_SUBSPEC` environment variable in your Podfile:

```ruby
# In your Podfile
ENV['AMWAL_SUBSPEC'] = 'Release' # or 'Debug'
```

Or you can set it when running pod install:

```bash
AMWAL_SUBSPEC=Release pod install
```

### Step 4: Android Setup

No additional Android configuration is required. The SDK uses React Native's autolinking feature.

**Note:** The SDK requires minimum SDK 24 (Android 7.0). Ensure your `android/build.gradle` has:

```gradle
minSdkVersion = 24
```

### Step 5: Clean and Rebuild

After installation, clean and rebuild your project:

```bash
# iOS
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..

# Android
cd android
./gradlew clean
cd ..

# Rebuild your app
npm run ios
# or
npm run android
```

### Troubleshooting

- **Pods fail to install**: Clean pods and reinstall (`rm -rf Pods Podfile.lock && pod install`)
- **Linking issues**: Ensure `react-native.config.js` is in your project root
- **Build errors**: Clean build folders and rebuild your project
- **iOS build errors**: Verify that "Build Libraries for Distribution" is set to NO for amwalsdk target

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
  merchantReference: 'optional-merchant-reference', // optional: merchant reference for transaction tracking
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
- `merchantReference`: (Optional) Merchant reference for transaction tracking
- `additionValues`: (Optional) Custom key-value pairs for SDK configuration (includes merchantIdentifier for Apple Pay)
- `onCustomerId`: (Optional) Callback function for customer ID updates
- `onResponse`: (Optional) Callback function for payment response

## Contributing

See the [contributing guide](CONTRIBUTING.md) to learn how to contribute to the repository and the development workflow.

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
