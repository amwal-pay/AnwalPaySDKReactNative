# AmwalPay SDK Logging

The AmwalPay React Native SDK now includes comprehensive logging functionality to help developers debug and monitor SDK operations.

## Features

### Logger Utility

The SDK includes a centralized `Logger` utility that provides:

- **Multiple Log Levels**: DEBUG, INFO, WARN, ERROR
- **Structured Logging**: Consistent format with timestamps and tags
- **Log Storage**: In-memory storage of log entries for debugging
- **Export Functionality**: Export logs as JSON for analysis
- **Debug Mode Control**: Enable/disable debug logging

### Log Levels

```typescript
import { LogLevel } from 'react-amwal-pay';

enum LogLevel {
  DEBUG = 0,  // Detailed debugging information
  INFO = 1,   // General information
  WARN = 2,   // Warning messages
  ERROR = 3,  // Error messages
}
```

## Usage

### Basic Logging

```typescript
import { Logger } from 'react-amwal-pay';

const logger = Logger.getInstance();

// Enable debug mode (default: enabled in __DEV__)
logger.setDebugEnabled(true);

// Set minimum log level
logger.setLogLevel(LogLevel.INFO);

// Log messages
logger.debug('MyComponent', 'Debug message', { data: 'value' });
logger.info('MyComponent', 'Info message');
logger.warn('MyComponent', 'Warning message');
logger.error('MyComponent', 'Error message', error);
```

### SDK Integration

The AmwalPaySDK automatically uses the Logger for internal operations:

```typescript
import { AmwalPaySDK } from 'react-amwal-pay';

const sdk = AmwalPaySDK.getInstance();

// Enable debug logging for SDK operations
sdk.setDebugEnabled(true);

// Get SDK logs
const logs = sdk.getLogs();
console.log('SDK Logs:', logs);

// Clear SDK logs
sdk.clearLogs();
```

### Log Management

```typescript
import { Logger } from 'react-amwal-pay';

const logger = Logger.getInstance();

// Get all logs
const allLogs = logger.getLogs();

// Get logs by level
const errorLogs = logger.getLogsByLevel(LogLevel.ERROR);

// Get logs by tag
const sdkLogs = logger.getLogsByTag('AmwalPaySDK');

// Export logs as JSON
const logsJson = logger.exportLogs();

// Clear all logs
logger.clearLogs();
```

## Log Entry Structure

Each log entry contains:

```typescript
interface LogEntry {
  timestamp: string;    // ISO timestamp
  level: LogLevel;      // Log level
  tag: string;          // Component/module tag
  message: string;      // Log message
  data?: any;          // Optional additional data
}
```

## SDK Logging Tags

The SDK uses the following tags for different components:

- `AmwalPaySDK`: Main SDK operations
- `NetworkClient`: Network requests and responses
- `PaymentScreen`: Example app payment screen (in example app)

## Example Output

```
[AmwalPay][INFO][AmwalPaySDK] SDK instance created
[AmwalPay][INFO][AmwalPaySDK] Starting payment process {"merchantId":"84131","environment":"SIT"}
[AmwalPay][DEBUG][NetworkClient] Making API request {"url":"https://test.amwalpg.com:24443/Membership/GetSDKSessionToken"}
[AmwalPay][INFO][NetworkClient] Session token fetched successfully
[AmwalPay][INFO][AmwalPaySDK] Payment process initiated successfully
```

## Best Practices

1. **Use Appropriate Log Levels**: Use DEBUG for detailed information, INFO for general flow, WARN for potential issues, ERROR for actual problems.

2. **Include Context**: Add relevant data to log entries to help with debugging.

3. **Use Descriptive Tags**: Use clear, consistent tags to identify log sources.

4. **Monitor Log Storage**: The logger stores up to 1000 log entries by default. Clear logs periodically if needed.

5. **Debug Mode**: Enable debug mode during development, disable in production for performance.

## Configuration

The Logger can be configured globally:

```typescript
import { Logger, LogLevel } from 'react-amwal-pay';

const logger = Logger.getInstance();

// Configure for production
logger.setDebugEnabled(false);
logger.setLogLevel(LogLevel.WARN);

// Configure for development
logger.setDebugEnabled(true);
logger.setLogLevel(LogLevel.DEBUG);
```

## Integration with Existing Logging

The SDK Logger can work alongside your existing logging solutions:

```typescript
import { Logger } from 'react-amwal-pay';

const logger = Logger.getInstance();

// Get logs and send to your logging service
const logs = logger.getLogs();
yourLoggingService.send(logs);

// Clear SDK logs after sending
logger.clearLogs();
```