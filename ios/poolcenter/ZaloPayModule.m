#import "ZaloPayModule.h"
#import <zpdk/ZaloPaySDK.h>
#import <zpdk/ZPPaymentDelegate.h>
#import <zpdk/ZPPaymentErrorCode.h>
#import <zpdk/ZPZPIEnvironment.h>

@implementation ZaloPayModule {
  NSString *_appId;
  NSString *_uriScheme;
  NSString *_environment;
  RCTPromiseResolveBlock _currentPaymentResolve;
  RCTPromiseRejectBlock _currentPaymentReject;
}

- (instancetype)init {
  self = [super init];
  if (self) {
    // Set delegate khi khởi tạo
    [ZaloPaySDK sharedInstance].paymentDelegate = self;
  }
  return self;
}

RCT_EXPORT_MODULE(ZaloPayModule);

+ (BOOL)requiresMainQueueSetup { return YES; }

RCT_EXPORT_METHOD(initZaloPay:(NSString *)appId
                  uriScheme:(NSString *)uriScheme
                  environment:(NSString *)environment)
{
  _appId = appId ?: @"";
  _uriScheme = uriScheme ?: @"myapp";

  // Accept values like: "prod", "production", "live" or "sandbox", "staging"
  NSString *env = (environment ?: @"").lowercaseString;
  ZPZPIEnvironment zpdkEnv;
  if ([env isEqualToString:@"prod"] || [env isEqualToString:@"production"] || [env isEqualToString:@"live"]) {
    _environment = @"production";
    zpdkEnv = ZPZPIEnvironment_Production;
  } else if ([env isEqualToString:@"sandbox"] || [env isEqualToString:@"staging"] || [env isEqualToString:@"dev"]) {
    _environment = @"sandbox";
    zpdkEnv = ZPZPIEnvironment_Sandbox;
  } else {
    // Default to sandbox for testing
    _environment = @"sandbox";
    zpdkEnv = ZPZPIEnvironment_Sandbox;
  }

  // Initialize ZaloPay SDK với zpdk framework
  NSInteger appIdInt = [_appId integerValue];
  NSLog(@"[ZaloPayModule] 🔧 Initializing ZaloPaySDK với appId: %ld, uriScheme: %@, environment: %ld", (long)appIdInt, _uriScheme, (long)zpdkEnv);
  [[ZaloPaySDK sharedInstance] initWithAppId:appIdInt uriScheme:_uriScheme environment:zpdkEnv];
  NSLog(@"[ZaloPayModule] ✅ ZaloPaySDK initialized successfully");
}

RCT_REMAP_METHOD(checkZaloPayApp,
                 checkZaloPayAppWithResolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  // Always check for ZaloPay QC (sandbox) schemes first
  NSArray *qcSchemes = @[@"zlp://", @"zlp-stg://", @"zalopayqc://", @"zalopaystaging://"];
  NSArray *prodSchemes = @[@"zalopay://", @"zalopay.api.v2://"];

  NSLog(@"[ZaloPayModule] 🔍 Checking ZaloPay QC installation...");

  // Check QC schemes first
  BOOL canQC = NO;
  for (NSString *s in qcSchemes) {
    NSURL *u = [NSURL URLWithString:s];
    BOOL canOpen = u && [[UIApplication sharedApplication] canOpenURL:u];
    NSLog(@"[ZaloPayModule] Testing QC scheme %@ → canOpen: %d", s, canOpen);

    if (canOpen) {
      canQC = YES;
      NSLog(@"[ZaloPayModule] ✅ Found ZaloPay QC with scheme: %@", s);
      break;
    }
  }

  // If QC is available, prefer it
  if (canQC) {
    resolve(@(YES));
    return;
  }

  // Fallback to production schemes
  BOOL canProd = NO;
  for (NSString *s in prodSchemes) {
    NSURL *u = [NSURL URLWithString:s];
    if (u && [[UIApplication sharedApplication] canOpenURL:u]) {
      canProd = YES;
      NSLog(@"[ZaloPayModule] Found ZaloPay production with scheme: %@", s);
      break;
    }
  }

  resolve(@(canProd));
}

RCT_REMAP_METHOD(payOrder,
                 payOrderWithOrderUrl:(NSString *)orderUrl
                 resolver:(RCTPromiseResolveBlock)resolve
                 rejecter:(RCTPromiseRejectBlock)reject)
{
  NSLog(@"[ZaloPayModule] ═══════════════════════════════════════════════════");
  NSLog(@"[ZaloPayModule] 🔧 payOrder() được gọi từ native module");
  NSLog(@"[ZaloPayModule] ═══════════════════════════════════════════════════");
  NSLog(@"[ZaloPayModule] 🔧 orderUrl nhận được: %@", orderUrl ?: @"(nil)");
  NSLog(@"[ZaloPayModule] 🔧 _appId: %@", _appId ?: @"(nil)");
  NSLog(@"[ZaloPayModule] 🔧 _uriScheme: %@", _uriScheme ?: @"(nil)");
  NSLog(@"[ZaloPayModule] 🔧 _environment: %@", _environment ?: @"(nil)");

  if (!orderUrl || orderUrl.length == 0) {
    NSLog(@"[ZaloPayModule] ❌ ERROR: Empty orderUrl");
    reject(@"invalid_order_url", @"Empty orderUrl", nil);
    return;
  }

  // Parse orderUrl để lấy order parameter (base64)
  NSString *orderParam = nil;
  NSLog(@"[ZaloPayModule] 🔍 Parsing orderUrl: %@", orderUrl);
  NSURL *parsedUrl = [NSURL URLWithString:orderUrl];
  if (parsedUrl) {
    NSURLComponents *components = [NSURLComponents componentsWithURL:parsedUrl resolvingAgainstBaseURL:NO];
    for (NSURLQueryItem *item in components.queryItems) {
      if ([item.name isEqualToString:@"order"]) {
        orderParam = item.value;
        NSLog(@"[ZaloPayModule] ✅ Tìm thấy order parameter: %@", orderParam);
        break;
      }
    }
  }

  if (!orderParam || orderParam.length == 0) {
    NSLog(@"[ZaloPayModule] ❌ ERROR: Không tìm thấy order parameter trong orderUrl");
    reject(@"invalid_order_url", @"Không tìm thấy order parameter trong orderUrl", nil);
    return;
  }

  // Decode base64 để lấy zp_trans_token
  NSData *decodedData = [[NSData alloc] initWithBase64EncodedString:orderParam options:0];
  NSString *decodedString = [[NSString alloc] initWithData:decodedData encoding:NSUTF8StringEncoding];
  NSLog(@"[ZaloPayModule] 🔍 Decoded order parameter: %@", decodedString ?: @"(nil)");

  // Parse JSON để lấy zp_trans_token
  NSString *zpTransToken = nil;
  if (decodedString) {
    NSData *jsonData = [decodedString dataUsingEncoding:NSUTF8StringEncoding];
    NSError *error = nil;
    NSDictionary *jsonDict = [NSJSONSerialization JSONObjectWithData:jsonData options:0 error:&error];
    if (!error && jsonDict) {
      zpTransToken = jsonDict[@"zptranstoken"];
      NSLog(@"[ZaloPayModule] ✅ Extracted zp_trans_token: %@", zpTransToken ?: @"(nil)");
    } else {
      NSLog(@"[ZaloPayModule] ❌ Lỗi parse JSON: %@", error.localizedDescription);
      reject(@"parse_error", [NSString stringWithFormat:@"Failed to parse order parameter: %@", error.localizedDescription], nil);
      return;
    }
  }

  if (!zpTransToken || zpTransToken.length == 0) {
    NSLog(@"[ZaloPayModule] ❌ ERROR: Không tìm thấy zp_trans_token trong order parameter");
    reject(@"invalid_token", @"Không tìm thấy zp_trans_token trong order parameter", nil);
    return;
  }

  // Sử dụng ZaloPay SDK thay vì deeplink
  NSLog(@"[ZaloPayModule] 🚀 Sử dụng ZaloPaySDK.payOrder() với token: %@", zpTransToken);

  // Lưu resolve/reject để dùng trong delegate callbacks
  _currentPaymentResolve = resolve;
  _currentPaymentReject = reject;

  // Gọi SDK trên main queue
  dispatch_async(dispatch_get_main_queue(), ^{
    NSLog(@"[ZaloPayModule] 🚀 Gọi ZaloPaySDK.payOrder() trên main queue...");
    [[ZaloPaySDK sharedInstance] payOrder:zpTransToken];
    NSLog(@"[ZaloPayModule] ✅ ZaloPaySDK.payOrder() đã được gọi");
    // Kết quả sẽ được trả về qua delegate methods
  });
}

// MARK: - ZPPaymentDelegate

- (void)paymentDidSucceeded:(NSString *)transactionId
                 zpTranstoken:(NSString *)zpTranstoken
                   appTransId:(NSString *)appTransId {
  NSLog(@"[ZaloPayModule] ✅ paymentDidSucceeded:");
  NSLog(@"[ZaloPayModule] ✅   transactionId: %@", transactionId ?: @"(nil)");
  NSLog(@"[ZaloPayModule] ✅   zpTranstoken: %@", zpTranstoken ?: @"(nil)");
  NSLog(@"[ZaloPayModule] ✅   appTransId: %@", appTransId ?: @"(nil)");

  if (_currentPaymentResolve) {
    _currentPaymentResolve(@{
      @"returnCode": @1,
      @"returnMessage": @"Payment succeeded",
      @"transactionId": transactionId ?: @"",
      @"zpTranstoken": zpTranstoken ?: @"",
      @"appTransId": appTransId ?: @""
    });
    _currentPaymentResolve = nil;
    _currentPaymentReject = nil;
  }
}

- (void)paymentDidCanceled:(NSString *)zpTranstoken
                appTransId:(NSString *)appTransId {
  NSLog(@"[ZaloPayModule] ⚠️  paymentDidCanceled:");
  NSLog(@"[ZaloPayModule] ⚠️    zpTranstoken: %@", zpTranstoken ?: @"(nil)");
  NSLog(@"[ZaloPayModule] ⚠️    appTransId: %@", appTransId ?: @"(nil)");

  if (_currentPaymentResolve) {
    _currentPaymentResolve(@{
      @"returnCode": @4,
      @"returnMessage": @"Payment cancelled by user",
      @"zpTranstoken": zpTranstoken ?: @"",
      @"appTransId": appTransId ?: @""
    });
    _currentPaymentResolve = nil;
    _currentPaymentReject = nil;
  }
}

- (void)paymentDidError:(ZPPaymentErrorCode)errorCode
           zpTranstoken:(NSString *)zpTranstoken
              appTransId:(NSString *)appTransId {
  NSLog(@"[ZaloPayModule] ❌ paymentDidError:");
  NSLog(@"[ZaloPayModule] ❌   errorCode: %ld", (long)errorCode);
  NSLog(@"[ZaloPayModule] ❌   zpTranstoken: %@", zpTranstoken ?: @"(nil)");
  NSLog(@"[ZaloPayModule] ❌   appTransId: %@", appTransId ?: @"(nil)");

  if (_currentPaymentReject) {
    NSString *errorMsg = [NSString stringWithFormat:@"Payment error with code: %ld", (long)errorCode];
    _currentPaymentReject(@"payment_error", errorMsg, nil);
    _currentPaymentResolve = nil;
    _currentPaymentReject = nil;
  }
}

@end


