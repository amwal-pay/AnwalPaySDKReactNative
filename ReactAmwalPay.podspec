require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "ReactAmwalPay"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  # iOS 13.0 is the real floor of this SDK: the bridge in ios/ReactAmwalPay.swift
  # only uses iOS 13+ API (connectedScenes / UIWindow(windowScene:)) and the
  # amwalsdk pod it wraps declares :ios => '13.0'. Do NOT use
  # min_ios_version_supported here — that follows the *host* React Native version
  # (15.1 on RN 0.79) and would refuse to install into apps whose deployment
  # target is lower. Host apps still get their own React Native floor applied on
  # top of this by react_native_post_install.
  s.platforms    = { :ios => "13.0" }
  s.source       = { :git => "https://github.com/amwal-pay/AnwalPaySDKReactNative.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.private_header_files = "ios/**/*.h"

  # Default to Release subspec. Pinned to 1.1.95 — 1.1.94 had a dead-channel regression in React Native.
  amwal_subspec = ENV['AMWAL_SUBSPEC'] || 'Release'
  s.dependency "amwalsdk/#{amwal_subspec}"
  install_modules_dependencies(s)
end
