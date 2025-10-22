import { NativeModules, Platform, Linking } from "react-native";
import { showErrorToast } from "@/src/utils/errorHandler";

interface IZaloPayModule {
  initZaloPay(appId: string, uriScheme: string, environment: string): void;
  payOrder(zpTransToken: string): Promise<{
    returnCode: number;
    returnMessage: string;
  }>;
  checkZaloPayApp(): Promise<boolean>;
}

const ZaloPayModule = (NativeModules as any)?.ZaloPayModule as
  | IZaloPayModule
  | undefined;

// Heuristics: if running on Expo Go, custom native modules (like ZaloPayModule) won't be loaded
const isExpoGo = !!(
  // classic RN Expo proxy keys present in Expo Go
  (
    (NativeModules as any).ExpoNativeModuleProxy ||
    (NativeModules as any).ExponentConstants ||
    (NativeModules as any).ExpoModulesCoreHostObject
  )
);

if (!ZaloPayModule) {
  console.warn(
    "[ZaloPay] Native module not found. Possibly Expo Go or not linked. Using deeplink fallback."
  );
}
console.log(
  "[ZaloPay] module available:",
  !!ZaloPayModule,
  "isExpoGo=",
  isExpoGo
);
export class ZaloPayService {
  private static instance: ZaloPayService;
  private isInitialized = false;

  static getInstance(): ZaloPayService {
    if (!ZaloPayService.instance) {
      ZaloPayService.instance = new ZaloPayService();
    }
    return ZaloPayService.instance;
  }

  async initialize(
    appId: string,
    environment: "sandbox" | "production" = "sandbox"
  ) {
    console.log("Initializing ZaloPay SDK...", {
      appId,
      environment,
      ZaloPayModule: !!ZaloPayModule,
    });

    if (!ZaloPayModule) {
      console.warn(
        `[ZaloPay] ZaloPayModule is missing. isExpoGo=${isExpoGo}. If you use Expo, build a dev client (npx expo run:android / run:ios).`
      );
      showErrorToast("ZaloPayModule is not available", {
        title: "Lỗi ZaloPay",
        message: "ZaloPayModule không khả dụng",
      });
      return;
    }

    try {
      if (Platform.OS === "ios") {
        ZaloPayModule.initZaloPay(appId, "myapp", environment);
      } else if (Platform.OS === "android") {
        ZaloPayModule.initZaloPay(appId, "myapp", environment);
      }
      this.isInitialized = true;
      console.log("ZaloPay SDK initialized successfully");
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi khởi tạo ZaloPay",
        message: "Không thể khởi tạo ZaloPay SDK",
      });
      this.isInitialized = false;
    }
  }

  async checkZaloPayInstalled(): Promise<boolean> {
    try {
      if (ZaloPayModule) {
        return await ZaloPayModule.checkZaloPayApp();
      }

      // Fallback: Assume ZaloPay is available if we can't detect it
      // This is safer than blocking payment when app is actually installed
      console.log(
        "[ZaloPay] Native module not available, assuming ZaloPay app is installed for fallback"
      );
      return true;
    } catch (error) {
      console.log("[ZaloPay] Error checking ZaloPay:", error);
      return true; // Assume available for fallback
    }
  }

  async payOrder(zpTransToken: string): Promise<{
    returnCode: number;
    returnMessage: string;
  }> {
    console.log("Attempting to pay order...", {
      isInitialized: this.isInitialized,
      hasZaloPayModule: !!ZaloPayModule,
      zpTransToken,
    });

    // If native module is available, prefer it
    if (ZaloPayModule) {
      if (!this.isInitialized) {
        console.warn(
          "ZaloPay SDK not initialized, attempting to initialize..."
        );
        await this.initialize("2554", "sandbox");
        if (!this.isInitialized) {
          throw new Error("ZaloPay SDK not initialized");
        }
      }
      try {
        return await ZaloPayModule.payOrder(zpTransToken);
      } catch (error) {
        showErrorToast(error, {
          title: "Lỗi thanh toán",
          message: "Có lỗi xảy ra khi thanh toán",
        });
        throw error;
      }
    }

    // Fallback path: try deeplink (Web-to-App) when native module is absent (e.g., running on Expo Go)
    try {
      const deepLink = `zalopay://app/pay?zptranstoken=${encodeURIComponent(
        zpTransToken
      )}`;
      const can = await Linking.canOpenURL(deepLink);
      if (!can) {
        throw new Error("Không tìm thấy ứng dụng ZaloPay để mở deeplink.");
      }
      await Linking.openURL(deepLink);
      // With pure deeplink we don't receive a synchronous returnCode;
      // return a neutral code and rely on your callback (deeplink back) to finalize state.
      return { returnCode: 0, returnMessage: "Opened ZaloPay via deeplink" };
    } catch (error) {
      showErrorToast(error, {
        title: "Lỗi thanh toán",
        message: "Không thể mở ZaloPay bằng deeplink",
      });
      throw error;
    }
  }
}

export default ZaloPayService.getInstance();
