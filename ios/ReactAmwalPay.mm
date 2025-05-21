#import "ReactAmwalPay.h"
#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>
#import <React/RCTUtils.h>
#import <amwalsdk/amwalsdk.h>

@implementation ReactAmwalPay
RCT_EXPORT_MODULE()

- (std::shared_ptr<facebook::react::TurboModule>)getTurboModule:
    (const facebook::react::ObjCTurboModule::InitParams &)params
{
    return std::make_shared<facebook::react::NativeReactAmwalPaySpecJSI>(params);
}

- (AmwalEnvironment)getEnvironmentFromString:(NSString *)env {
    if ([env isEqualToString:@"PROD"]) {
        return AmwalEnvironmentPROD;
    } else if ([env isEqualToString:@"UAT"]) {
        return AmwalEnvironmentUAT;
    }
    return AmwalEnvironmentSIT;
}

- (AmwalLocale)getLocaleFromString:(NSString *)locale {
    if ([locale isEqualToString:@"ar"]) {
        return AmwalLocaleAr;
    }
    return AmwalLocaleEn;
}

- (AmwalTransactionType)getTransactionTypeFromString:(NSString *)type {
    if ([type isEqualToString:@"NFC"]) {
        return AmwalTransactionTypeNFC;
    } else if ([type isEqualToString:@"APPLE_PAY"]) {
        return AmwalTransactionTypeApplePay;
    }
    return AmwalTransactionTypeCardWallet;
}

- (void)initiate:(JS::NativeReactAmwalPay::AmwalPayNativeConfig &)config {
    dispatch_async(dispatch_get_main_queue(), ^{
        UIViewController *rootViewController = RCTPresentedViewController();
        if (!rootViewController) {
            [self sendErrorEvent:@"Activity context is not available"];
            return;
        }
        
        @try {
            // Get values using method calls
            NSString *sessionToken = config.sessionToken();
            NSString *amount = config.amount();
            NSString *merchantId = config.merchantId();
            NSString *terminalId = config.terminalId();
            NSString *customerId = config.customerId();
            NSString *environment = config.environment();
            NSString *locale = config.locale();
            NSString *transactionType = config.transactionType();
            
            // Create config object with all required parameters
            Config *sdkConfig = [[Config alloc] initWithEnvironment:[self getEnvironmentFromString:environment]
                                                     sessionToken:sessionToken
                                                        currency:AmwalCurrencyOMR
                                                         amount:amount
                                                     merchantId:merchantId
                                                     terminalId:terminalId
                                                     customerId:customerId
                                                         locale:[self getLocaleFromString:locale]
                                                transactionType:[self getTransactionTypeFromString:transactionType]];
            
            // Initialize AmwalSDK
            AmwalSDK *amwalSDK = [[AmwalSDK alloc] init];
            
            // Create and present the payment view controller
            NSError *error = nil;
            UIViewController *paymentVC = [amwalSDK createViewControllerWithConfig:sdkConfig
                                                                      onResponse:^(NSString * _Nullable response) {
                if (response) {
                    [self sendResponseEvent:@{@"response": response}];
                }
            }
                                                                    onCustomerId:^(NSString *customerId) {
                [self sendCustomerIdEvent:customerId];
            }
                                                                          error:&error];
            
            if (error) {
                [self sendErrorEvent:error.localizedDescription];
                return;
            }
            
            if (paymentVC) {
                [rootViewController presentViewController:paymentVC animated:YES completion:nil];
            } else {
                [self sendErrorEvent:@"Failed to create payment view controller"];
            }
            
        } @catch (NSException *exception) {
            [self sendErrorEvent:exception.reason];
        }
    });
}

#pragma mark - Helper Methods

- (void)sendResponseEvent:(NSDictionary *)response {
    NSMutableDictionary *params = [NSMutableDictionary dictionary];
    params[@"type"] = @"onResponse";
    params[@"data"] = response;
    
    [self sendEventWithName:@"AmwalPayEvent" body:params];
}

- (void)sendCustomerIdEvent:(NSString *)customerId {
    NSMutableDictionary *params = [NSMutableDictionary dictionary];
    params[@"type"] = @"onCustomerId";
    params[@"data"] = customerId;
    
    [self sendEventWithName:@"AmwalPayEvent" body:params];
}

- (void)sendErrorEvent:(NSString *)errorMessage {
    NSMutableDictionary *params = [NSMutableDictionary dictionary];
    params[@"type"] = @"onResponse";
    
    NSMutableDictionary *errorData = [NSMutableDictionary dictionary];
    errorData[@"status"] = @"ERROR";
    errorData[@"message"] = errorMessage;
    
    params[@"data"] = errorData;
    
    [self sendEventWithName:@"AmwalPayEvent" body:params];
}

// Add this to ensure the module is properly initialized
+ (BOOL)requiresMainQueueSetup
{
    return YES;
}

@end
