import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "@/src/constants/colors";
import { WeatherData } from "@/src/types/weather";
import { weatherService } from "@/src/services/weather_show/weather/weatherService";

interface WeatherWidgetProps {
  weatherData: WeatherData | null;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
  compact?: boolean;
  showLocation?: boolean;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({
  weatherData,
  loading = false,
  error = null,
  onRefresh,
  compact = false,
  showLocation = true,
}) => {
  if (loading) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <ActivityIndicator size="small" color={colors.white} />
        <Text style={styles.loadingText}>Đang tải thời tiết...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, compact && styles.compactContainer]}>
        <Ionicons name="warning-outline" size={16} color={colors.white} />
        <Text style={styles.errorText}>Không thể tải thời tiết</Text>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={styles.retryButton}>
            <Ionicons name="refresh" size={14} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (!weatherData) {
    return null;
  }

  const { main, weather, name } = weatherData;
  const weatherCondition = weather[0];
  const temperature = Math.round(main.temp);
  const description = weatherService.getVietnameseWeatherDescription(
    weatherCondition.description
  );

  const getWeatherIcon = (iconCode: string) => {
    const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
      "01d": "sunny",
      "01n": "moon",
      "02d": "partly-sunny",
      "02n": "cloudy-night",
      "03d": "cloudy",
      "03n": "cloudy",
      "04d": "cloudy",
      "04n": "cloudy",
      "09d": "rainy",
      "09n": "rainy",
      "10d": "rainy",
      "10n": "rainy",
      "11d": "thunderstorm",
      "11n": "thunderstorm",
      "13d": "snow",
      "13n": "snow",
      "50d": "partly-sunny",
      "50n": "cloudy-night",
    };
    return iconMap[iconCode] || "partly-sunny";
  };

  if (compact) {
    return (
      <View style={styles.compactContainer}>
        <View style={styles.compactWeatherRow}>
          <Ionicons
            name={getWeatherIcon(weatherCondition.icon)}
            size={18}
            color={colors.white}
          />
          <Text style={styles.compactTemperature}>{temperature}°</Text>
        </View>
        <Text style={styles.compactDescription}>{description}</Text>
        {showLocation && <Text style={styles.compactLocation}>{name}</Text>}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.weatherHeader}>
        <View style={styles.weatherMain}>
          <Ionicons
            name={getWeatherIcon(weatherCondition.icon)}
            size={32}
            color={colors.white}
          />
          <View style={styles.temperatureContainer}>
            <Text style={styles.temperature}>{temperature}°C</Text>
            <Text style={styles.description}>{description}</Text>
          </View>
        </View>
        {onRefresh && (
          <TouchableOpacity onPress={onRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={20} color={colors.white} />
          </TouchableOpacity>
        )}
      </View>

      {showLocation && (
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color={colors.white} />
          <Text style={styles.locationText}>{name}</Text>
        </View>
      )}

      <View style={styles.weatherDetails}>
        <View style={styles.detailItem}>
          <Ionicons name="water" size={16} color={colors.white} />
          <Text style={styles.detailText}>{main.humidity}%</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="speedometer" size={16} color={colors.white} />
          <Text style={styles.detailText}>{main.pressure} hPa</Text>
        </View>
        <View style={styles.detailItem}>
          <Ionicons name="thermometer" size={16} color={colors.white} />
          <Text style={styles.detailText}>
            Cảm giác {Math.round(main.feels_like)}°C
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "rgba(255,255,255,0.1)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  compactContainer: {
    backgroundColor: "transparent",
    padding: 0,
    borderWidth: 0,
  },
  weatherHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  weatherMain: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  temperatureContainer: {
    marginLeft: 12,
  },
  temperature: {
    fontSize: 28,
    fontWeight: "800",
    color: colors.white,
    lineHeight: 32,
  },
  description: {
    fontSize: 14,
    color: colors.white,
    opacity: 0.9,
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  retryButton: {
    padding: 4,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginLeft: 8,
  },
  locationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  locationText: {
    fontSize: 12,
    color: colors.white,
    opacity: 0.8,
    marginLeft: 4,
  },
  weatherDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  detailText: {
    fontSize: 11,
    color: colors.white,
    opacity: 0.8,
    marginLeft: 4,
  },
  // Compact styles
  compactWeatherRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  compactTemperature: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.white,
    marginLeft: 6,
  },
  compactDescription: {
    fontSize: 10,
    color: colors.white,
    opacity: 0.9,
    marginBottom: 2,
  },
  compactLocation: {
    fontSize: 9,
    color: colors.white,
    opacity: 0.7,
  },
  loadingText: {
    fontSize: 12,
    color: colors.white,
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: colors.white,
    marginLeft: 8,
    flex: 1,
  },
});

export default WeatherWidget;
