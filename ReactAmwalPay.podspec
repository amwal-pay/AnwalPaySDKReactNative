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
  # Pinned to 1.1.93: 1.1.94 shipped a broken add-to-app build that floods
  # "Communicating on a dead channel" and cancels the SDK at launch with
  # onResponse(null). Do NOT bump to 1.1.94+ until that regression is fixed.
  s.dependency "amwalsdk/#{amwal_subspec}", '1.1.93'
  install_modules_dependencies(s)
end
