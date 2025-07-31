package expo.modules.zebraprintconnect

import android.app.ActivityManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Parcel
import android.os.ResultReceiver
import expo.modules.kotlin.Promise
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

// Data classes
data class PrintConnectValidationResult(
    val isValid: Boolean,
    val errorMessage: String? = null
)

data class ServiceResponse(
    val success: Boolean,
    val message: String,
    val data: Any? = null
)

// Constants
object PrintConnectConstants {
    const val PACKAGE_NAME = "com.zebra.printconnect"
    const val TIMEOUT_DURATION = 10000L
    const val RESULT_RECEIVER_KEY = "com.zebra.printconnect.PrintService.RESULT_RECEIVER"
    const val ERROR_MESSAGE_KEY = "com.zebra.printconnect.PrintService.ERROR_MESSAGE"
    const val PASSTHROUGH_DATA_KEY = "com.zebra.printconnect.PrintService.PASSTHROUGH_DATA"
    const val PRINTER_STATUS_KEY = "PrinterStatusMap"

    object Services {
        const val UNSELECT_PRINTER = "com.zebra.printconnect.print.UnselectPrinterService"
        const val PASSTHROUGH = "com.zebra.printconnect.print.PassthroughService"
        const val GET_PRINTER_STATUS = "com.zebra.printconnect.print.GetPrinterStatusService"
    }
}

// Helper classes
class TimeoutManager(private val promise: Promise) {
    private val handler = Handler(Looper.getMainLooper())
    private var isResolved = false
    private lateinit var timeoutRunnable: Runnable

    fun startTimeout(
        duration: Long = PrintConnectConstants.TIMEOUT_DURATION,
        message: String = "Timeout: No response from PrintConnect service"
    ) {
        timeoutRunnable = Runnable {
            if (!isResolved) {
                resolvePromise(ServiceResponse(false, message))
            }
        }
        handler.postDelayed(timeoutRunnable, duration)
    }

    fun cancelTimeout() {
        if (::timeoutRunnable.isInitialized) {
            handler.removeCallbacks(timeoutRunnable)
        }
    }

    fun resolvePromise(response: ServiceResponse) {
        if (!isResolved) {
            isResolved = true
            promise.resolve(response.toMap())
        }
    }

    fun isAlreadyResolved(): Boolean = isResolved
}

class PrintConnectService(private val context: Context) {

    fun validateEnvironment(): PrintConnectValidationResult {
        return try {
            // Check if Zebra PrintConnect is installed
            context.packageManager.getPackageInfo(PrintConnectConstants.PACKAGE_NAME, 0)

            // Check if app is in foreground
            if (!isAppInForeground()) {
                return PrintConnectValidationResult(
                    isValid = false,
                    errorMessage = "App must be in foreground to check printer status"
                )
            }

            PrintConnectValidationResult(isValid = true)
        } catch (e: Exception) {
            PrintConnectValidationResult(
                isValid = false,
                errorMessage = "Zebra PrintConnect app is not installed"
            )
        }
    }

    private fun isAppInForeground(): Boolean {
        val activityManager = context.getSystemService(Context.ACTIVITY_SERVICE) as ActivityManager
        val runningAppProcesses = activityManager.runningAppProcesses

        return runningAppProcesses?.any { process ->
            process.processName == context.packageName &&
                    process.importance == ActivityManager.RunningAppProcessInfo.IMPORTANCE_FOREGROUND
        } ?: false
    }

    fun executeService(
        serviceClassName: String,
        timeoutManager: TimeoutManager,
        intentExtras: (Intent) -> Unit = {},
        resultProcessor: (Int, Bundle?) -> ServiceResponse
    ) {
        try {
            val intent = createServiceIntent(serviceClassName)
            intentExtras(intent)

            intent.putExtra(
                PrintConnectConstants.RESULT_RECEIVER_KEY,
                createIPCSafeReceiver(createResultReceiver(timeoutManager, resultProcessor))
            )

            timeoutManager.startTimeout()
            context.startForegroundService(intent)

        } catch (e: Exception) {
            timeoutManager.cancelTimeout()
            timeoutManager.resolvePromise(
                ServiceResponse(false, "Error starting service: ${e.message}")
            )
        }
    }

    private fun createServiceIntent(serviceClassName: String): Intent {
        return Intent().apply {
            component = ComponentName(PrintConnectConstants.PACKAGE_NAME, serviceClassName)
        }
    }

    private fun createResultReceiver(
        timeoutManager: TimeoutManager,
        resultProcessor: (Int, Bundle?) -> ServiceResponse
    ): ResultReceiver {
        return object : ResultReceiver(null) {
            override fun onReceiveResult(resultCode: Int, resultData: Bundle?) {
                timeoutManager.cancelTimeout()

                if (!timeoutManager.isAlreadyResolved()) {
                    val response = resultProcessor(resultCode, resultData)
                    timeoutManager.resolvePromise(response)
                }
            }
        }
    }

    private fun createIPCSafeReceiver(receiver: ResultReceiver): ResultReceiver {
        val parcel = Parcel.obtain()
        return try {
            receiver.writeToParcel(parcel, 0)
            parcel.setDataPosition(0)
            val safeReceiver = ResultReceiver.CREATOR.createFromParcel(parcel)
            safeReceiver
        } finally {
            parcel.recycle()
        }
    }
}

// Result processors
object ResultProcessors {

    fun unselectPrinter(resultCode: Int, resultData: Bundle?): ServiceResponse {
        return if (resultCode == 0) {
            ServiceResponse(true, "Printer unselected successfully")
        } else {
            val errorMessage = resultData?.getString(PrintConnectConstants.ERROR_MESSAGE_KEY)
            ServiceResponse(false, errorMessage ?: "Unknown error occurred")
        }
    }

    fun print(resultCode: Int, resultData: Bundle?): ServiceResponse {
        return if (resultCode == 0) {
            ServiceResponse(true, "Print job sent successfully")
        } else {
            val errorMessage = resultData?.getString(PrintConnectConstants.ERROR_MESSAGE_KEY)
            ServiceResponse(false, errorMessage ?: "Print job failed")
        }
    }

    fun getPrinterStatus(resultCode: Int, resultData: Bundle?): ServiceResponse {
        return if (resultCode == 0) {
            @Suppress("DEPRECATION")
            val printerStatusMap = resultData?.getSerializable(PrintConnectConstants.PRINTER_STATUS_KEY) as? HashMap<*, *>
            ServiceResponse(
                success = true,
                message = "Printer status retrieved successfully",
                data = printerStatusMap
            )
        } else {
            val errorMessage = resultData?.getString(PrintConnectConstants.ERROR_MESSAGE_KEY)
            ServiceResponse(false, errorMessage ?: "No printer connected")
        }
    }
}

// Extension functions
private fun ServiceResponse.toMap(): Map<String, Any?> {
    return buildMap {
        put("success", success)
        put("message", message)
        data?.let { put("data", it) }
    }
}

private fun String.toUTF8ByteArray(): ByteArray? {
    return try {
        toByteArray(Charsets.UTF_8)
    } catch (e: Exception) {
        null
    }
}



class ExpoZebraPrintConnectModule : Module() {
  // Each module class must implement the definition function. The definition consists of components
  // that describes the module's functionality and behavior.
  // See https://docs.expo.dev/modules/module-api for more details about available components.
  override fun definition() = ModuleDefinition {
    // Sets the name of the module that JavaScript code will use to refer to the module. Takes a string as an argument.
    // Can be inferred from module's class name, but it's recommended to set it explicitly for clarity.
    // The module will be accessible from `requireNativeModule('ExpoZebraPrintConnect')` in JavaScript.
    Name("ExpoZebraPrintConnect")
      AsyncFunction("unselectPrinter") { promise: Promise ->
            val context = getContextOrResolveError(promise) ?: return@AsyncFunction
            val service = PrintConnectService(context)

            val validationResult = service.validateEnvironment()
            if (!validationResult.isValid) {
                promise.resolve(
                    ServiceResponse(false, validationResult.errorMessage ?: "Unknown error occurred").toMap()
                )
                return@AsyncFunction
            }

            val timeoutManager = TimeoutManager(promise)

            service.executeService(
                serviceClassName = PrintConnectConstants.Services.UNSELECT_PRINTER,
                timeoutManager = timeoutManager,
                resultProcessor = ResultProcessors::unselectPrinter
            )
        }

        AsyncFunction("print") { zpl: String, promise: Promise ->
            val context = getContextOrResolveError(promise) ?: return@AsyncFunction
            val service = PrintConnectService(context)

            val validationResult = service.validateEnvironment()
            if (!validationResult.isValid) {
                promise.resolve(
                    ServiceResponse(false, validationResult.errorMessage ?: "Unknown error occurred").toMap()
                )
                return@AsyncFunction
            }

            val zplBytes = zpl.toUTF8ByteArray()
            if (zplBytes == null) {
                promise.resolve(
                    ServiceResponse(false, "Error encoding ZPL data").toMap()
                )
                return@AsyncFunction
            }

            val timeoutManager = TimeoutManager(promise)

            service.executeService(
                serviceClassName = PrintConnectConstants.Services.PASSTHROUGH,
                timeoutManager = timeoutManager,
                intentExtras = { intent ->
                    intent.putExtra(PrintConnectConstants.PASSTHROUGH_DATA_KEY, zplBytes)
                },
                resultProcessor = ResultProcessors::print
            )
        }

        AsyncFunction("getPrinterStatus") { promise: Promise ->
            val context = getContextOrResolveError(promise) ?: return@AsyncFunction
            val service = PrintConnectService(context)

            val validationResult = service.validateEnvironment()
            if (!validationResult.isValid) {
                promise.resolve(
                    ServiceResponse(false, validationResult.errorMessage ?: "Unknown error occurred").toMap()
                )
                return@AsyncFunction
            }

            val timeoutManager = TimeoutManager(promise)

            service.executeService(
                serviceClassName = PrintConnectConstants.Services.GET_PRINTER_STATUS,
                timeoutManager = timeoutManager,
                resultProcessor = ResultProcessors::getPrinterStatus
            )
        }
    }

    private fun getContextOrResolveError(promise: Promise): Context? {
        val context = appContext.reactContext
        if (context == null) {
            promise.resolve(
                ServiceResponse(false, "Context not available").toMap()
            )
        }
        return context
    }
}
