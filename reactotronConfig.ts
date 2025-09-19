import Reactotron from "reactotron-react-native";

// Only initialize in development; this file is required conditionally
// from the app root so it won't affect production bundles.
const reactotron = Reactotron.configure({ name: "Pool Center" })
  .useReactNative({
    networking: true,
  })
  .connect();

// Clear on each load for easier reading during dev sessions
try {
  reactotron.clear?.();
} catch {}

export default reactotron;
