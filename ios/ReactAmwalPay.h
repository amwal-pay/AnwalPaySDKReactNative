#import <ReactAmwalPaySpec/ReactAmwalPaySpec.h>
#import <React/RCTEventEmitter.h>
#import <amwalsdk/amwalsdk.h>

@interface ReactAmwalPay : RCTEventEmitter <NativeReactAmwalPaySpec>

- (AmwalEnvironment)getEnvironmentFromString:(NSString *)env;
- (AmwalLocale)getLocaleFromString:(NSString *)locale;
- (AmwalTransactionType)getTransactionTypeFromString:(NSString *)type;
- (void)sendResponseEvent:(NSDictionary *)response;
- (void)sendCustomerIdEvent:(NSString *)customerId;
- (void)sendErrorEvent:(NSString *)errorMessage;

@end
