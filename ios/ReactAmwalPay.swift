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
        // Prefer the foreground-active scene so we always present on the visible screen.
        let scene = UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .first(where: { $0.activationState == .foregroundActive })
            ?? UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .first

        let keyWindow = scene?.windows.first(where: { $0.isKeyWindow })
            ?? scene?.windows.first

        var top = keyWindow?.rootViewController
        while let presented = top?.presentedViewController {
            // Skip view controllers that are being dismissed to avoid presenting on a disappearing VC.
            if presented.isBeingDismissed { break }
            top = presented
        }
        return top
    }
}

@objc(ReactAmwalPay)
open class ReactAmwalPay: RCTEventEmitter {
    private var hasListeners = false
    private weak var presentingVC: UIViewController?

    // Pre-warmed SDK instance — initialized once per module lifetime so the
    // Flutter engine is ready long before the user taps "pay".
    private lazy var sdk: AmwalSDK = {
        AmwalLog.info("Pre-warming AmwalSDK Flutter engine", tag: "SDK")
        return AmwalSDK()
    }()

    override init() {
        super.init()
        // Boot the Flutter engine immediately when the native module is instantiated
        // (at JS bridge startup) rather than waiting for the first addListener call.
        DispatchQueue.main.async { _ = self.sdk }
    }

    open override func supportedEvents() -> [String]! {
        return ["onResponse", "onCustomerId"]
    }

    open override func startObserving() {
        hasListeners = true
    }

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
        let secureHash = raw["secureHash"] as? String
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
            merchantReference: raw["merchantReference"] as? String,
            secureHash: secureHash
        )
    }

    @objc
    open func initiate(_ config: [String: Any]) {
        DispatchQueue.main.async {
            do {
                // Guard: don't present a second SDK on top of one that's already visible.
                if let existing = self.presentingVC, existing.isBeingPresented || existing.presentingViewController != nil {
                    AmwalLog.warn("SDK already presented — ignoring duplicate initiate call", tag: "SDK")
                    return
                }

                let sdkConfig = self.buildConfig(config)
                AmwalLog.info("Building SDK config — env: \(sdkConfig.environment), amount: \(sdkConfig.amount)", tag: "SDK")

                guard let rootVC = UIViewController.getTopMostViewController() else {
                    AmwalLog.error("No root VC found", tag: "SDK")
                    self.emitOnResponse(["status": "ERROR", "message": "No root view controller"])
                    return
                }

                // Guard: if the presenting VC is mid-transition it can't host a modal.
                guard !rootVC.isBeingPresented, !rootVC.isBeingDismissed else {
                    AmwalLog.warn("Root VC is mid-transition — deferring presentation", tag: "SDK")
                    DispatchQueue.main.asyncAfter(deadline: .now() + 0.35) {
                        self.initiate(config)
                    }
                    return
                }

                AmwalLog.info("Presenting from: \(type(of: rootVC))", tag: "SDK")

                let sdkVC = try self.sdk.createViewController(
                    config: sdkConfig,
                    onResponse: { [weak self] response in
                        AmwalLog.info("onResponse received", tag: "SDK")
                        DispatchQueue.main.async {
                            self?.presentingVC?.dismiss(animated: true)
                            self?.presentingVC = nil
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

                sdkVC.modalPresentationStyle = .overFullScreen
                // White background prevents a black/transparent flash before Flutter's first frame paints.
                sdkVC.view.backgroundColor = .white
                self.presentingVC = sdkVC
                // animated: false eliminates the slide-up window during which Flutter hasn't rendered yet.
                rootVC.present(sdkVC, animated: false) {
                    AmwalLog.info("SDK presented over \(type(of: rootVC))", tag: "SDK")
                }
            } catch {
                AmwalLog.error("initiate failed: \(error)", tag: "SDK")
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
