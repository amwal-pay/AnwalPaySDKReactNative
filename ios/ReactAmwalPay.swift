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

    open override func supportedEvents() -> [String]! {
        return ["onResponse", "onCustomerId"]
    }

    open override func startObserving() {
        hasListeners = true
        AmwalLog.debug("startObserving — JS attached listeners", tag: "EVENTS")
    }
    open override func stopObserving() {
        hasListeners = false
        AmwalLog.debug("stopObserving — JS removed listeners", tag: "EVENTS")
    }

    private func emitOnResponse(_ params: [String: Any]) {
        guard hasListeners else {
            AmwalLog.warn("onResponse NOT sent — no JS listeners attached", tag: "EVENTS")
            return
        }
        AmwalLog.info("➡️ emitting onResponse to JS: \(params)", tag: "EVENTS")
        sendEvent(withName: "onResponse", body: params)
    }

    private func emitOnCustomerId(_ customerId: String?) {
        guard hasListeners else {
            AmwalLog.warn("onCustomerId NOT sent — no JS listeners attached", tag: "EVENTS")
            return
        }
        AmwalLog.info("➡️ emitting onCustomerId to JS: \(customerId ?? "nil")", tag: "EVENTS")
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
        AmwalLog.debug("buildConfig — raw keys: \(raw.keys.sorted())", tag: "CONFIG")
        let sessionTokenRaw = raw["sessionToken"] as? String ?? ""
        let secureHashRaw = raw["secureHash"] as? String
        AmwalLog.debug("environment=\(raw["environment"] as? String ?? "nil")", tag: "CONFIG")
        AmwalLog.debug("currency=\(raw["currency"] as? String ?? "nil")", tag: "CONFIG")
        AmwalLog.debug("amount=\(raw["amount"] as? String ?? "nil")", tag: "CONFIG")
        AmwalLog.debug("merchantId=\(raw["merchantId"] as? String ?? "nil")", tag: "CONFIG")
        AmwalLog.debug("terminalId=\(raw["terminalId"] as? String ?? "nil")", tag: "CONFIG")
        AmwalLog.debug("transactionType=\(raw["transactionType"] as? String ?? "nil")", tag: "CONFIG")
        AmwalLog.debug("locale=\(raw["locale"] as? String ?? "nil")", tag: "CONFIG")
        AmwalLog.debug("customerId=\(raw["customerId"] as? String ?? "nil")", tag: "CONFIG")
        AmwalLog.debug("merchantReference=\(raw["merchantReference"] as? String ?? "nil")", tag: "CONFIG")
        AmwalLog.debug("sessionToken present=\(!sessionTokenRaw.isEmpty) length=\(sessionTokenRaw.count)", tag: "CONFIG")
        AmwalLog.debug("secureHash present=\(secureHashRaw != nil) length=\(secureHashRaw?.count ?? 0)", tag: "CONFIG")
        if sessionTokenRaw.isEmpty {
            AmwalLog.warn("sessionToken is EMPTY — SDK will load but cannot create a payment session", tag: "CONFIG")
        }

        var additionValues = Config.generateDefaultAdditionValues()
        if let extra = raw["additionValues"] as? [String: String] {
            extra.forEach { additionValues[$0] = $1 }
        }
        AmwalLog.debug("additionValues=\(additionValues)", tag: "CONFIG")
        let secureHash = secureHashRaw
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

    /// Logs the current UIWindow hierarchy so we can see what the SDK will be
    /// presented over and at which window levels.
    private func logWindowHierarchy(_ context: String) {
        let scenes = UIApplication.shared.connectedScenes.compactMap { $0 as? UIWindowScene }
        AmwalLog.debug("[\(context)] connectedScenes(WindowScene)=\(scenes.count)", tag: "WINDOW")
        for (si, scene) in scenes.enumerated() {
            AmwalLog.debug("[\(context)] scene[\(si)] state=\(scene.activationState.rawValue) windows=\(scene.windows.count)", tag: "WINDOW")
            for (wi, w) in scene.windows.enumerated() {
                AmwalLog.debug("[\(context)] scene[\(si)].window[\(wi)] level=\(w.windowLevel.rawValue) key=\(w.isKeyWindow) hidden=\(w.isHidden) rootVC=\(String(describing: type(of: w.rootViewController)))", tag: "WINDOW")
            }
        }
    }

    @objc
    open func initiate(_ config: [String: Any]) {
        AmwalLog.info("initiate() called — thread=\(Thread.isMainThread ? "main" : "bg") hasListeners=\(self.hasListeners)", tag: "SDK")
        DispatchQueue.main.async {
            AmwalLog.info("initiate() — entered main queue block", tag: "SDK")
            self.logWindowHierarchy("before-create")
            do {
                AmwalLog.info("Step 1/5 — building config", tag: "SDK")
                let sdkConfig = self.buildConfig(config)
                AmwalLog.info("Step 1/5 done — env: \(sdkConfig.environment), amount: \(sdkConfig.amount)", tag: "SDK")

                AmwalLog.info("Step 2/5 — resolving top-most view controller", tag: "SDK")
                guard let rootVC = UIViewController.getTopMostViewController() else {
                    AmwalLog.error("No root VC found — cannot present SDK", tag: "SDK")
                    self.emitOnResponse(["status": "ERROR", "message": "No root view controller"])
                    return
                }
                AmwalLog.info("Step 2/5 done — rootVC=\(type(of: rootVC)) view.window=\(String(describing: rootVC.view.window)) alreadyPresenting=\(String(describing: rootVC.presentedViewController))", tag: "SDK")

                AmwalLog.info("Step 3/5 — instantiating AmwalSDK()", tag: "SDK")
                let sdk = AmwalSDK()
                AmwalLog.info("Step 3/5 done — AmwalSDK instance created", tag: "SDK")

                AmwalLog.info("Step 4/5 — calling createViewController()", tag: "SDK")
                let createStart = Date()
                let sdkVC = try sdk.createViewController(
                    config: sdkConfig,
                    onResponse: { [weak self] response in
                        AmwalLog.info("⬅️ onResponse received — raw: \(response ?? "nil")", tag: "CALLBACK")
                        DispatchQueue.main.async {
                            AmwalLog.info("onResponse — dismissing presented SDK VC", tag: "CALLBACK")
                            self?.presentingVC?.dismiss(animated: true) {
                                AmwalLog.info("onResponse — dismiss complete", tag: "CALLBACK")
                            }
                            self?.presentingVC = nil
                        }
                        guard let response = response,
                              let data = response.data(using: .utf8),
                              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
                        else {
                            AmwalLog.warn("onResponse — could not parse response as JSON, emitting nothing", tag: "CALLBACK")
                            return
                        }
                        AmwalLog.info("onResponse — parsed JSON keys: \(json.keys.sorted())", tag: "CALLBACK")
                        self?.emitOnResponse(json)
                    },
                    onCustomerId: { [weak self] customerId in
                        AmwalLog.info("⬅️ onCustomerId received: \(customerId ?? "nil")", tag: "CALLBACK")
                        self?.emitOnCustomerId(customerId)
                    }
                )
                let createMs = Int(Date().timeIntervalSince(createStart) * 1000)
                AmwalLog.info("Step 4/5 done — createViewController returned \(type(of: sdkVC)) in \(createMs)ms isViewLoaded=\(sdkVC.isViewLoaded)", tag: "SDK")

                AmwalLog.info("Step 5/5 — presenting SDK VC over rootVC", tag: "SDK")
                sdkVC.modalPresentationStyle = .overFullScreen
                self.presentingVC = sdkVC
                rootVC.present(sdkVC, animated: true) {
                    AmwalLog.info("Step 5/5 done — present() completion fired", tag: "SDK")
                    AmwalLog.info("post-present — sdkVC.view.window=\(String(describing: sdkVC.view.window)) frame=\(sdkVC.view.frame) hidden=\(sdkVC.view.isHidden) alpha=\(sdkVC.view.alpha)", tag: "SDK")
                    self.logWindowHierarchy("after-present")
                }

                // Visibility watchdogs: confirm the SDK actually appeared on screen.
                DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                    let onScreen = sdkVC.view.window != nil
                    AmwalLog.info("watchdog@1s — onScreen=\(onScreen) view.window=\(String(describing: sdkVC.view.window)) frame=\(sdkVC.view.frame)", tag: "VISIBILITY")
                    if !onScreen {
                        AmwalLog.error("watchdog@1s — SDK view is NOT in any window (not visible)", tag: "VISIBILITY")
                    }
                }
                DispatchQueue.main.asyncAfter(deadline: .now() + 3.0) {
                    let onScreen = sdkVC.view.window != nil
                    AmwalLog.info("watchdog@3s — onScreen=\(onScreen) subviews=\(sdkVC.view.subviews.count)", tag: "VISIBILITY")
                    if !onScreen {
                        AmwalLog.error("watchdog@3s — SDK still NOT visible after 3s", tag: "VISIBILITY")
                    }
                }
            } catch {
                AmwalLog.error("initiate failed at createViewController/present — error: \(error)", tag: "SDK")
                AmwalLog.error("error details: \(String(describing: error))", tag: "SDK")
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
