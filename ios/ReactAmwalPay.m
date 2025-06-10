#import <React/RCTBridgeModule.h>
#import <React/RCTEventEmitter.h>

@interface RCT_EXTERN_MODULE(ReactAmwalPay, RCTEventEmitter)

RCT_EXTERN_METHOD(initiate:(NSDictionary *)config
                  resolver:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(onResponse:(RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(onCustomerId:(RCTResponseSenderBlock)callback)

@end
