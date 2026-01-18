import Foundation
import amwalsdk
import React
import UIKit

// MARK: - Container view controller that keeps SDK alive during 3DS presentation
/// This container wraps the SDK view controller as a child
/// When 3DS opens its WebView, it can present on top without dismissing the SDK
class ShareableContainerViewController: UIViewController {
    private let sdkViewController: UIViewController
    
    init(sdkViewController: UIViewController) {
        self.sdkViewController = sdkViewController
        super.init(nibName: nil, bundle: nil)
    }
    
    required init?(coder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        // Add SDK view controller as child - this keeps it alive during 3DS presentation
        addChild(sdkViewController)
        view.addSubview(sdkViewController.view)
        sdkViewController.view.frame = view.bounds
        sdkViewController.view.autoresizingMask = [.flexibleWidth, .flexibleHeight]
        sdkViewController.didMove(toParent: self)
        
        view.backgroundColor = .clear
        sdkViewController.view.backgroundColor = .clear
        
        // Enable presentation context to handle 3DS WebView presentation
        // This is critical: allows 3DS WebView to present on top without dismissing the SDK
        definesPresentationContext = true
        providesPresentationContextTransitionStyle = true
        
        // Ensure the SDK view controller also allows nested presentations
        // This prevents it from being dismissed when 3DS presents its WebView
        sdkViewController.definesPresentationContext = true
        sdkViewController.providesPresentationContextTransitionStyle = true
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewDidAppear(animated)
        // Ensure container is ready for nested presentations
    }
    
    private func topmostPresentedViewController() -> UIViewController {
        var topController: UIViewController = self
        while let presented = topController.presentedViewController {
            topController = presented
        }
        return topController
    }
    
    override func present(_ viewControllerToPresent: UIViewController, animated flag: Bool, completion: (() -> Void)? = nil) {
        // If already presenting, present from the topmost controller
        // This allows 3DS WebView to present on top without dismissing the SDK
        if let presented = presentedViewController {
            let topmost = topmostPresentedViewController()
            topmost.present(viewControllerToPresent, animated: flag, completion: completion)
        } else {
            super.present(viewControllerToPresent, animated: flag, completion: completion)
        }
    }
}

// MARK: - Fix UIViewController presentation for share sheets
public extension UIViewController {
    static let swizzlePresentOnce: Void = {
        let originalSelector = #selector(UIViewController.present(_:animated:completion:))
        let swizzledSelector = #selector(UIViewController.swizzled_present(_:animated:completion:))
        
        guard let originalMethod = class_getInstanceMethod(UIViewController.self, originalSelector),
              let swizzledMethod = class_getInstanceMethod(UIViewController.self, swizzledSelector) else {
            return
        }
        
        method_exchangeImplementations(originalMethod, swizzledMethod)
    }()
    
    @objc dynamic func swizzled_present(_ viewControllerToPresent: UIViewController, animated flag: Bool, completion: (() -> Void)? = nil) {
        // Check if this view controller's view is in the window hierarchy
        if self.view.window == nil {
            print("⚠️ Attempting to present on VC not in hierarchy, finding correct presenter...")
            // Find the correct view controller to present from
            if let topVC = UIViewController.getTopMostViewController() {
                topVC.swizzled_present(viewControllerToPresent, animated: flag, completion: completion)
                return
            }
        }
        
        // Special handling for ShareableContainerViewController and its children
        // If presenting from a child of ShareableContainerViewController, forward to container
        if let container = findShareableContainer() {
            if container != self {
                // We're a child of the container, forward to container
                container.swizzled_present(viewControllerToPresent, animated: flag, completion: completion)
                return
            }
            // We ARE the container - allow nested presentations
            // Don't auto-dismiss, just present on top
        } else if self.presentedViewController != nil && !self.definesPresentationContext {
            // Not a container, and already presenting - auto-dismiss
            print("⚠️ Already presenting, dismissing first...")
            self.dismiss(animated: false) { [weak self] in
                self?.swizzled_present(viewControllerToPresent, animated: flag, completion: completion)
            }
            return
        }
        
        // Call original implementation
        self.swizzled_present(viewControllerToPresent, animated: flag, completion: completion)
    }
    
    // Helper to find ShareableContainerViewController in parent hierarchy
    private func findShareableContainer() -> ShareableContainerViewController? {
        var current: UIViewController? = self
        while let parent = current?.parent {
            if let container = parent as? ShareableContainerViewController {
                return container
            }
            current = parent
        }
        if let container = self as? ShareableContainerViewController {
            return container
        }
        return nil
    }
    
    static func getTopMostViewController() -> UIViewController? {
        var topController: UIViewController?
        
        if #available(iOS 13.0, *) {
            let keyWindow = UIApplication.shared.connectedScenes
                .compactMap { $0 as? UIWindowScene }
                .flatMap { $0.windows }
                .first { $0.isKeyWindow }
            topController = keyWindow?.rootViewController
        } else {
            topController = UIApplication.shared.keyWindow?.rootViewController
        }
        
        while let presented = topController?.presentedViewController {
            topController = presented
        }
        
        return topController
    }
}

@objc(ReactAmwalPay)
open class ReactAmwalPay: RCTEventEmitter {
    private var hasListeners = false
    private var sdkWindow: UIWindow?  // Separate window for SDK to avoid modal dismissal issues
    
    // Initialize swizzling when the class is first loaded
    private static let initializeSwizzling: Void = {
        _ = UIViewController.swizzlePresentOnce
    }()
    
    // Initialize swizzling when the module is loaded
    public override init() {
        super.init()
        _ = ReactAmwalPay.initializeSwizzling
    }

    open override func supportedEvents() -> [String]! {
        return ["onResponse", "onCustomerId"]
    }

    open override func startObserving() {
        print("🔴 startObserving called - setting hasListeners = true")
        hasListeners = true
    }

    open override func stopObserving() {
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
    open func initiate(_ config: [String: Any]) {
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

                       // Dismiss SDK window when payment completes
                       DispatchQueue.main.async {
                           self?.dismissSDKWindow()
                       }

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

               // Ensure transparency
               sdkVC.view.backgroundColor = .clear
               sdkVC.view.isOpaque = false
               
               // Wrap SDK view controller in container
               let containerVC = ShareableContainerViewController(sdkViewController: sdkVC)
               containerVC.view.backgroundColor = .clear

               print("🟠 SDK ViewController wrapped in container")
               print("🟠 Creating separate window for SDK...")

               // Create a separate window for the SDK
               // This prevents modal presentation issues - SDK lives in its own window
               // 3DS can present on top without affecting the SDK
               if #available(iOS 13.0, *) {
                   if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene {
                       self.sdkWindow = UIWindow(windowScene: windowScene)
                   }
               } else {
                   self.sdkWindow = UIWindow(frame: UIScreen.main.bounds)
               }
               
               guard let sdkWindow = self.sdkWindow else {
                   print("🟠 Failed to create SDK window, falling back to modal presentation")
                   rootVC.present(containerVC, animated: true)
                   return
               }
               
               sdkWindow.rootViewController = containerVC
               sdkWindow.windowLevel = .normal + 1  // Above main window
               sdkWindow.backgroundColor = .clear
               sdkWindow.isOpaque = false
               sdkWindow.makeKeyAndVisible()
               
               print("🟠 SDK window created and made visible")
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
    open override func addListener(_ eventName: String) {
        super.addListener(eventName)
        print("🔴 addListener called for: \(eventName)")
        if !hasListeners {
            hasListeners = true
            print("🔴 Set hasListeners = true")
        }
    }

    @objc
    open override func removeListeners(_ count: Double) {
        super.removeListeners(count)
        print("🔴 removeListeners called with count: \(count)")
    }

    @objc
    public override static func requiresMainQueueSetup() -> Bool {
        return true
    }
    
    // Dismiss SDK window when payment completes
    private func dismissSDKWindow() {
        print("🟠 Dismissing SDK window...")
        sdkWindow?.isHidden = true
        sdkWindow?.rootViewController = nil
        sdkWindow = nil
    }
}
