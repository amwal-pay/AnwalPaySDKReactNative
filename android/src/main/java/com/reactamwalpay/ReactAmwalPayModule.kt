package com.reactamwalpay

import android.util.Log
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.modules.core.DeviceEventManagerModule
import com.anwalpay.sdk.AmwalSDK
import org.json.JSONObject

@ReactModule(name = ReactAmwalPayModule.NAME)
class ReactAmwalPayModule(reactContext: ReactApplicationContext) :
  NativeReactAmwalPaySpec(reactContext) {

  private val amwalSDK = AmwalSDK()

  override fun getName(): String {
    return NAME
  }

 
  
  private fun sendEvent(eventName: String, params: WritableMap?) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }
  
  override fun initiate(config: ReadableMap) {
    Log.d(NAME, "initiate called")
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      // Since we can't use Promise here (method signature must match the spec),
      // we'll send an error event
      val params = Arguments.createMap()
      params.putString("type", "onResponse")
      val errorData = Arguments.createMap()
      errorData.putString("status", "ERROR")
      errorData.putString("message", "Activity context is not available")
      params.putMap("data", errorData)
      sendEvent("AmwalPayEvent", params)
      return
    }
    
    Log.d(NAME, "initiate got here")
    try {
      val sdkConfig = AmwalSDK.Config(
        environment = AmwalSDK.Config.Environment.valueOf(config.getString("environment") ?: ""),
        sessionToken = config.getString("sessionToken") ?: "",
        currency = AmwalSDK.Config.Currency.valueOf(config.getString("currency") ?: ""),
        amount = config.getString("amount") ?: "",
        merchantId = config.getString("merchantId") ?: "",
        terminalId = config.getString("terminalId") ?: "",
        locale = java.util.Locale(config.getString("locale") ?: "en"),
        customerId = if (config.hasKey("customerId")) config.getString("customerId") else null,
        transactionType = AmwalSDK.Config.TransactionType.valueOf(config.getString("transactionType") ?: "")
      )
      
      // Ensure this runs on the UI thread
      (reactApplicationContext.currentActivity ?: return).runOnUiThread {
        amwalSDK.start(
          activity,
          sdkConfig,
          onResponse = {
            Log.d(NAME, "onResponse called")
            val params = Arguments.createMap()
            try {
              val json = JSONObject(it.toString())
              val dataMap = jsonToWritableMap(json)
              params.putMap("data", dataMap)
            } catch (e: Exception) {
              params.putString("data", it.toString())
            }
            emitOnResponse(params)
          }, 
          onCustomerId = {
            Log.d(NAME, "onCustomerId called")
            emitOnCustomerId(it)
          }
        )
      }
    } catch (e: Exception) {
      Log.e(NAME, "Error initializing AmwalSDK", e)
      val params = Arguments.createMap()
      params.putString("type", "onResponse")
      val errorData = Arguments.createMap()
      errorData.putString("status", "ERROR")
      errorData.putString("message", e.message ?: "Unknown error")
      params.putMap("data", errorData)
      sendEvent("AmwalPayEvent", params)
    }
  }

  // Helper function to convert JSONObject to WritableMap
  private fun jsonToWritableMap(jsonObject: JSONObject): WritableMap {
    val map = Arguments.createMap()
    val keys = jsonObject.keys()
    while (keys.hasNext()) {
      val key = keys.next()
      val value = jsonObject.get(key)
      when (value) {
        is JSONObject -> map.putMap(key, jsonToWritableMap(value))
        is Boolean -> map.putBoolean(key, value)
        is Int -> map.putInt(key, value)
        is Double -> map.putDouble(key, value)
        is String -> map.putString(key, value)
        else -> map.putString(key, value.toString())
      }
    }
    return map
  }

  companion object {
    const val NAME = "ReactAmwalPay"
  }
}
