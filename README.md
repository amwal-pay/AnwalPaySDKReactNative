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

#### 3.5 Apple Pay Setup (Required for `APPLE_PAY` transactions)

Apple Pay will **not** work without the In-App Payments capability. If it is missing, the SDK aborts with
`Digital wallet payments are not available on this device` as soon as you tap **Start Payment**, because
PassKit cannot read the user's provisioned cards.

1. **Register a Merchant ID** in the [Apple Developer portal](https://developer.apple.com/account/resources/identifiers/list/merchant)
   (Certificates, Identifiers & Profiles → Identifiers → Merchant IDs) under the team that signs your app.
2. **Enable the capability** in Xcode: select your app target → *Signing & Capabilities* → **+ Capability** →
   **Apple Pay**, then tick your Merchant ID. This writes `com.apple.developer.in-app-payments` into your
   `.entitlements` file:

   ```xml
   <key>com.apple.developer.in-app-payments</key>
   <array>
     <string>merchant.applepay.amwalpay</string>
   </array>
   ```

3. **Attach an Apple Pay Payment Processing Certificate** to that Merchant ID, and make sure the Amwal
   backend for the environment you are testing (SIT / UAT / PROD) holds the matching private key. A Merchant
   ID that is merely registered will pass `canMakePayments`, but the payment sheet cannot be authorized —
   this is the usual reason Apple Pay works in one sample app and not another on the *same* phone. The
   bundled example uses `merchant.shahd.test`, the same test Merchant ID as the Flutter SDK example.

4. **Pass the same Merchant ID to the SDK** via `additionValues.merchantIdentifier`. It defaults to
   `merchant.applepay.amwalpay`, so override it if you registered a different one:

   ```js
   await AmwalPaySDK.getInstance().startPayment({
     // ...
     transactionType: TransactionType.APPLE_PAY,
     additionValues: {
       merchantIdentifier: 'merchant.your.id', // must match the entitlement
     },
   });
   ```

5. **Regenerate the provisioning profile** after adding the capability or changing the Merchant ID list
   (Xcode does this automatically with automatic signing), then rebuild. A stale profile fails the build with
   *"Provisioning profile ... doesn't support the merchant.your.id Merchant ID"* or *"... doesn't match the
   entitlements file's value for the com.apple.developer.in-app-payments entitlement"*.

**Testing notes**

- Test on a **physical device** with a card already added to Wallet. The Amwal SDK's `Release` subspec is
  required for devices, and the SDK only accepts cards on the `visa`, `masterCard`, `amex` and `discover`
  networks — a Wallet with none of those also yields "not available on this device".
- Apple Pay is only offered for the digital-wallet transaction types. `TransactionType.APPLE_PAY` and
  `TransactionType.GOOGLE_PAY` are interchangeable: each native bridge resolves the wallet for the platform
  it runs on (Apple Pay on iOS, Google Pay on Android), mirroring the Flutter SDK's single
  `TransactionType.appleOrGooglePay`. One shared JS config therefore drives both platforms.

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
- **"Digital wallet payments are not available on this device"**: the Apple Pay capability is missing,
  the Merchant ID in the entitlement does not match `additionValues.merchantIdentifier`, or the device has
  no supported card in Wallet — see [3.5 Apple Pay Setup](#35-apple-pay-setup-required-for-apple_pay-transactions)

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
    useBottomSheetDesign: 'true', // use bottom sheet design (v2)
    primaryColor: '#FF5733', // custom primary color
    secondaryColor: '#33FF57', // custom secondary color
    ignoreReceipt: 'false' // show receipt after transaction
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

### Available Configuration Options

You can customize the SDK behavior using the following `additionValues` keys:

#### UI Customization
- **`useBottomSheetDesign`**: `'true'` | `'false'` (default: `'false'`)
  - Controls the payment screen design
  - `'true'`: Uses the newer bottom sheet design (v2)
  - `'false'`: Uses the original full-screen design

- **`primaryColor`**: Hex color string (e.g., `'#FF5733'`)
  - Sets the primary theme color for the SDK UI

- **`secondaryColor`**: Hex color string (e.g., `'#33FF57'`)
  - Sets the secondary theme color for the SDK UI

#### Payment Flow
- **`ignoreReceipt`**: `'true'` | `'false'` (default: `'false'`)
  - Controls whether to show the receipt screen after transaction
  - `'true'`: Skips the receipt display
  - `'false'`: Shows the receipt screen

- **`merchantIdentifier`**: String (default: `'merchant.applepay.amwalpay'`)
  - Apple Pay merchant identifier for iOS

### Usage Examples

```js
// Using default additionValues (automatically applied)
const config = {
  // ... other configuration
  // additionValues will automatically include merchantIdentifier
};

// Using custom additionValues with UI customization
const customConfig = {
  // ... other configuration
  additionValues: {
    useBottomSheetDesign: 'true',
    primaryColor: '#FF5733',
    secondaryColor: '#33FF57',
    ignoreReceipt: 'false',
    merchantIdentifier: 'merchant.custom.identifier'
  }
};

// Minimal configuration with bottom sheet design
const minimalConfig = {
  // ... other configuration
  additionValues: {
    useBottomSheetDesign: 'true'
  }
};
```

Custom `additionValues` will be merged with defaults, with custom values taking precedence.

**Note:** All boolean values should be passed as strings (`'true'` or `'false'`).

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
