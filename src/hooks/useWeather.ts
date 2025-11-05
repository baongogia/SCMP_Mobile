import { useState, useEffect, useCallback } from "react";
import {
  WeatherData,
  WeatherState,
  WeatherLocation,
} from "@/src/types/weather";
import { weatherService } from "@/src/services/weather_show/weather/weatherService";
import { WEATHER_CONFIG } from "@/src/constants/config";
import { useLocation } from "./useLocation";

export const useWeather = (
  location?: WeatherLocation,
  useRealLocation: boolean = true
) => {
  const [weatherState, setWeatherState] = useState<WeatherState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  // Sử dụng real location nếu được yêu cầu
  const {
    location: realLocation,
    loading: locationLoading,
    error: locationError,
    getWeatherLocation,
    refreshLocation,
  } = useLocation({
    autoStart: useRealLocation,
    highAccuracy: false,
  });

  const fetchWeather = useCallback(
    async (weatherLocation?: WeatherLocation) => {
      let targetLocation = weatherLocation || location;

      // Nếu sử dụng real location và có location thực
      if (useRealLocation && realLocation) {
        targetLocation = getWeatherLocation();
      }

      if (!targetLocation) {
        setWeatherState((prev) => ({
          ...prev,
          error: useRealLocation
            ? "Đang lấy vị trí..."
            : "Location not provided",
          loading: useRealLocation ? locationLoading : false,
        }));
        return;
      }

      setWeatherState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const weatherData = await weatherService.getCurrentWeather(
          targetLocation
        );
        setWeatherState({
          data: weatherData,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        });
      } catch (error: any) {
        setWeatherState({
          data: null,
          loading: false,
          error: error.message,
          lastUpdated: null,
        });
      }
    },
    [
      location,
      useRealLocation,
      realLocation,
      getWeatherLocation,
      locationLoading,
    ]
  );

  const refreshWeather = useCallback(async () => {
    if (useRealLocation) {
      // Refresh location trước, sau đó fetch weather
      await refreshLocation();
    }
    fetchWeather();
  }, [fetchWeather, useRealLocation, refreshLocation]);

  // Auto-refresh weather data
  useEffect(() => {
    if (useRealLocation && !realLocation) return;
    if (!useRealLocation && !location) return;

    // Initial fetch
    fetchWeather();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      fetchWeather();
    }, WEATHER_CONFIG.REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [location, realLocation, fetchWeather, useRealLocation]);

  // Manual refresh when location changes
  useEffect(() => {
    if (useRealLocation && realLocation) {
      fetchWeather();
    } else if (!useRealLocation && location) {
      fetchWeather();
    }
  }, [
    realLocation?.latitude,
    realLocation?.longitude,
    location?.latitude,
    location?.longitude,
    fetchWeather,
    useRealLocation,
  ]);

  return {
    ...weatherState,
    refreshWeather,
    fetchWeather,
    location: useRealLocation ? realLocation : null,
    locationError,
  };
};

export const useWeatherByCity = (cityName?: string) => {
  const [weatherState, setWeatherState] = useState<WeatherState>({
    data: null,
    loading: false,
    error: null,
    lastUpdated: null,
  });

  const fetchWeatherByCity = useCallback(
    async (city?: string) => {
      const targetCity = city || cityName;

      if (!targetCity) {
        setWeatherState((prev) => ({
          ...prev,
          error: "City name not provided",
          loading: false,
        }));
        return;
      }

      setWeatherState((prev) => ({
        ...prev,
        loading: true,
        error: null,
      }));

      try {
        const weatherData = await weatherService.getCurrentWeatherByCity(
          targetCity
        );
        setWeatherState({
          data: weatherData,
          loading: false,
          error: null,
          lastUpdated: Date.now(),
        });
      } catch (error: any) {
        setWeatherState({
          data: null,
          loading: false,
          error: error.message,
          lastUpdated: null,
        });
      }
    },
    [cityName]
  );

  const refreshWeather = useCallback(() => {
    fetchWeatherByCity();
  }, [fetchWeatherByCity]);

  // Auto-refresh weather data
  useEffect(() => {
    if (!cityName) return;

    // Initial fetch
    fetchWeatherByCity();

    // Set up auto-refresh interval
    const interval = setInterval(() => {
      fetchWeatherByCity();
    }, WEATHER_CONFIG.REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [cityName, fetchWeatherByCity]);

  return {
    ...weatherState,
    refreshWeather,
    fetchWeatherByCity,
  };
};
