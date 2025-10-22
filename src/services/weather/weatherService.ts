import axios from "axios";
import { WEATHER_CONFIG } from "@/src/constants/config";
import {
  WeatherData,
  WeatherForecast,
  WeatherLocation,
  WeatherError,
} from "@/src/types/weather";

class WeatherService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = WEATHER_CONFIG.BASE_URL;
    this.apiKey = WEATHER_CONFIG.API_KEY;
  }

  private buildURL(endpoint: string, params: Record<string, any> = {}): string {
    const url = new URL(`${this.baseURL}${endpoint}`);

    // Add API key
    url.searchParams.append("appid", this.apiKey);

    // Add default parameters
    url.searchParams.append("units", WEATHER_CONFIG.UNITS);
    url.searchParams.append("lang", WEATHER_CONFIG.LANGUAGE);

    // Add custom parameters
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        url.searchParams.append(key, String(value));
      }
    });

    return url.toString();
  }

  async getCurrentWeather(location: WeatherLocation): Promise<WeatherData> {
    try {
      if (!this.apiKey) {
        throw new Error("OpenWeather API key is not configured");
      }

      const url = this.buildURL("/weather", {
        lat: location.latitude,
        lon: location.longitude,
      });

      const response = await axios.get<WeatherData>(url, {
        timeout: 10000, // 10 seconds timeout
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const weatherError = error.response.data as WeatherError;
        throw new Error(`Weather API Error: ${weatherError.message}`);
      }
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }

  async getCurrentWeatherByCity(cityName: string): Promise<WeatherData> {
    try {
      if (!this.apiKey) {
        throw new Error("OpenWeather API key is not configured");
      }

      const url = this.buildURL("/weather", {
        q: cityName,
      });

      const response = await axios.get<WeatherData>(url, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const weatherError = error.response.data as WeatherError;
        throw new Error(`Weather API Error: ${weatherError.message}`);
      }
      throw new Error(`Failed to fetch weather data: ${error.message}`);
    }
  }

  async getWeatherForecast(
    location: WeatherLocation,
    days: number = 5
  ): Promise<WeatherForecast> {
    try {
      if (!this.apiKey) {
        throw new Error("OpenWeather API key is not configured");
      }

      const url = this.buildURL("/forecast", {
        lat: location.latitude,
        lon: location.longitude,
        cnt: days * 8, // 8 forecasts per day (every 3 hours)
      });

      const response = await axios.get<WeatherForecast>(url, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const weatherError = error.response.data as WeatherError;
        throw new Error(`Weather API Error: ${weatherError.message}`);
      }
      throw new Error(`Failed to fetch weather forecast: ${error.message}`);
    }
  }

  async getWeatherForecastByCity(
    cityName: string,
    days: number = 5
  ): Promise<WeatherForecast> {
    try {
      if (!this.apiKey) {
        throw new Error("OpenWeather API key is not configured");
      }

      const url = this.buildURL("/forecast", {
        q: cityName,
        cnt: days * 8,
      });

      const response = await axios.get<WeatherForecast>(url, {
        timeout: 10000,
      });

      return response.data;
    } catch (error: any) {
      if (error.response?.data) {
        const weatherError = error.response.data as WeatherError;
        throw new Error(`Weather API Error: ${weatherError.message}`);
      }
      throw new Error(`Failed to fetch weather forecast: ${error.message}`);
    }
  }

  // Helper method to get weather icon URL
  getWeatherIconUrl(iconCode: string, size: "2x" | "4x" = "2x"): string {
    return `https://openweathermap.org/img/wn/${iconCode}@${size}.png`;
  }

  // Helper method to format temperature
  formatTemperature(temp: number, unit: "C" | "F" = "C"): string {
    return `${Math.round(temp)}°${unit}`;
  }

  // Helper method to get Vietnamese weather description
  getVietnameseWeatherDescription(description: string): string {
    const weatherTranslations: Record<string, string> = {
      "clear sky": "Trời quang",
      "few clouds": "Ít mây",
      "scattered clouds": "Mây rải rác",
      "broken clouds": "Mây đứt đoạn",
      "shower rain": "Mưa rào",
      rain: "Mưa",
      thunderstorm: "Dông",
      snow: "Tuyết",
      mist: "Sương mù",
      smoke: "Khói",
      haze: "Mù",
      dust: "Bụi",
      fog: "Sương mù dày",
      sand: "Cát",
      ash: "Tro",
      squall: "Giông",
      tornado: "Lốc xoáy",
      "overcast clouds": "Mây u ám",
      "light rain": "Mưa nhẹ",
      "moderate rain": "Mưa vừa",
      "heavy rain": "Mưa to",
      "light snow": "Tuyết nhẹ",
      "moderate snow": "Tuyết vừa",
      "heavy snow": "Tuyết to",
    };

    return weatherTranslations[description.toLowerCase()] || description;
  }
}

export const weatherService = new WeatherService();
export default weatherService;
