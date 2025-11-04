import { NativeModules, Platform } from "react-native";
import { showErrorToast } from "@/src/utils/errorHandler";

interface IZaloPayModule {
  initZaloPay(appId: string, uriScheme: string, environment: string): void;
  payOrder(orderUrl: string): Promise<{
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
    console.log("═══════════════════════════════════════════════════");
    console.log("🔧 [ZaloPayService] Initializing ZaloPay SDK...");
    console.log("═══════════════════════════════════════════════════");
    console.log("🔧 [ZaloPayService] appId:", appId);
    console.log("🔧 [ZaloPayService] environment:", environment);
    console.log(
      "🔧 [ZaloPayService] ZaloPayModule available:",
      !!ZaloPayModule
    );
    console.log("🔧 [ZaloPayService] Platform.OS:", Platform.OS);
    console.log("🔧 [ZaloPayService] isExpoGo:", isExpoGo);
    console.log("🔧 [ZaloPayService] uriScheme: myapp");

    if (!ZaloPayModule) {
      console.warn(
        `⚠️ [ZaloPayService] ZaloPayModule is missing. isExpoGo=${isExpoGo}. If you use Expo, build a dev client (npx expo run:android / run:ios).`
      );
      showErrorToast("ZaloPayModule is not available", {
        title: "Lỗi ZaloPay",
        message: "ZaloPayModule không khả dụng",
      });
      return;
    }

    try {
      console.log("🚀 [ZaloPayService] Gọi ZaloPayModule.initZaloPay()...");
      console.log("🚀 [ZaloPayService] Parameters:", {
        appId,
        uriScheme: "myapp",
        environment,
      });

      if (Platform.OS === "ios") {
        ZaloPayModule.initZaloPay(appId, "myapp", environment);
        console.log("✅ [ZaloPayService] iOS initZaloPay called successfully");
      } else if (Platform.OS === "android") {
        ZaloPayModule.initZaloPay(appId, "myapp", environment);
        console.log(
          "✅ [ZaloPayService] Android initZaloPay called successfully"
        );
      }

      this.isInitialized = true;
      console.log("✅ [ZaloPayService] ZaloPay SDK initialized successfully");
      console.log(
        "✅ [ZaloPayService] isInitialized flag:",
        this.isInitialized
      );
    } catch (error: any) {
      console.error("❌ [ZaloPayService] Lỗi khi khởi tạo ZaloPay SDK:");
      console.error("❌ [ZaloPayService] Error:", error);
      console.error("❌ [ZaloPayService] Error message:", error?.message);
      console.error("❌ [ZaloPayService] Error stack:", error?.stack);

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

  async payOrder(
    zpTransToken: string,
    orderUrl?: string
  ): Promise<{
    returnCode: number;
    returnMessage: string;
  }> {
    console.log("═══════════════════════════════════════════════════");
    console.log("🔧 [ZaloPayService] payOrder() được gọi");
    console.log("═══════════════════════════════════════════════════");
    console.log("🔧 [ZaloPayService] zpTransToken nhận được:", zpTransToken);
    console.log("🔧 [ZaloPayService] orderUrl nhận được:", orderUrl);
    console.log("🔧 [ZaloPayService] isInitialized:", this.isInitialized);
    console.log("🔧 [ZaloPayService] hasZaloPayModule:", !!ZaloPayModule);
    console.log("🔧 [ZaloPayService] Platform.OS:", Platform.OS);

    // Chỉ sử dụng native module, không có fallback
    if (!ZaloPayModule) {
      const errorMsg =
        "ZaloPayModule không khả dụng. Vui lòng build app với native module (npx expo run:ios)";
      console.error("❌ [ZaloPayService]", errorMsg);
      showErrorToast(new Error(errorMsg), {
        title: "Lỗi ZaloPay",
        message: errorMsg,
      });
      throw new Error(errorMsg);
    }

    if (!orderUrl) {
      const errorMsg = "orderUrl không được cung cấp";
      console.error("❌ [ZaloPayService]", errorMsg);
      throw new Error(errorMsg);
    }

    console.log(
      "✅ [ZaloPayService] ZaloPayModule có sẵn, sử dụng native module"
    );

    if (!this.isInitialized) {
      console.warn(
        "⚠️ [ZaloPayService] ZaloPay SDK not initialized, attempting to initialize..."
      );
      await this.initialize("2554", "sandbox");
      if (!this.isInitialized) {
        console.error("❌ [ZaloPayService] Không thể khởi tạo ZaloPay SDK");
        throw new Error("ZaloPay SDK not initialized");
      }
    }

    console.log(
      "🚀 [ZaloPayService] Gọi ZaloPayModule.payOrder() với orderUrl:",
      orderUrl
    );

    try {
      const result = await ZaloPayModule.payOrder(orderUrl);
      console.log(
        "✅ [ZaloPayService] Kết quả từ native module:",
        JSON.stringify(result, null, 2)
      );
      console.log("✅ [ZaloPayService] returnCode:", result?.returnCode);
      console.log("✅ [ZaloPayService] returnMessage:", result?.returnMessage);
      return result;
    } catch (error: any) {
      console.error("❌ [ZaloPayService] Lỗi từ native module:");
      console.error("❌ [ZaloPayService] Error:", error);
      console.error("❌ [ZaloPayService] Error type:", typeof error);
      console.error("❌ [ZaloPayService] Error message:", error?.message);
      console.error("❌ [ZaloPayService] Error code:", error?.code);
      console.error("❌ [ZaloPayService] Error stack:", error?.stack);
      console.error(
        "❌ [ZaloPayService] Full error object:",
        JSON.stringify(error, null, 2)
      );

      showErrorToast(error, {
        title: "Lỗi thanh toán",
        message: "Có lỗi xảy ra khi thanh toán",
      });
      throw error;
    }
  }
}

export default ZaloPayService.getInstance();
