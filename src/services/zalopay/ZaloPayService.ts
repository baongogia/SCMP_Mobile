import { NativeModules, Platform } from "react-native";
import { showErrorToast } from "@/src/utils/errorHandler";

interface IZaloPayModule {
  initZaloPay(appId: string, uriScheme: string, environment: string): void;
  payOrder(zpTransToken: string): Promise<{
    returnCode: number;
    returnMessage: string;
  }>;
  checkZaloPayApp(): Promise<boolean>;
}

const ZaloPayModule = NativeModules.ZaloPayModule as IZaloPayModule;

console.log("ZaloPayModule available:", !!ZaloPayModule);
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
    if (ZaloPayModule) {
      try {
        return await ZaloPayModule.checkZaloPayApp();
      } catch (error) {
        showErrorToast(error, {
          title: "Lỗi kiểm tra ZaloPay",
          message: "Không thể kiểm tra ứng dụng ZaloPay",
        });
        return false;
      }
    }
    return false;
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

    if (!ZaloPayModule) {
      throw new Error("ZaloPay SDK not available on this platform");
    }

    if (!this.isInitialized) {
      console.warn("ZaloPay SDK not initialized, attempting to initialize...");
      // Try to initialize again
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
}

export default ZaloPayService.getInstance();
