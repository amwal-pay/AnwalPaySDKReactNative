import Foundation
import amwalsdk
import React

@objc(ReactAmwalPay)
class ReactAmwalPay: RCTEventEmitter {
    private var hasListeners = false
    
    private func mapEnvironment(environment: String) -> Config.Environment {
        switch environment {
        case "PROD": return .PROD
        case "UAT": return .UAT
        case "SIT": return .SIT
        default: return .PROD
        }
    }
    
    private func mapCurrency(currency: String) -> Config.Currency {
        switch currency {
        case "OMR": return .OMR
        default: return .OMR
        }
    }
    
    private func mapTransactionType(transactionType: String) -> Config.TransactionType {
        switch transactionType {
        case "CARD_WALLET": return .cardWallet
        case "NFC": return .nfc
        case "APPLE_PAY": return .applePay
        default: return .cardWallet
        }
    }
    
    private func mapLocale(locale: String) -> Config.Locale {
        switch locale {
        case "en": return .en
        case "ar": return .ar
        default: return .en
        }
    }
    
    private var onResponseCallback: RCTResponseSenderBlock?
    private var onCustomerIdCallback: RCTResponseSenderBlock?
    private func prepareConfig(config: [String: Any]) -> Config {
        return Config(
            environment: mapEnvironment(environment: config["environment"] as? String ?? "PROD"),
            sessionToken: config["sessionToken"] as? String ?? "",
            currency: mapCurrency(currency: config["currency"] as? String ?? "OMR"),
            amount: config["amount"] as? String ?? "",
            merchantId: config["merchantId"] as? String ?? "",
            terminalId: config["terminalId"] as? String ?? "",
            customerId: config["customerId"] as? String,
            locale: mapLocale(locale: config["locale"] as? String ?? "en"),
            transactionType: mapTransactionType(transactionType: config["transactionType"] as? String ?? "CARD_WALLET")
        )
    }
    
    @objc
    func initiate(_ config: [String: Any],
                 resolver resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
      DispatchQueue.main.async {
           do {
               let sdkConfig = self.prepareConfig(config: config)
               let sdk = AmwalSDK()
               
               guard let rootVC = UIApplication.shared.keyWindow?.rootViewController else {
                   reject("NO_ROOT_VC", "No root view controller found", nil)
                   return
               }
               
               let sdkVC = try sdk.createViewController(
                   config: sdkConfig,
                   onResponse: { [weak self] response in
                                         self?.onResponseCallback?([[
                                             "status": response != nil ? "success" : "error",
                                             "message": response != nil ? "Transaction completed" : "Transaction failed",
                                             "data": response ?? ""
                                         ]])
                                     },
                   onCustomerId: { [weak self] customerId in
                     self?.onCustomerIdCallback?([customerId])
                                       }
               )
               
               // Present modally (critical missing piece)
               rootVC.present(sdkVC, animated: true)
               
               resolve(true)
           } catch {
               print("Presentation failed: \(error.localizedDescription)")
               reject("PRESENTATION_ERROR", error.localizedDescription, error)
           }
       }
    }
    
  @objc
  func onResponse(_ callback: @escaping RCTResponseSenderBlock) {
      onResponseCallback = callback
  }
  
  @objc
  func onCustomerId(_ callback: @escaping RCTResponseSenderBlock) {
      onCustomerIdCallback = callback
  }
  
    
    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
