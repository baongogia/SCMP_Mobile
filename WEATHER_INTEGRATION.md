# Weather Integration với OpenWeather API + Expo Location

## Tổng quan

Ứng dụng đã được tích hợp dữ liệu thời tiết thời gian thực từ OpenWeather API kết hợp với Expo Location để hiển thị thông tin thời tiết chính xác dựa trên vị trí thực của người dùng.

## Cấu hình

### API Key

API key OpenWeather đã được cấu hình: `e5c2d564f0e36c0acafaf3ab5503b65d`

### Cấu hình trong code

```typescript
// src/constants/config.ts
export const WEATHER_CONFIG = {
  API_KEY:
    process.env.EXPO_PUBLIC_OPENWEATHER_API_KEY ||
    "e5c2d564f0e36c0acafaf3ab5503b65d",
  BASE_URL: "https://api.openweathermap.org/data/2.5",
  UNITS: "metric", // Celsius
  LANGUAGE: "vi", // Vietnamese
  REFRESH_INTERVAL: 10 * 60 * 1000, // 10 minutes
};
```

## Các thành phần đã tạo

### 1. Types và Interfaces

- `src/types/weather.ts` - Định nghĩa các interface cho dữ liệu thời tiết

### 2. Weather Service

- `src/services/weather/weatherService.ts` - Service để gọi API OpenWeather
- Hỗ trợ lấy thời tiết hiện tại và dự báo
- Tự động dịch mô tả thời tiết sang tiếng Việt

### 3. Custom Hooks

- `src/hooks/useWeather.ts` - Hook để quản lý state thời tiết với real location
- `src/hooks/useLocation.ts` - Hook để quản lý vị trí thực của người dùng
- Tự động refresh mỗi 10 phút
- Hỗ trợ location-based và city-based weather
- Tự động lấy vị trí thực và cập nhật thời tiết

### 4. Weather Components

- `src/components/custom/weather/WeatherWidget.tsx` - Component hiển thị thời tiết
- `src/components/custom/weather/WeatherExample.tsx` - Component ví dụ sử dụng

### 5. Location Service

- `src/services/location/locationService.ts` - Service để quản lý vị trí thực
- Tự động xin quyền truy cập vị trí
- Hỗ trợ high accuracy location
- Error handling và fallback

### 6. Integration

- `WelcomeSection` đã được cập nhật để sử dụng vị trí thực và dữ liệu thời tiết
- Cả instructor và member screens đã được tích hợp
- Tự động lấy vị trí thực của người dùng

## Cách sử dụng

### 1. Sử dụng Weather Hook với Real Location

```typescript
import { useWeather } from "@/src/hooks/useWeather";

// Sử dụng vị trí thực của người dùng
const {
  data: weatherData,
  loading,
  error,
  refreshWeather,
  location: realLocation,
  locationError,
} = useWeather(undefined, true); // true = sử dụng real location

// Hoặc sử dụng location cụ thể
const weatherData = useWeather({
  latitude: 10.8231,
  longitude: 106.6297,
}, false); // false = không sử dụng real location
```

### 2. Sử dụng Location Hook

```typescript
import { useLocation } from "@/src/hooks/useLocation";

const {
  location,
  loading,
  error,
  permission,
  getCurrentLocation,
  refreshLocation,
  getAddressFromLocation,
} = useLocation({
  autoStart: true,
  highAccuracy: false,
  watchLocation: false,
});
```

### 3. Sử dụng Weather Service trực tiếp

```typescript
import { weatherService } from "@/src/services/weather/weatherService";

// Lấy thời tiết theo tọa độ
const weatherData = await weatherService.getCurrentWeather({
  latitude: 10.8231,
  longitude: 106.6297,
});

// Lấy thời tiết theo tên thành phố
const weatherData = await weatherService.getCurrentWeatherByCity(
  "Ho Chi Minh City"
);
```

### 4. Sử dụng Weather Widget

```typescript
import { WeatherWidget } from "@/src/components/custom/weather/WeatherWidget";

<WeatherWidget
  weatherData={weatherData}
  loading={loading}
  error={error}
  onRefresh={refreshWeather}
  compact={false}
  showLocation={true}
/>;
```

## Tính năng

### 1. Dữ liệu thời tiết thời gian thực

- Nhiệt độ hiện tại
- Mô tả thời tiết (đã dịch sang tiếng Việt)
- Độ ẩm, áp suất, tốc độ gió
- Tầm nhìn

### 2. Vị trí thực của người dùng

- Tự động lấy vị trí GPS thực
- Xin quyền truy cập vị trí tự động
- Hỗ trợ high accuracy location
- Fallback khi không có quyền truy cập

### 3. Tự động refresh

- Refresh mỗi 10 phút
- Có thể refresh thủ công
- Tự động cập nhật khi vị trí thay đổi

### 4. Error handling

- Xử lý lỗi khi không có mạng
- Xử lý lỗi khi không có quyền truy cập vị trí
- Fallback về dữ liệu mặc định
- Hiển thị thông báo hướng dẫn người dùng

### 5. UI/UX

- Hiển thị loading state
- Error state với nút retry
- Compact mode cho không gian nhỏ
- Hiển thị vị trí thực trong UI

## Cấu hình môi trường

Để sử dụng API key từ environment variable, tạo file `.env`:

```bash
EXPO_PUBLIC_OPENWEATHER_API_KEY=e5c2d564f0e36c0acafaf3ab5503b65d
```

## Lưu ý

1. API key đã được hardcode trong config để dễ sử dụng
2. Có thể thay đổi location trong WelcomeSection props
3. Weather data được cache và tự động refresh
4. Hỗ trợ cả location-based và city-based weather

## Testing

Để test weather integration:

1. Chạy app và kiểm tra WelcomeSection
2. Weather data sẽ hiển thị thông tin thực từ OpenWeather API
3. Kiểm tra auto-refresh sau 10 phút
4. Test error handling khi không có mạng
