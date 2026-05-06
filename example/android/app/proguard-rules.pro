# Add project specific ProGuard rules here.
# For more details, see http://developer.android.com/guide/developing/tools/proguard.html

# ─── React Native ────────────────────────────────────────────────────────────
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep JS interface methods called via reflection
-keepclassmembers class * {
    @com.facebook.react.bridge.ReactMethod *;
    @com.facebook.react.uimanager.annotations.ReactProp *;
    @com.facebook.react.uimanager.annotations.ReactPropGroup *;
}

# ─── Kotlin ──────────────────────────────────────────────────────────────────
-keep class kotlin.** { *; }
-keep class kotlin.Metadata { *; }
-dontwarn kotlin.**
-keepclassmembers class **$WhenMappings { <fields>; }
-keepclassmembers class kotlin.Metadata {
    public <methods>;
}

# Kotlin 2.x metadata — required when R8 is older than the Kotlin version used.
# Prevents "error occurred when parsing kotlin metadata" warnings from becoming failures.
-keep class kotlinx.metadata.** { *; }
-dontwarn kotlinx.metadata.**

# ─── SLF4J ───────────────────────────────────────────────────────────────────
# SLF4J's StaticLoggerBinder is intentionally absent at runtime (it's a no-op
# fallback). R8 flags it as missing — suppress it.
-dontwarn org.slf4j.**
-keep class org.slf4j.** { *; }

# ─── OkHttp / Okio (used by React Native networking) ─────────────────────────
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep interface okhttp3.** { *; }

# ─── Suppress common harmless warnings ───────────────────────────────────────
-dontwarn com.google.android.gms.**
-dontwarn javax.annotation.**
-dontwarn sun.misc.Unsafe
