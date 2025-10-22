import { useState, useEffect, useCallback } from "react";
import {
  LocationData,
  LocationPermissionStatus,
} from "@/src/services/location/locationService";
import { locationService } from "@/src/services/location/locationService";
import { WeatherLocation } from "@/src/types/weather";

export interface LocationState {
  location: LocationData | null;
  loading: boolean;
  error: string | null;
  permission: LocationPermissionStatus | null;
  isWatching: boolean;
}

export const useLocation = (
  options: {
    autoStart?: boolean;
    highAccuracy?: boolean;
    watchLocation?: boolean;
    watchOptions?: {
      accuracy?: any;
      timeInterval?: number;
      distanceInterval?: number;
    };
  } = {}
) => {
  const {
    autoStart = true,
    highAccuracy = false,
    watchLocation = false,
    watchOptions = {},
  } = options;

  const [state, setState] = useState<LocationState>({
    location: null,
    loading: false,
    error: null,
    permission: null,
    isWatching: false,
  });

  const getCurrentLocation = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      // Kiểm tra quyền trước
      const permission = await locationService.requestLocationPermission();
      setState((prev) => ({ ...prev, permission }));

      if (!permission.granted) {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Không có quyền truy cập vị trí",
        }));
        return null;
      }

      // Lấy vị trí
      const location = highAccuracy
        ? await locationService.getHighAccuracyLocation()
        : await locationService.getCurrentLocation();

      if (location) {
        setState((prev) => ({
          ...prev,
          location,
          loading: false,
          error: null,
        }));
        return location;
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Không thể lấy vị trí hiện tại",
        }));
        return null;
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Lỗi khi lấy vị trí",
      }));
      return null;
    }
  }, [highAccuracy]);

  const startWatching = useCallback(async () => {
    if (state.isWatching) return;

    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const success = await locationService.startLocationWatch((location) => {
        setState((prev) => ({
          ...prev,
          location,
          loading: false,
          error: null,
        }));
      }, watchOptions);

      if (success) {
        setState((prev) => ({ ...prev, isWatching: true, loading: false }));
      } else {
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Không thể bắt đầu theo dõi vị trí",
        }));
      }
    } catch (error: any) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: error.message || "Lỗi khi bắt đầu theo dõi vị trí",
      }));
    }
  }, [state.isWatching, watchOptions]);

  const stopWatching = useCallback(() => {
    locationService.stopLocationWatch();
    setState((prev) => ({ ...prev, isWatching: false }));
  }, []);

  const refreshLocation = useCallback(() => {
    return getCurrentLocation();
  }, [getCurrentLocation]);

  const getWeatherLocation = useCallback((): WeatherLocation | null => {
    if (!state.location) return null;
    return locationService.convertToWeatherLocation(state.location);
  }, [state.location]);

  const getAddressFromLocation = useCallback(async (): Promise<
    string | null
  > => {
    if (!state.location) return null;

    try {
      return await locationService.getAddressFromLocation(
        state.location.latitude,
        state.location.longitude
      );
    } catch (error) {
      console.error("Error getting address:", error);
      return null;
    }
  }, [state.location]);

  // Auto start location tracking
  useEffect(() => {
    if (autoStart && !state.location && !state.loading) {
      if (watchLocation) {
        startWatching();
      } else {
        getCurrentLocation();
      }
    }
  }, [
    autoStart,
    watchLocation,
    state.location,
    state.loading,
    getCurrentLocation,
    startWatching,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (state.isWatching) {
        stopWatching();
      }
    };
  }, [state.isWatching, stopWatching]);

  return {
    ...state,
    getCurrentLocation,
    startWatching,
    stopWatching,
    refreshLocation,
    getWeatherLocation,
    getAddressFromLocation,
  };
};

export default useLocation;
