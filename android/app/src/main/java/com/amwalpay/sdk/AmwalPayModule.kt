package com.amwalpay.sdk

import android.util.Log
import com.facebook.react.bridge.*
import com.anwalpay.sdk.AmwalSDK
import org.json.JSONObject
import com.facebook.react.modules.core.DeviceEventManagerModule;


class AmwalPayModule(private val reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    private val amwalSDK = AmwalSDK()

    override fun getName(): String = "AmwalPaySDK"
    private fun sendEvent(eventName: String, params: WritableMap?) {
        reactContext
            .getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter::class.java)
            .emit(eventName, params)
    }
    @ReactMethod
    fun initialize(config: ReadableMap, promise: Promise) {
        val activity = reactContext.currentActivity
        if (activity == null) {
            promise.reject("ACTIVITY_NOT_AVAILABLE", "Activity context is not available")
            return
        }
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
                    val params = Arguments.createMap()
                    params.putString("type", "onResponse")
                    try {
                        val json = JSONObject(it.toString())
                        val dataMap = jsonToWritableMap(json)
                        params.putMap("data", dataMap)
                    } catch (e: Exception) {
                        params.putString("data", it.toString())
                    }
                    sendEvent("AmwalPayEvent", params)
                }, onCustomerId = {
                    val params = Arguments.createMap()
                    params.putString("type", "onCustomerId")
                    params.putString("data", it)
                    sendEvent("AmwalPayEvent", params)
                })
                promise.resolve(null)
            }
        } catch (e: Exception) {
            promise.reject("INITIALIZATION_ERROR", e.message)
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
}