// Test ZaloPay detection trong app
import { Linking, Platform } from "react-native";

export const testZaloPayInApp = async () => {
  console.log("=== ZaloPay In-App Test ===");
  console.log("Platform:", Platform.OS);

  const schemes =
    Platform.OS === "ios"
      ? ["zalopay://", "zalopay.api.v2://"]
      : ["zalopay://"];

  const probeDeepLinks = schemes.map(
    (s) => `${s.replace(/:\/\//, "://")}app/pay`
  );
  const allSchemes = [...schemes, ...probeDeepLinks];

  console.log("Testing schemes:", allSchemes);

  for (const scheme of allSchemes) {
    try {
      const canOpen = await Linking.canOpenURL(scheme);
      console.log(`canOpenURL(${scheme}):`, canOpen);
    } catch (error) {
      console.log(`Error testing ${scheme}:`, error.message);
    }
  }

  // Test actual deeplink
  const testToken = "test123";
  const deepLink = `zalopay://app/pay?zptranstoken=${encodeURIComponent(
    testToken
  )}`;
  console.log("Test deeplink:", deepLink);

  try {
    const canOpenDeepLink = await Linking.canOpenURL(deepLink);
    console.log("canOpenURL(deeplink):", canOpenDeepLink);

    if (canOpenDeepLink) {
      console.log("Opening ZaloPay...");
      await Linking.openURL(deepLink);
    }
  } catch (error) {
    console.log("Error testing deeplink:", error.message);
  }
};
