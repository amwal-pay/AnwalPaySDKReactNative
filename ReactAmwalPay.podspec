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
  s.exclude_files = "ios/build/**"
  s.private_header_files = "ios/**/*.h"

  # Default to Release subspec
  amwal_subspec = ENV['AMWAL_SUBSPEC'] || 'Release'
  # Use >= 1.1.90 to support both the published pods (1.1.93+) and the local
  # development build (1.1.92.1) used in the native iOS example. The example
  # Podfile pins the exact build via :path => so version resolution still works.
  s.dependency "amwalsdk/#{amwal_subspec}", '>= 1.1.90'
  install_modules_dependencies(s)
end
