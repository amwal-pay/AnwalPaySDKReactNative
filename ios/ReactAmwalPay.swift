import Foundation
import amwalsdk
import React
import UIKit

struct AmwalLog {
    private static let prefix = "[AMWAL_PAY_SDK]"
    static func debug(_ msg: String, tag: String = "") { print("\(prefix) 🔵 [\(tag)] \(msg)") }
    static func info(_ msg: String, tag: String = "") { print("\(prefix) 🟢 [\(tag)] \(msg)") }
    static func warn(_ msg: String, tag: String = "") { print("\(prefix) 🟡 [\(tag)] \(msg)") }
    static func error(_ msg: String, tag: String = "") { print("\(prefix) 🔴 [\(tag)] \(msg)") }
}

extension UIViewController {
    static func getTopMostViewController() -> UIViewController? {
        let keyWindow = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap { $0.windows }
            .first { $0.isKeyWindow }
        var top = keyWindow?.rootViewController
        while let presented = top?.presentedViewController {
            top = presented
        }
        return top
    }
}

@objc(ReactAmwalPay)
open class ReactAmwalPay: RCTEventEmitter {
    private var hasListeners = false
    private weak var presentingVC: UIViewController?
    private var sdkWindow: UIWindow?

    open override func supportedEvents() -> [String]! {
        return ["onResponse", "onCustomerId"]
    }

    open override func startObserving() { hasListeners = true }
    open override func stopObserving() { hasListeners = false }

    private func emitOnResponse(_ params: [String: Any]) {
        guard hasListeners else {
            AmwalLog.warn("onResponse not sent — no listeners", tag: "EVENTS")
            return
        }
        sendEvent(withName: "onResponse", body: params)
    }

    private func emitOnCustomerId(_ customerId: String?) {
        guard hasListeners else { return }
        sendEvent(withName: "onCustomerId", body: customerId)
    }

    private func mapEnvironment(_ s: String) -> Config.Environment {
        switch s { case "PROD": return .PROD; case "UAT": return .UAT; default: return .SIT }
    }
    private func mapCurrency(_ s: String) -> Config.Currency { return .OMR }
    private func mapTransactionType(_ s: String) -> Config.TransactionType {
        switch s { case "NFC": return .nfc; case "APPLE_PAY": return .applePay; default: return .cardWallet }
    }
    private func mapLocale(_ s: String) -> Config.Locale {
        switch s { case "ar": return .ar; default: return .en }
    }

    private func buildConfig(_ raw: [String: Any]) -> Config {
        var additionValues = Config.generateDefaultAdditionValues()
        if let extra = raw["additionValues"] as? [String: String] {
            extra.forEach { additionValues[$0] = $1 }
        }
        return Config(
            environment: mapEnvironment(raw["environment"] as? String ?? "SIT"),
            sessionToken: raw["sessionToken"] as? String ?? "",
            currency: mapCurrency(raw["currency"] as? String ?? "OMR"),
            amount: raw["amount"] as? String ?? "",
            merchantId: raw["merchantId"] as? String ?? "",
            terminalId: raw["terminalId"] as? String ?? "",
            customerId: raw["customerId"] as? String,
            locale: mapLocale(raw["locale"] as? String ?? "en"),
            transactionType: mapTransactionType(raw["transactionType"] as? String ?? "CARD_WALLET"),
            transactionId: raw["transactionId"] as? String ?? Config.generateTransactionId(),
            additionValues: additionValues,
            merchantReference: raw["merchantReference"] as? String
        )
    }

    @objc
    open func initiate(_ config: [String: Any]) {
        DispatchQueue.main.async {
            guard let windowScene = UIApplication.shared.connectedScenes
                .compactMap({ $0 as? UIWindowScene })
                .first(where: { $0.activationState == .foregroundActive })
                ?? UIApplication.shared.connectedScenes.compactMap({ $0 as? UIWindowScene }).first
            else {
                AmwalLog.error("No window scene found", tag: "SDK")
                self.emitOnResponse(["status": "ERROR", "message": "No window scene"])
                return
            }

            let sdkConfig = self.buildConfig(config)
            AmwalLog.info("Building SDK config — env: \(sdkConfig.environment), amount: \(sdkConfig.amount)", tag: "SDK")

            do {
                let sdk = AmwalSDK()
                let flutterVC = try sdk.createViewController(
                    config: sdkConfig,
                    onResponse: { [weak self] response in
                        AmwalLog.info("onResponse received", tag: "SDK")
                        DispatchQueue.main.async {
                            self?.sdkWindow?.isHidden = true
                            self?.sdkWindow?.rootViewController = nil
                            self?.sdkWindow = nil
                        }
                        guard let response = response,
                              let data = response.data(using: .utf8),
                              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
                        else { return }
                        self?.emitOnResponse(json)
                    },
                    onCustomerId: { [weak self] customerId in
                        self?.emitOnCustomerId(customerId)
                    }
                )

                let containerVC = SDKContainerVC(flutterVC: flutterVC)
                containerVC.view.backgroundColor = .clear

                let window = UIWindow(windowScene: windowScene)
                window.windowLevel = .normal + 1
                window.backgroundColor = .clear
                window.rootViewController = containerVC
                window.makeKeyAndVisible()
                self.sdkWindow = window
                AmwalLog.info("SDK window created and shown", tag: "SDK")
            } catch {
                AmwalLog.error("Failed to create Flutter VC: \(error)", tag: "SDK")
                self.emitOnResponse(["status": "ERROR", "message": error.localizedDescription])
            }
        }
    }

    @objc
    open override func addListener(_ eventName: String) {
        super.addListener(eventName)
        hasListeners = true
    }

    @objc
    open override func removeListeners(_ count: Double) {
        super.removeListeners(count)
    }

    @objc
    public override static func requiresMainQueueSetup() -> Bool { return true }
}
