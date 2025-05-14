//
//  AmwalSDKModule.swift
//  amwalpay
//
//  Created by anas elmansory on 14/05/2025.
//

import Foundation
import amwalsdk
import React
import UIKit

@objc(AmwalPaySDK)
class AmwalPaySDK: RCTEventEmitter {
  
  override init() {
    super.init()
  }
  
  @objc
  override static func requiresMainQueueSetup() -> Bool {
    return true
  }
  
  @objc
  func initialize(_ config: [String: Any], 
                 resolver resolve: @escaping RCTPromiseResolveBlock,
                 rejecter reject: @escaping RCTPromiseRejectBlock) {
    let workItem = DispatchWorkItem { [weak self] in
      guard let self = self else { return }
      
      do {
        // Convert config to AmwalSDK configuration
        let environment = self.getEnvironment(from: config["environment"] as? String)
        let sessionToken = config["sessionToken"] as? String ?? ""
        let currency = self.getCurrency(from: config["currency"] as? String)
        let amount = config["amount"] as? String ?? ""
        let merchantId = config["merchantId"] as? String ?? ""
        let terminalId = config["terminalId"] as? String ?? ""
        let locale = self.getLocale(from: config["locale"] as? String)
        let customerId = config["customerId"] as? String
        let transactionType = self.getTransactionType(from: config["transactionType"] as? String)
        
        let sdkConfig = Config(
          environment: environment,
          sessionToken: sessionToken,
          currency: currency,
          amount: amount,
          merchantId: merchantId,
          terminalId: terminalId,
          customerId: customerId,
          locale: locale,
          transactionType: transactionType
        )
        
        // Create and present SDK view controller
        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let rootViewController = windowScene.windows.first?.rootViewController {
          let sdk = AmwalSDK();
          do {
            let sdkViewController = try sdk.createViewController(
              config: sdkConfig,
              onResponse: { [weak self] response in
                self?.sendEvent(withName: "onResponse", body: response)
              },
              onCustomerId: { [weak self] customerId in
                self?.sendEvent(withName: "onCustomerId", body: [
                  "customerId": customerId
                ])
              }
            )
            sdkViewController.modalPresentationStyle = .fullScreen
            rootViewController.present(sdkViewController, animated: true)
            resolve(nil)
          } catch {
            reject("SDK_ERROR", "Failed to create SDK view controller: \(error.localizedDescription)", error)
          }
        } else {
          reject("PRESENTATION_ERROR", "Could not find root view controller", nil)
        }
      } catch {
        reject("INITIALIZATION_ERROR", "Failed to initialize AmwalSDK: \(error.localizedDescription)", error)
      }
    }
    
    DispatchQueue.main.async(execute: workItem)
  }
  
  // MARK: - RCTEventEmitter
  
  override func supportedEvents() -> [String] {
    return ["onResponse", "onCustomerId"]
  }
  
  private func getEnvironment(from string: String?) -> Config.Environment {
    switch string?.uppercased() {
    case "SIT": return .SIT
    case "UAT": return .UAT
    case "PROD": return .PROD
    default: return .SIT
    }
  }
  
  private func getCurrency(from string: String?) -> Config.Currency {
    switch string?.uppercased() {
    case "OMR": return .OMR
    default: return .OMR
    }
  }
  
  private func getLocale(from string: String?) -> Config.Locale {
    switch string?.uppercased() {
    case "EN": return .en
    case "AR": return .ar
    default: return .en
    }
  }
  
  private func getTransactionType(from string: String?) -> Config.TransactionType {
    switch string?.uppercased() {
    case "NFC": return .nfc
    case "CARD_WALLET": return .cardWallet
    case "APPLE_PAY": return .applePay
    default: return .cardWallet
    }
  }
}
