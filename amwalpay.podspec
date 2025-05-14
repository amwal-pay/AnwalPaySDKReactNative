require 'json'

package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

Pod::Spec.new do |s|
  s.name         = package['name']
  s.version      = package['version']
  s.summary      = package['description']
  s.license      = package['license']
  s.authors      = package['author']
  s.homepage     = package['homepage']
  s.platform     = :ios, '12.0'
  s.source       = { :git => 'https://github.com/yourusername/amwalpay.git', :tag => "v#{s.version}" }
  s.source_files = 'ios/amwalpay/**/*.{h,m,mm,swift}'
  
  s.dependency 'React-Core'
  # Add any other dependencies your native module needs
  # s.dependency 'amwalsdk'
  
  s.swift_version = '5.0'
 end