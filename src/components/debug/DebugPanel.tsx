import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { flipperStorage } from "../../utils/flipperStorage";
import { colors } from "../../constants/colors";

interface DebugPanelProps {
  visible?: boolean;
  onClose?: () => void;
}

export const DebugPanel: React.FC<DebugPanelProps> = ({
  visible = false,
  onClose,
}) => {
  const [storageData, setStorageData] = useState<Record<string, any>>({});
  const [isLoading, setIsLoading] = useState(false);

  const loadStorageData = async () => {
    setIsLoading(true);
    try {
      const keys = await flipperStorage.getAllKeys();
      const data: Record<string, any> = {};

      for (const key of keys) {
        const value = await flipperStorage.getItem(key);
        try {
          data[key] = value ? JSON.parse(value) : value;
        } catch {
          data[key] = value;
        }
      }

      setStorageData(data);
    } catch (error) {
      console.error("Error loading storage data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const clearStorage = () => {
    Alert.alert(
      "Clear Storage",
      "Are you sure you want to clear all storage data?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            try {
              await flipperStorage.clear();
              setStorageData({});
              Alert.alert("Success", "Storage cleared successfully");
            } catch (error) {
              Alert.alert("Error", "Failed to clear storage");
            }
          },
        },
      ]
    );
  };

  const testAPI = async () => {
    try {
      // Test API call
      const response = await fetch(
        "https://jsonplaceholder.typicode.com/posts/1"
      );
      const data = await response.json();
      Alert.alert("API Test", `Success: ${data.title}`);
    } catch (error) {
      Alert.alert("API Test", `Error: ${error}`);
    }
  };

  useEffect(() => {
    if (visible) {
      loadStorageData();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.panel}>
        <View style={styles.header}>
          <Text style={styles.title}>🔧 Debug Panel</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Storage Data</Text>
            <TouchableOpacity
              onPress={loadStorageData}
              style={styles.button}
              disabled={isLoading}
            >
              <Text style={styles.buttonText}>
                {isLoading ? "Loading..." : "Refresh Storage"}
              </Text>
            </TouchableOpacity>

            {Object.keys(storageData).length > 0 ? (
              Object.entries(storageData).map(([key, value]) => (
                <View key={key} style={styles.storageItem}>
                  <Text style={styles.storageKey}>{key}:</Text>
                  <Text style={styles.storageValue}>
                    {typeof value === "object"
                      ? JSON.stringify(value, null, 2)
                      : String(value)}
                  </Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No storage data found</Text>
            )}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Actions</Text>
            <TouchableOpacity onPress={testAPI} style={styles.button}>
              <Text style={styles.buttonText}>Test API Call</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={clearStorage}
              style={[styles.button, styles.dangerButton]}
            >
              <Text style={styles.buttonText}>Clear Storage</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    zIndex: 1000,
  },
  panel: {
    position: "absolute",
    top: 50,
    left: 20,
    right: 20,
    bottom: 50,
    backgroundColor: colors.white,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: colors.lightGray,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: colors.primary,
  },
  closeButton: {
    padding: 5,
  },
  closeText: {
    fontSize: 20,
    color: colors.gray,
  },
  content: {
    flex: 1,
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 10,
    color: colors.primary,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  dangerButton: {
    backgroundColor: colors.error,
  },
  buttonText: {
    color: colors.white,
    textAlign: "center",
    fontWeight: "bold",
  },
  storageItem: {
    marginBottom: 10,
    padding: 10,
    backgroundColor: colors.lightGray,
    borderRadius: 5,
  },
  storageKey: {
    fontWeight: "bold",
    color: colors.primary,
    marginBottom: 5,
  },
  storageValue: {
    color: colors.darkGray,
    fontSize: 12,
  },
  emptyText: {
    color: colors.gray,
    fontStyle: "italic",
  },
});
