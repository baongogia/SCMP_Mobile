#import <React/RCTBridgeModule.h>
#import <UIKit/UIKit.h>
#import <zpdk/ZPPaymentDelegate.h>

@interface ZaloPayModule : NSObject <RCTBridgeModule, ZPPaymentDelegate>
@end


