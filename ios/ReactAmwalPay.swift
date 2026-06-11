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

@objc(ReactAmwalPay)
open class ReactAmwalPay: RCTEventEmitter {
    private var hasListeners = false
    private var sdkWindow: UIWindow?

    // Pre-warmed SDK instance — one Flutter engine per app session.
    private lazy var sdk: AmwalSDK = {
        AmwalLog.info("Pre-warming AmwalSDK Flutter engine", tag: "SDK")
        return AmwalSDK()
    }()

    override init() {
        super.init()
        // Boot the Flutter engine at bridge startup so it is warm before any button press.
        DispatchQueue.main.async { _ = self.sdk }
    }

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
            do {
                // Guard: one SDK window at a time.
                if self.sdkWindow != nil {
                    AmwalLog.warn("SDK already visible — ignoring duplicate initiate call", tag: "SDK")
                    return
                }

                let sdkConfig = self.buildConfig(config)
                AmwalLog.info("Building SDK config — env: \(sdkConfig.environment), amount: \(sdkConfig.amount)", tag: "SDK")

                guard let windowScene = UIApplication.shared.connectedScenes
                    .compactMap({ $0 as? UIWindowScene })
                    .first(where: { $0.activationState == .foregroundActive })
                    ?? UIApplication.shared.connectedScenes
                        .compactMap({ $0 as? UIWindowScene })
                        .first else {
                    AmwalLog.error("No active UIWindowScene found", tag: "SDK")
                    self.emitOnResponse(["status": "ERROR", "message": "No active window scene"])
                    return
                }

                let sdkVC = try self.sdk.createViewController(
                    config: sdkConfig,
                    onResponse: { [weak self] response in
                        AmwalLog.info("onResponse received", tag: "SDK")
                        DispatchQueue.main.async { self?.tearDownSDKWindow() }
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

                // Set sdkVC as the window root directly — no present() call needed.
                // A UIWindow at alert+1 sits above every React Native window so the
                // Flutter payment UI is guaranteed to be visible.
                let window = UIWindow(windowScene: windowScene)
                window.windowLevel = UIWindow.Level.alert + 1
                window.backgroundColor = .white
                window.rootViewController = sdkVC
                window.makeKeyAndVisible()
                self.sdkWindow = window

                AmwalLog.info("SDK window visible (level \(window.windowLevel.rawValue))", tag: "SDK")
            } catch {
                AmwalLog.error("initiate failed: \(error)", tag: "SDK")
                self.tearDownSDKWindow()
                self.emitOnResponse(["status": "ERROR", "message": error.localizedDescription])
            }
        }
    }

    private func tearDownSDKWindow() {
        guard let window = sdkWindow else { return }
        UIView.animate(withDuration: 0.25, animations: {
            window.alpha = 0
        }, completion: { _ in
            window.isHidden = true
            self.sdkWindow = nil
        })
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
