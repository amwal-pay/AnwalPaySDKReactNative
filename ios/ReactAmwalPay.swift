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
        print("🔴 startObserving called - setting hasListeners = true")
        hasListeners = true
    }

    override func stopObserving() {
        print("🔴 stopObserving called - setting hasListeners = false")
        hasListeners = false
    }

    private func emitOnResponse(_ params: [String: Any]) {
        print("🔴 emitOnResponse called with params: \(params)")
        print("🔴 hasListeners: \(hasListeners)")
        if hasListeners {
            print("🔴 Sending onResponse event to JS")
            sendEvent(withName: "onResponse", body: params)
        } else {
            print("🔴 NOT sending - no listeners!")
        }
    }

    private func emitOnCustomerId(_ customerId: String?) {
        print("🔴 emitOnCustomerId called with: \(customerId ?? "nil")")
        print("🔴 hasListeners: \(hasListeners)")
        if hasListeners {
            print("🔴 Sending onCustomerId event to JS")
            sendEvent(withName: "onCustomerId", body: customerId)
        } else {
            print("🔴 NOT sending - no listeners!")
        }
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
                       print("🟠 SDK onResponse callback fired!")
                       print("🟠 Response type: \(type(of: response))")
                       print("🟠 Response value: \(response ?? "nil")")

                       // The SDK returns a JSON string, we need to parse it
                       if let responseString = response as? String,
                          let data = responseString.data(using: .utf8),
                          let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                           print("🟠 Successfully parsed JSON string to dictionary")
                           self?.emitOnResponse(json)
                       } else if let responseDict = response as? [String: Any] {
                           print("🟠 Response is already a dictionary")
                           self?.emitOnResponse(responseDict)
                       } else {
                           print("🟠 Could not parse response, sending as-is")
                           let errorData: [String: Any] = [
                               "status": "error",
                               "message": "Invalid response format",
                               "rawResponse": String(describing: response)
                           ]
                           self?.emitOnResponse(errorData)
                       }
                   },
                   onCustomerId: { [weak self] customerId in
                       print("🟠 SDK onCustomerId callback fired with: \(customerId ?? "nil")")
                       self?.emitOnCustomerId(customerId)
                   }
               )

               print("🟠 SDK ViewController created successfully")
               print("🟠 About to present SDK ViewController...")

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
    override func addListener(_ eventName: String) {
        super.addListener(eventName)
        print("🔴 addListener called for: \(eventName)")
        if !hasListeners {
            hasListeners = true
            print("🔴 Set hasListeners = true")
        }
    }

    @objc
    override func removeListeners(_ count: Double) {
        super.removeListeners(count)
        print("🔴 removeListeners called with count: \(count)")
    }

    override static func requiresMainQueueSetup() -> Bool {
        return true
    }
}
