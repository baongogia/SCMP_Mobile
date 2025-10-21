import React, {
  createContext,
  useContext,
  useState,
  useRef,
  useEffect,
} from "react";
import { Animated } from "react-native";

interface BottomTabContextType {
  isVisible: boolean;
  showTab: () => void;
  hideTab: () => void;
  animatedValue: Animated.Value;
}

const BottomTabContext = createContext<BottomTabContextType | undefined>(
  undefined
);

export const useBottomTab = () => {
  const context = useContext(BottomTabContext);
  if (!context) {
    throw new Error("useBottomTab must be used within a BottomTabProvider");
  }
  return context;
};

interface BottomTabProviderProps {
  children: React.ReactNode;
}

export const BottomTabProvider: React.FC<BottomTabProviderProps> = ({
  children,
}) => {
  const [isVisible, setIsVisible] = useState(true);
  const animatedValue = useRef(new Animated.Value(1)).current;

  const showTab = () => {
    setIsVisible(true);
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  const hideTab = () => {
    setIsVisible(false);
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  };

  return (
    <BottomTabContext.Provider
      value={{
        isVisible,
        showTab,
        hideTab,
        animatedValue,
      }}
    >
      {children}
    </BottomTabContext.Provider>
  );
};
