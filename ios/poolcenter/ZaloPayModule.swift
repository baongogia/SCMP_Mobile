import Foundation
import React
import ZaloPaySDK

@objc(ZaloPayModule)
class ZaloPayModule: NSObject, RCTBridgeModule {

    private var paymentPromise: RCTPromiseResolveBlock?
    private var paymentReject: RCTPromiseRejectBlock?

    @objc
    static func moduleName() -> String! {
        return "ZaloPayModule"
    }

    @objc
    static func requiresMainQueueSetup() -> Bool {
        return true
    }

    @objc
    func initZaloPay(_ appId: String, uriScheme: String, environment: String) {
        DispatchQueue.main.async {
            let env = environment == "production" ? ZPZPIEnvironment.production : ZPZPIEnvironment.sandbox
            ZaloPaySDK.shared().initialize(withAppId: appId, environment: env)
        }
    }

    @objc
    func payOrder(_ zpTransToken: String, resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        self.paymentPromise = resolver
        self.paymentReject = rejecter

        DispatchQueue.main.async {
            ZaloPaySDK.shared().payOrder(zpTransToken, scheme: "myapp://payment-success") { [weak self] response in
                guard let self = self else { return }

                if let response = response {
                    let result: [String: Any] = [
                        "returnCode": response.returnCode,
                        "returnMessage": response.returnMessage ?? "",
                        "transactionId": response.transactionId ?? "",
                        "transToken": response.transToken ?? "",
                        "appTransID": response.appTransID ?? ""
                    ]
                    self.paymentPromise?(result)
                } else {
                    let result: [String: Any] = [
                        "returnCode": -1,
                        "returnMessage": "Payment failed"
                    ]
                    self.paymentPromise?(result)
                }

                self.paymentPromise = nil
                self.paymentReject = nil
            }
        }
    }

    @objc
    func checkZaloPayApp(_ resolver: @escaping RCTPromiseResolveBlock, rejecter: @escaping RCTPromiseRejectBlock) {
        DispatchQueue.main.async {
            let canOpen = UIApplication.shared.canOpenURL(URL(string: "zalopay://")!)
            resolver(canOpen)
        }
    }
}
