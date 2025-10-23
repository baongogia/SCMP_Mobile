import * as Location from "expo-location";
import { Alert, Linking } from "react-native";
import { WeatherLocation } from "@/src/types/weather";

export interface LocationPermissionStatus {
  granted: boolean;
  canAskAgain: boolean;
  status: Location.LocationPermissionResponse["status"];
}

export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy?: number;
  altitude?: number;
  heading?: number;
  speed?: number;
  timestamp: number;
}

class LocationService {
  private lastKnownLocation: LocationData | null = null;
  private locationWatchSubscription: Location.LocationSubscription | null =
    null;

  /**
   * Kiểm tra và yêu cầu quyền truy cập vị trí
   */
  async requestLocationPermission(): Promise<LocationPermissionStatus> {
    try {
      // Kiểm tra quyền foreground location
      let { status } = await Location.getForegroundPermissionsAsync();

      if (status !== "granted") {
        // Yêu cầu quyền nếu chưa có
        const permissionResponse =
          await Location.requestForegroundPermissionsAsync();
        status = permissionResponse.status;
      }

      return {
        granted: status === "granted",
        canAskAgain: status !== "denied",
        status,
      };
    } catch (error) {
      console.error("Error requesting location permission:", error);
      return {
        granted: false,
        canAskAgain: false,
        status: "denied" as Location.PermissionStatus,
      };
    }
  }

  /**
   * Kiểm tra xem location services có được bật không
   */
  async isLocationEnabled(): Promise<boolean> {
    try {
      return await Location.hasServicesEnabledAsync();
    } catch (error) {
      console.error("Error checking location services:", error);
      return false;
    }
  }

  /**
   * Lấy vị trí hiện tại
   */
  async getCurrentLocation(): Promise<LocationData | null> {
    try {
      // Kiểm tra quyền truy cập
      const permission = await this.requestLocationPermission();
      if (!permission.granted) {
        this.showLocationPermissionAlert();
        return null;
      }

      // Kiểm tra location services
      const isEnabled = await this.isLocationEnabled();
      if (!isEnabled) {
        this.showLocationServicesAlert();
        return null;
      }

      // Lấy vị trí hiện tại
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
        timeInterval: 5000,
        distanceInterval: 10,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      };

      this.lastKnownLocation = locationData;
      return locationData;
    } catch (error) {
      console.error("Error getting current location:", error);
      return this.lastKnownLocation; // Fallback to last known location
    }
  }

  /**
   * Lấy vị trí với độ chính xác cao hơn
   */
  async getHighAccuracyLocation(): Promise<LocationData | null> {
    try {
      const permission = await this.requestLocationPermission();
      if (!permission.granted) {
        this.showLocationPermissionAlert();
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
        timeInterval: 10000,
        distanceInterval: 1,
      });

      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        accuracy: location.coords.accuracy || undefined,
        altitude: location.coords.altitude || undefined,
        heading: location.coords.heading || undefined,
        speed: location.coords.speed || undefined,
        timestamp: location.timestamp,
      };

      this.lastKnownLocation = locationData;
      return locationData;
    } catch (error) {
      console.error("Error getting high accuracy location:", error);
      return this.lastKnownLocation;
    }
  }

  /**
   * Lấy vị trí theo tên địa điểm
   */
  async getLocationFromAddress(address: string): Promise<LocationData | null> {
    try {
      const geocodeResult = await Location.geocodeAsync(address);
      if (geocodeResult.length > 0) {
        const location = geocodeResult[0];
        return {
          latitude: location.latitude,
          longitude: location.longitude,
          timestamp: Date.now(),
        };
      }
      return null;
    } catch (error) {
      console.error("Error geocoding address:", error);
      return null;
    }
  }

  /**
   * Lấy địa chỉ từ tọa độ
   */
  async getAddressFromLocation(
    latitude: number,
    longitude: number
  ): Promise<string | null> {
    try {
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const parts = [
          address.city,
          address.district,
          address.subregion,
          address.region,
          address.country,
        ].filter(Boolean);

        return parts.join(", ");
      }
      return null;
    } catch (error) {
      console.error("Error reverse geocoding:", error);
      return null;
    }
  }

  /**
   * Theo dõi vị trí liên tục
   */
  async startLocationWatch(
    callback: (location: LocationData) => void,
    options: {
      accuracy?: Location.Accuracy;
      timeInterval?: number;
      distanceInterval?: number;
    } = {}
  ): Promise<boolean> {
    try {
      const permission = await this.requestLocationPermission();
      if (!permission.granted) {
        this.showLocationPermissionAlert();
        return false;
      }

      // Dừng watch cũ nếu có
      if (this.locationWatchSubscription) {
        this.locationWatchSubscription.remove();
      }

      this.locationWatchSubscription = await Location.watchPositionAsync(
        {
          accuracy: options.accuracy || Location.Accuracy.Balanced,
          timeInterval: options.timeInterval || 10000,
          distanceInterval: options.distanceInterval || 10,
        },
        (location) => {
          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            accuracy: location.coords.accuracy || undefined,
            altitude: location.coords.altitude || undefined,
            heading: location.coords.heading || undefined,
            speed: location.coords.speed || undefined,
            timestamp: location.timestamp,
          };
          callback(locationData);
        }
      );

      return true;
    } catch (error) {
      console.error("Error starting location watch:", error);
      return false;
    }
  }

  /**
   * Dừng theo dõi vị trí
   */
  stopLocationWatch(): void {
    if (this.locationWatchSubscription) {
      this.locationWatchSubscription.remove();
      this.locationWatchSubscription = null;
    }
  }

  /**
   * Lấy vị trí cuối cùng đã biết
   */
  getLastKnownLocation(): LocationData | null {
    return this.lastKnownLocation;
  }

  /**
   * Chuyển đổi LocationData thành WeatherLocation
   */
  convertToWeatherLocation(locationData: LocationData): WeatherLocation {
    return {
      latitude: locationData.latitude,
      longitude: locationData.longitude,
    };
  }

  /**
   * Hiển thị alert yêu cầu quyền truy cập vị trí
   */
  private showLocationPermissionAlert(): void {
    Alert.alert(
      "Quyền truy cập vị trí",
      "Ứng dụng cần quyền truy cập vị trí để hiển thị thời tiết chính xác. Vui lòng cấp quyền trong Cài đặt.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Cài đặt",
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  }

  /**
   * Hiển thị alert yêu cầu bật location services
   */
  private showLocationServicesAlert(): void {
    Alert.alert(
      "Dịch vụ vị trí",
      "Vui lòng bật dịch vụ vị trí trong Cài đặt để sử dụng tính năng thời tiết.",
      [
        { text: "Hủy", style: "cancel" },
        {
          text: "Cài đặt",
          onPress: () => Linking.openSettings(),
        },
      ]
    );
  }
}

export const locationService = new LocationService();
export default locationService;
