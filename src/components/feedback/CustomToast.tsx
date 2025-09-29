import React from "react";
import { StyleSheet, Animated } from "react-native";
import { BaseToast, ToastConfig } from "react-native-toast-message";

const CustomToast = ({ text1 = "", text2 = "", ...rest }) => {
  const slideAnim = new Animated.Value(-300);

  React.useEffect(() => {
    Animated.timing(slideAnim, {
      toValue: 0, // Slide to the screen
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [slideAnim]);

  return (
    <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
      <BaseToast
        {...rest}
        style={styles.toast}
        contentContainerStyle={styles.contentContainer}
        text1Style={styles.text1}
        text2Style={styles.text2}
        text1={text1}
        text2={text2}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  toast: {
    borderLeftColor: "#FF0000",
    marginTop: 30,
  },
  contentContainer: {
    paddingHorizontal: 15,
  },
  text1: {
    fontSize: 15,
    fontWeight: "bold",
  },
  text2: {
    fontSize: 13,
    color: "gray",
  },
});

export const toastConfig: ToastConfig = {
  error: (props) => <CustomToast {...props} />,
};

export default CustomToast;
