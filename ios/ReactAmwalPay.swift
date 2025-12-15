import Foundation
import amwalsdk
import React

@objc(ReactAmwalPay)
class ReactAmwalPay: RCTEventEmitter {
    private var hasListeners = false

    override func supportedEvents() -> [String]! {
        return ["onResponse", "onCustomerId"]
    }

    override func startObserving() {
        hasListeners = true
    }

    override func stopObserving() {
        hasListeners = false
    }

    private func sendEvent(_ eventName: String, body: Any?) {
        if hasListeners {
            sendEvent(withName: eventName, body: body)
        }
    }

    private func emitOnResponse(_ params: [String: Any]) {
        sendEvent("onResponse", body: params)
    }

    private func emitOnCustomerId(_ customerId: String?) {
        sendEvent("onCustomerId", body: customerId)
    }

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
    
    private func prepareConfig(config: [String: Any]) -> Config {
        // Handle additionValues
        var additionValues: [String: String] = Config.generateDefaultAdditionValues()
        if let configAdditionValues = config["additionValues"] as? [String: String] {
            // Merge with default values, allowing override
            for (key, value) in configAdditionValues {
                additionValues[key] = value
            }
        }
        
        return Config(
            environment: mapEnvironment(environment: config["environment"] as? String ?? "PROD"),
            sessionToken: config["sessionToken"] as? String ?? "",
            currency: mapCurrency(currency: config["currency"] as? String ?? "OMR"),
            amount: config["amount"] as? String ?? "",
            merchantId: config["merchantId"] as? String ?? "",
            terminalId: config["terminalId"] as? String ?? "",
            customerId: config["customerId"] as? String,
            locale: mapLocale(locale: config["locale"] as? String ?? "en"),
            transactionType: mapTransactionType(transactionType: config["transactionType"] as? String ?? "CARD_WALLET"),
            transactionId: config["transactionId"] as? String ?? Config.generateTransactionId(),
            additionValues: additionValues,
            merchantReference: config["merchantReference"] as? String
        )
    }
    
    @objc
    func initiate(_ config: [String: Any]) {
      DispatchQueue.main.async {
           do {
               let sdkConfig = self.prepareConfig(config: config)
               let sdk = AmwalSDK()

               guard let rootVC = UIApplication.shared.keyWindow?.rootViewController else {
                   let errorData: [String: Any] = [
                       "data": [
                           "status": "ERROR",
                           "message": "No root view controller found"
                       ]
                   ]
                   self.emitOnResponse(errorData)
                   return
               }

               let sdkVC = try sdk.createViewController(
                   config: sdkConfig,
                   onResponse: { [weak self] response in
                       let responseData: [String: Any] = [
                           "data": [
                               "status": response != nil ? "success" : "error",
                               "message": response != nil ? "Transaction completed" : "Transaction failed",
                               "data": response ?? ""
                           ]
                       ]
                       self?.emitOnResponse(responseData)
                   },
                   onCustomerId: { [weak self] customerId in
                       self?.emitOnCustomerId(customerId)
                   }
               )

               // Present modally (critical missing piece)
               rootVC.present(sdkVC, animated: true)
           } catch {
               print("Presentation failed: \(error.localizedDescription)")
               let errorData: [String: Any] = [
                   "data": [
                       "status": "ERROR",
                       "message": error.localizedDescription
                   ]
               ]
               self.emitOnResponse(errorData)
           }
       }
    }
    
    @objc
    func addListener(_ eventName: String) {
        // Required for RN built in Event Emitter Calls.
    }

    @objc
    func removeListeners(_ count: Double) {
        // Required for RN built in Event Emitter Calls.
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
