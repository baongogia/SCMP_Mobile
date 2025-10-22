package com.anonymous.poolcenter;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;

import com.facebook.react.bridge.ActivityEventListener;
import com.facebook.react.bridge.BaseActivityEventListener;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.bridge.WritableNativeMap;

import vn.zalopay.sdk.Environment;
import vn.zalopay.sdk.ZaloPayError;
import vn.zalopay.sdk.ZaloPaySDK;
import vn.zalopay.sdk.listeners.PayOrderListener;

public class ZaloPayModule extends ReactContextBaseJavaModule {
    private static final String MODULE_NAME = "ZaloPayModule";
    private static final int ZALO_PAY_REQUEST_CODE = 1001;
    private Promise paymentPromise;

    private final ActivityEventListener mActivityEventListener = new BaseActivityEventListener() {
        @Override
        public void onActivityResult(Activity activity, int requestCode, int resultCode, Intent intent) {
            if (requestCode == ZALO_PAY_REQUEST_CODE) {
                ZaloPaySDK.getInstance().onResult(intent);
            }
        }
    };

    public ZaloPayModule(ReactApplicationContext reactContext) {
        super(reactContext);
        reactContext.addActivityEventListener(mActivityEventListener);
    }

    @Override
    public String getName() {
        return MODULE_NAME;
    }

    @ReactMethod
    public void initZaloPay(String appId, String uriScheme, String environment) {
        try {
            Environment env = environment.equals("production") ? Environment.PRODUCTION : Environment.SANDBOX;
            ZaloPaySDK.init(Integer.parseInt(appId), env);
        } catch (Exception e) {
            e.printStackTrace();
        }
    }

    @ReactMethod
    public void payOrder(String zpTransToken, Promise promise) {
        // Clear any previous promise
        if (this.paymentPromise != null) {
            this.paymentPromise = null;
        }
        this.paymentPromise = promise;

        Activity currentActivity = getCurrentActivity();
        if (currentActivity == null) {
            WritableMap result = new WritableNativeMap();
            result.putInt("returnCode", -1);
            result.putString("returnMessage", "Activity not available");
            promise.resolve(result);
            return;
        }

        try {
            ZaloPaySDK.getInstance().payOrder(currentActivity, zpTransToken, "myapp://payment-success", new PayOrderListener() {
            @Override
            public void onPaymentSucceeded(String transactionId, String transToken, String appTransID) {
                WritableMap result = new WritableNativeMap();
                result.putInt("returnCode", 1);
                result.putString("returnMessage", "Payment succeeded");
                result.putString("transactionId", transactionId);
                result.putString("transToken", transToken);
                result.putString("appTransID", appTransID);

                if (paymentPromise != null) {
                    paymentPromise.resolve(result);
                    paymentPromise = null;
                }
            }

            @Override
            public void onPaymentCanceled(String zpTransToken, String appTransID) {
                WritableMap result = new WritableNativeMap();
                result.putInt("returnCode", 4);
                result.putString("returnMessage", "Payment canceled");
                result.putString("zpTransToken", zpTransToken);
                result.putString("appTransID", appTransID);

                if (paymentPromise != null) {
                    paymentPromise.resolve(result);
                    paymentPromise = null;
                }
            }

            @Override
            public void onPaymentError(ZaloPayError zaloPayError, String zpTransToken, String appTransID) {
                WritableMap result = new WritableNativeMap();
                result.putInt("returnCode", getErrorCode(zaloPayError));
                result.putString("returnMessage", "Payment error: " + zaloPayError.toString());
                result.putString("zpTransToken", zpTransToken);
                result.putString("appTransID", appTransID);

                if (paymentPromise != null) {
                    paymentPromise.resolve(result);
                    paymentPromise = null;
                }
            }
        });
        } catch (Exception e) {
            WritableMap result = new WritableNativeMap();
            result.putInt("returnCode", -99);
            result.putString("returnMessage", "SDK Error: " + e.getMessage());

            if (paymentPromise != null) {
                paymentPromise.resolve(result);
                paymentPromise = null;
            }
        }
    }

    @ReactMethod
    public void checkZaloPayApp(Promise promise) {
        try {
            PackageManager pm = getReactApplicationContext().getPackageManager();
            pm.getPackageInfo("com.vng.zalopay", PackageManager.GET_ACTIVITIES);
            promise.resolve(true);
        } catch (PackageManager.NameNotFoundException e) {
            promise.resolve(false);
        }
    }

    private int getErrorCode(ZaloPayError error) {
        if (error == ZaloPayError.PAYMENT_APP_NOT_FOUND) return -1;
        if (error == ZaloPayError.INPUT_IS_INVALID) return -2;
        if (error == ZaloPayError.EMPTY_RESULT) return -3;
        if (error == ZaloPayError.FAIL) return -4;
        return -99; // UNKNOWN or other errors
    }
}
