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

  private fun sendEvent(eventName: String, params: Any?) {
    reactApplicationContext
      .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
      .emit(eventName, params)
  }

  private fun emitOnResponse(params: WritableMap) {
    sendEvent("onResponse", params)
  }

  private fun emitOnCustomerId(customerId: String?) {
    sendEvent("onCustomerId", customerId)
  }

  override fun addListener(eventName: String?) {
    // Required for RN built in Event Emitter Calls.
  }

  override fun removeListeners(count: Double) {
    // Required for RN built in Event Emitter Calls.
  }
  
  override fun initiate(config: ReadableMap) {
    Log.d(NAME, "initiate called")
    val activity = reactApplicationContext.currentActivity
    if (activity == null) {
      val params = Arguments.createMap()
      val errorData = Arguments.createMap()
      errorData.putString("status", "ERROR")
      errorData.putString("message", "Activity context is not available")
      params.putMap("data", errorData)
      emitOnResponse(params)
      return
    }
    
    Log.d(NAME, "initiate got here")
    try {
      // Handle additionValues map
      val additionValues = if (config.hasKey("additionValues")) {
        val additionValuesMap = config.getMap("additionValues")
        val map = mutableMapOf<String, String>()
        additionValuesMap?.let { readableMap ->
          val iterator = readableMap.keySetIterator()
          while (iterator.hasNextKey()) {
            val key = iterator.nextKey()
            readableMap.getString(key)?.let { value ->
              map[key] = value
            }
          }
        }
        map.toMap()
      } else {
        AmwalSDK.Config.generateDefaultAdditionValues()
      }

      val sdkConfig = AmwalSDK.Config(
        environment = AmwalSDK.Config.Environment.valueOf(config.getString("environment") ?: ""),
        sessionToken = config.getString("sessionToken") ?: "",
        currency = AmwalSDK.Config.Currency.valueOf(config.getString("currency") ?: ""),
        amount = config.getString("amount") ?: "",
        merchantId = config.getString("merchantId") ?: "",
        terminalId = config.getString("terminalId") ?: "",
        locale = java.util.Locale(config.getString("locale") ?: "en"),
        customerId = if (config.hasKey("customerId")) config.getString("customerId") else null,
        transactionType = AmwalSDK.Config.TransactionType.valueOf(config.getString("transactionType") ?: ""),
        transactionId = if (config.hasKey("transactionId")) config.getString("transactionId") else AmwalSDK.Config.generateTransactionId(),
        additionValues = additionValues,
        merchantReference = if (config.hasKey("merchantReference")) config.getString("merchantReference") else null
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
      val errorData = Arguments.createMap()
      errorData.putString("status", "ERROR")
      errorData.putString("message", e.message ?: "Unknown error")
      params.putMap("data", errorData)
      emitOnResponse(params)
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
