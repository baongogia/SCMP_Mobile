import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { WeatherWidget } from "./WeatherWidget";
import { useWeather } from "@/src/hooks/useWeather";
import { WeatherLocation } from "@/src/types/weather";

interface WeatherExampleProps {
  location?: WeatherLocation;
}

export const WeatherExample: React.FC<WeatherExampleProps> = ({
  location = {
    latitude: 10.8231,
    longitude: 106.6297,
    city: "Ho Chi Minh City",
    country: "VN",
  },
}) => {
  const {
    data: weatherData,
    loading,
    error,
    refreshWeather,
  } = useWeather(location);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Thời tiết hiện tại</Text>

      <WeatherWidget
        weatherData={weatherData}
        loading={loading}
        error={error}
        onRefresh={refreshWeather}
        showLocation={true}
      />

      {weatherData && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailsTitle}>Chi tiết thời tiết</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Nhiệt độ</Text>
              <Text style={styles.detailValue}>
                {Math.round(weatherData.main.temp)}°C
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Cảm giác như</Text>
              <Text style={styles.detailValue}>
                {Math.round(weatherData.main.feels_like)}°C
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Độ ẩm</Text>
              <Text style={styles.detailValue}>
                {weatherData.main.humidity}%
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Áp suất</Text>
              <Text style={styles.detailValue}>
                {weatherData.main.pressure} hPa
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tốc độ gió</Text>
              <Text style={styles.detailValue}>
                {weatherData.wind.speed} m/s
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Tầm nhìn</Text>
              <Text style={styles.detailValue}>
                {weatherData.visibility / 1000} km
              </Text>
            </View>
          </View>
        </View>
      )}

      <TouchableOpacity style={styles.refreshButton} onPress={refreshWeather}>
        <Text style={styles.refreshButtonText}>Làm mới thời tiết</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8f9fa",
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 16,
  },
  detailsContainer: {
    marginTop: 16,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  detailsTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#2c3e50",
    marginBottom: 12,
  },
  detailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  detailItem: {
    width: "48%",
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#7f8c8d",
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2c3e50",
  },
  refreshButton: {
    backgroundColor: "#3498db",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    marginTop: 16,
    alignItems: "center",
  },
  refreshButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
});

export default WeatherExample;
