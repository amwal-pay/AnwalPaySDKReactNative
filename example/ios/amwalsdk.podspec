Pod::Spec.new do |s|
  s.name             = 'amwalsdk'
  s.version          = '1.1.94'
  s.summary          = 'AMWAL SDK for iOS'
  s.description      = 'The AMWAL SDK provides features for payment integration in iOS applications.'
  s.homepage         = 'https://github.com/amwal-pay/AnwalPaySDKNativeiOS'
  s.license          = { :type => 'MIT' }
  s.author           = { 'Amwal Pay' => 'amr.elskaan@amwal-pay.com' }
  s.platform         = :ios, '13.0'
  s.swift_version    = '5.0'
  s.source           = { :http => "https://github.com/amwal-pay/AnwalPaySDKNativeiOSExample/releases/download/v#{s.version}/amwalsdk.zip" }

  s.pod_target_xcconfig = {
    'BUILD_LIBRARY_FOR_DISTRIBUTION' => 'YES',
    'DEFINES_MODULE' => 'YES',
    'ENABLE_BITCODE' => 'NO',
    'VALID_ARCHS' => 'arm64 arm64e x86_64',
    'EXCLUDED_ARCHS[sdk=iphonesimulator*]' => '',
    'ENABLE_TESTABILITY' => 'YES',
    'CLANG_ENABLE_MODULES' => 'YES',
    'CODE_SIGN_STYLE' => 'Automatic',
    'DEVELOPMENT_TEAM' => '$(DEVELOPMENT_TEAM)'
  }

  s.subspec 'Debug' do |debug|
    debug.source_files = '*.{h,m,swift}'
    debug.vendored_frameworks = 'Flutter/Debug/*.xcframework'
    debug.frameworks = 'Flutter', 'FlutterPluginRegistrant'
    debug.xcconfig = {
      'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "${PODS_ROOT}/Flutter" "${PODS_ROOT}/amwalsdk/Flutter/Debug"',
      'OTHER_LDFLAGS' => '$(inherited) -framework Flutter -framework FlutterPluginRegistrant',
      'SWIFT_INCLUDE_PATHS' => '$(inherited) "${PODS_ROOT}/Flutter" "${PODS_ROOT}/amwalsdk/Flutter/Debug"',
      'ONLY_ACTIVE_ARCH' => 'YES',
      'ENABLE_NS_ASSERTIONS' => 'YES',
      'SWIFT_COMPILATION_MODE' => 'singlefile',
      'SWIFT_OPTIMIZATION_LEVEL' => '-Onone'
    }
  end

  s.subspec 'Release' do |release|
    release.source_files = '*.{h,m,swift}'
    release.vendored_frameworks = 'Flutter/Release/*.xcframework'
    release.frameworks = 'Flutter', 'FlutterPluginRegistrant'
    release.xcconfig = {
      'FRAMEWORK_SEARCH_PATHS' => '$(inherited) "${PODS_ROOT}/Flutter" "${PODS_ROOT}/amwalsdk/Flutter/Release"',
      'OTHER_LDFLAGS' => '$(inherited) -framework Flutter -framework FlutterPluginRegistrant',
      'SWIFT_INCLUDE_PATHS' => '$(inherited) "${PODS_ROOT}/Flutter" "${PODS_ROOT}/amwalsdk/Flutter/Release"',
      'ONLY_ACTIVE_ARCH' => 'NO',
      'ENABLE_NS_ASSERTIONS' => 'NO',
      'SWIFT_COMPILATION_MODE' => 'wholemodule',
      'SWIFT_OPTIMIZATION_LEVEL' => '-O',
      'STRIP_SWIFT_SYMBOLS' => 'NO',
      'STRIP_STYLE' => 'non-global',
      'DEAD_CODE_STRIPPING' => 'NO',
      'PRESERVE_DEAD_CODE_INITS' => 'YES'
    }
  end

  s.default_subspec = 'Debug'
end
