import Foundation
import OSLog
import PassKit
import UIKit

/// QC-only log capture for the example app.
///
/// QC testers run TestFlight builds without Xcode, so everything that would
/// normally only be visible in the Xcode console is collected here and handed
/// to JS for the "Export SDK Logs" report:
///
/// * stdout / stderr — the amwalsdk pod's `[AMWAL_PAY_SDK]` lines, Flutter
///   output and anything else that `print`s. The streams are tee'd, so the
///   Xcode console keeps working.
/// * the app's own unified system log (`OSLogStore`, iOS 15+) — PassKit and
///   networking errors such as
///   `PKPaymentAuthorizationCoordinator - Failed to present in-app payment interface`.
/// * Apple Pay diagnostics — `canMakePayments`, the merchant IDs the build is
///   really signed with, device and build type.
///
/// Lives in the example app only; the published ReactAmwalPay package and the
/// amwalsdk pod are untouched.
@objc(QCLogCapture)
final class QCLogCapture: NSObject {

  private static let queue = DispatchQueue(label: "app.amwal.example.qclogcapture")
  private static let maxConsoleLines = 4000
  private static let maxSystemEntries = 2000
  private static let launchDate = Date()

  private static var consoleLines: [String] = []
  private static var partialLines: [String: String] = [:]
  private static var started = false
  /// Pipes and the original fds must stay alive for the life of the app.
  private static var redirections: [(pipe: Pipe, originalFd: Int32)] = []

  private static let timestampFormatter: DateFormatter = {
    let f = DateFormatter()
    f.locale = Locale(identifier: "en_US_POSIX")
    f.timeZone = TimeZone(identifier: "UTC")
    f.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
    return f
  }()

  // MARK: - Capture

  /// Call once, as early as possible (first line of didFinishLaunching).
  @objc static func startCapturing() {
    guard !started else { return }
    started = true
    // A pipe makes stdio fully buffered; keep `print` output flowing line by line.
    setvbuf(stdout, nil, _IOLBF, 0)
    setvbuf(stderr, nil, _IONBF, 0)
    redirect(fd: STDOUT_FILENO, label: "stdout")
    redirect(fd: STDERR_FILENO, label: "stderr")
  }

  private static func redirect(fd: Int32, label: String) {
    let originalFd = dup(fd)
    guard originalFd >= 0 else { return }
    let pipe = Pipe()
    guard dup2(pipe.fileHandleForWriting.fileDescriptor, fd) >= 0 else {
      close(originalFd)
      return
    }
    pipe.fileHandleForReading.readabilityHandler = { handle in
      let data = handle.availableData
      guard !data.isEmpty else { return }
      // Tee back to the original stream so the Xcode console still shows it.
      data.withUnsafeBytes { raw in
        _ = write(originalFd, raw.baseAddress, raw.count)
      }
      let text = String(decoding: data, as: UTF8.self)
      queue.async { append(text, label: label) }
    }
    redirections.append((pipe, originalFd))
  }

  private static func append(_ text: String, label: String) {
    let combined = (partialLines[label] ?? "") + text
    var parts = combined.components(separatedBy: "\n")
    partialLines[label] = parts.removeLast()
    let stamp = timestampFormatter.string(from: Date())
    for line in parts where !line.trimmingCharacters(in: .whitespaces).isEmpty {
      consoleLines.append("[\(stamp)] [\(label)] \(line)")
    }
    if consoleLines.count > maxConsoleLines {
      consoleLines.removeFirst(consoleLines.count - maxConsoleLines)
    }
  }

  // MARK: - JS API

  @objc static func requiresMainQueueSetup() -> Bool { false }

  /// Resolves `{ console: string[], system: string[], systemError?: string }`.
  @objc(getNativeLogs:rejecter:)
  func getNativeLogs(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.global(qos: .userInitiated).async {
      var result: [String: Any] = [:]
      result["console"] = QCLogCapture.queue.sync { QCLogCapture.consoleLines }
      do {
        result["system"] = try QCLogCapture.readSystemLog()
      } catch {
        result["system"] = [String]()
        result["systemError"] = "OSLogStore unavailable: \(error.localizedDescription)"
      }
      resolve(result)
    }
  }

  @objc(clearNativeLogs)
  func clearNativeLogs() {
    QCLogCapture.queue.async { QCLogCapture.consoleLines.removeAll() }
  }

  /// Resolves a flat dictionary describing whether Apple Pay can work in this build.
  @objc(getApplePayDiagnostics:rejecter:)
  func getApplePayDiagnostics(
    _ resolve: @escaping RCTPromiseResolveBlock,
    rejecter reject: @escaping RCTPromiseRejectBlock
  ) {
    DispatchQueue.main.async {
      // Same networks the SDK puts in its PKPaymentRequest.
      let networks: [PKPaymentNetwork] = [.visa, .masterCard, .amex, .discover]
      let info = Bundle.main.infoDictionary ?? [:]
      var d: [String: Any] = [
        "canMakePayments": PKPaymentAuthorizationController.canMakePayments(),
        "canMakePaymentsWithSdkNetworks":
          PKPaymentAuthorizationController.canMakePayments(usingNetworks: networks),
        "iosVersion": UIDevice.current.systemVersion,
        "deviceModel": QCLogCapture.deviceModelIdentifier(),
        "isSimulator": QCLogCapture.isSimulator,
        "bundleId": Bundle.main.bundleIdentifier ?? "?",
        "appVersion": info["CFBundleShortVersionString"] as? String ?? "?",
        "buildNumber": info["CFBundleVersion"] as? String ?? "?",
        "buildType": QCLogCapture.buildType(),
        "nativeCaptureStarted": QCLogCapture.started,
        "secondsSinceLaunch": Int(Date().timeIntervalSince(QCLogCapture.launchDate)),
      ]
      if let ids = QCLogCapture.profileMerchantIds() {
        d["profileMerchantIds"] = ids.isEmpty ? "NONE — Apple Pay entitlement missing" : ids.joined(separator: ", ")
      } else {
        d["profileMerchantIds"] = "not readable (TestFlight/App Store builds don't embed the profile)"
      }
      resolve(d)
    }
  }

  // MARK: - Helpers

  /// Unified-log entries of this process since launch that matter for a payment:
  /// every error/fault, plus anything from PassKit / Flutter / the SDK.
  private static func readSystemLog() throws -> [String] {
    guard #available(iOS 15.0, *) else {
      return ["OSLogStore requires iOS 15"]
    }
    let store = try OSLogStore(scope: .currentProcessIdentifier)
    let entries = try store.getEntries(at: store.position(date: launchDate))
    let keywords = ["passkit", "pkpayment", "apple pay", "applepay", "payment",
                    "flutter", "amwal", "nsurlerror", "merchant"]
    var lines: [String] = []
    for case let entry as OSLogEntryLog in entries {
      let subsystem = entry.subsystem
      let message = entry.composedMessage
      let haystack = (subsystem + " " + entry.category + " " + message).lowercased()
      let important = entry.level == .error || entry.level == .fault
      guard important || keywords.contains(where: haystack.contains) else { continue }
      let level: String
      switch entry.level {
      case .fault: level = "FAULT"
      case .error: level = "ERROR"
      case .notice: level = "NOTICE"
      case .info: level = "INFO"
      case .debug: level = "DEBUG"
      default: level = "LOG"
      }
      let source = subsystem.isEmpty ? entry.sender : "\(subsystem):\(entry.category)"
      lines.append("[\(timestampFormatter.string(from: entry.date))] [\(level)] [\(source)] \(message)")
    }
    if lines.count > maxSystemEntries {
      lines.removeFirst(lines.count - maxSystemEntries)
    }
    return lines
  }

  private static var isSimulator: Bool {
    #if targetEnvironment(simulator)
    return true
    #else
    return false
    #endif
  }

  private static func deviceModelIdentifier() -> String {
    if let sim = ProcessInfo.processInfo.environment["SIMULATOR_MODEL_IDENTIFIER"] {
      return "\(sim) (simulator)"
    }
    var info = utsname()
    uname(&info)
    return withUnsafeBytes(of: &info.machine) { raw in
      String(decoding: raw.prefix(while: { $0 != 0 }), as: UTF8.self)
    }
  }

  private static func embeddedProfile() -> [String: Any]? {
    guard
      let url = Bundle.main.url(forResource: "embedded", withExtension: "mobileprovision"),
      let data = try? Data(contentsOf: url),
      let start = data.range(of: Data("<?xml".utf8)),
      let end = data.range(of: Data("</plist>".utf8), in: start.lowerBound..<data.endIndex)
    else { return nil }
    let plistData = data.subdata(in: start.lowerBound..<end.upperBound)
    return (try? PropertyListSerialization.propertyList(from: plistData, format: nil)) as? [String: Any]
  }

  /// Merchant IDs in the embedded provisioning profile; nil when there is no profile.
  private static func profileMerchantIds() -> [String]? {
    guard let profile = embeddedProfile() else { return nil }
    let entitlements = profile["Entitlements"] as? [String: Any]
    return entitlements?["com.apple.developer.in-app-payments"] as? [String] ?? []
  }

  private static func buildType() -> String {
    if isSimulator { return "simulator" }
    if let profile = embeddedProfile() {
      let entitlements = profile["Entitlements"] as? [String: Any]
      if entitlements?["get-task-allow"] as? Bool == true { return "development" }
      return profile["ProvisionsAllDevices"] as? Bool == true ? "enterprise" : "ad-hoc"
    }
    if Bundle.main.appStoreReceiptURL?.lastPathComponent == "sandboxReceipt" {
      return "testflight"
    }
    return "app-store"
  }
}
