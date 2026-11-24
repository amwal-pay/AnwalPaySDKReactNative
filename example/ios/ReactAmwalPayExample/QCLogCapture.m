#import <React/RCTBridgeModule.h>

// Exposes QCLogCapture.swift (example app only) to JS as NativeModules.QCLogCapture.
@interface RCT_EXTERN_MODULE(QCLogCapture, NSObject)

RCT_EXTERN_METHOD(getNativeLogs:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(getApplePayDiagnostics:(RCTPromiseResolveBlock)resolve
                  rejecter:(RCTPromiseRejectBlock)reject)

RCT_EXTERN_METHOD(clearNativeLogs)

@end
