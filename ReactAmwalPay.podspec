require "json"

package = JSON.parse(File.read(File.join(__dir__, "package.json")))

Pod::Spec.new do |s|
  s.name         = "ReactAmwalPay"
  s.version      = package["version"]
  s.summary      = package["description"]
  s.homepage     = package["homepage"]
  s.license      = package["license"]
  s.authors      = package["author"]

  s.platforms    = { :ios => min_ios_version_supported }
  s.source       = { :git => "https://github.com/amwal-pay/AnwalPaySDKReactNative.git", :tag => "#{s.version}" }

  s.source_files = "ios/**/*.{h,m,mm,swift}"
  s.private_header_files = "ios/**/*.h"
  
  # Exclude generated codegen files to avoid duplicate symbols
  # These files are already included in ReactCodegen pod
  s.exclude_files = [
    "ios/build/**/*",
    "ios/**/RCTAppDependencyProvider.*",
    "ios/**/RCTModuleProviders.*",
    "ios/**/RCTModulesConformingToProtocolsProvider.*",
    "ios/**/RCTThirdPartyComponentsProvider.*",
    "ios/**/*Spec-generated.*",
    "ios/**/*SpecJSI-generated.*"
  ]

  # Default to Release subspec
  amwal_subspec = ENV['AMWAL_SUBSPEC'] || 'Release'
  s.dependency "amwalsdk/#{amwal_subspec}"
  install_modules_dependencies(s)
end
