# Weather API Documentation

## Overview

The Weather API allows developers to retrieve weather data, either current or historical (for a specific timestamp), from weather stations. The API supports queries by city name or geographic coordinates and returns weather details as [JSON](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/JSON).

## Base URL

```
http://example.com/api/weather/
```

## Request Parameters

### Required Parameters

| Parameter | Type | Description | Note |
|-----------|------|-------------| -----|
| city | string | Specifies the city for which to retrieve weather data. | The provided city name must be valid. If the city is not recognized, the API responds with an [HTTP 404](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404) (Not Found) |
| lat | float | Specifies the [latitude coordinate](https://en.wikipedia.org/wiki/Latitude) for which to retrieve weather data. | Must be used with `lon`.  If there is no weather station within a 100km radius, the API responds with an [HTTP 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/422) (Unprocessable Content) |
| lon | float | Specifies the [longitude coordinate](https://en.wikipedia.org/wiki/Longitude) for which to retrieve weather data. | Must be used with `lat`.  If there is no weather station within a 100km radius, the API responds with an [HTTP 422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/422) (Unprocessable Content) |


**Warning:** You must provide either a `city` or a `lat`/`lon` pair.

### Optional parameters

| Parameter | Type | Description | Note |
|-----------|------|-------------| -----|
| ts | timestamp | Specifies the timestamp to retrieve historical weather data. | Accepts [ISO 8601](https://en.wikipedia.org/wiki/ISO_8601) formatted timestamps (e.g., 2025-04-04T16:00:00Z). If omitted, returns the most recent available data. |
| units | string | Specifies the unit system for measurements. | Accepts [`metric`](https://en.wikipedia.org/wiki/Metric_system)  (e.g., Celsius for temperature, km/h for wind speed) or [`imperial`](https://en.wikipedia.org/wiki/Imperial_units). (e.g., Fahrenheit for temperature, mph for wind speed) |

## Response Format

The API returns JSON data with the following fields:

```json
{
  "temperature": number,
  "wind_speed": number,
  "precipitation": number,
  "conditions": string
}
```

## Response Codes

| Code | Description |
|------|-------------|
| [200](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/200) | Request successful, weather data is returned |
| [404](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/404) | Invalid parameters (e.g., missing `city` or `lat`/`lon`) |
| [422](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Status/422) | No weather station within 100km of provided coordinates |

## Examples

Each example implements two functions in the given language.

- `getWeatherByCity`: Accepts a city name (and an optional units parameter), constructs a URL with the query parameters, and makes an HTTP GET request to retrieve JSON weather data for that city.
- `getWeatherByCoordinatesAndTimestamp`: Accepts latitude, longitude, a timestamp, and an optional units parameter. It builds the URL accordingly and makes a GET request to fetch the weather data (current or historical) based on the coordinates and timestamp.

Technical Details:

- Parameters are URL-encoded to ensure safe transmission.
- The API response is expected in JSON format, containing fields like temperature, wind speed, precipitation, and conditions.
- Examples include basic error handling by checking HTTP status codes and reporting errors accordingly.

### JavaScript

```javascript
const BASE_URL = "http://example.com/api/weather/";

// Function to get weather by city
async function getWeatherByCity(city, units = 'metric') {
  const url = `${BASE_URL}?city=${encodeURIComponent(city)}&units=${encodeURIComponent(units)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error("City not found (404)");
      }
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching weather by city:", error);
    throw error;
  }
}


// Function to get weather by coordinates and timestamp
async function getWeatherByCoordinatesAndTimestamp(lat, lon, ts, units = 'metric') {
  const url = `${BASE_URL}?lat=${lat}&lon=${lon}&ts=${encodeURIComponent(ts)}&units=${encodeURIComponent(units)}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      if (response.status === 422) {
        throw new Error("No weather station available within the required radius (422)");
      }
      throw new Error(`HTTP error: ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error("Error fetching weather by coordinates:", error);
    throw error;
  }
}

// Example usage:
(async () => {
  try {
    const cityWeather = await getWeatherByCity("Paris");
    console.log("Weather by City:", cityWeather);
    const coordsWeather = await getWeatherByCoordinatesAndTimestamp(48.8566, 2.3522, '2025-04-04T16:00:00Z');
    console.log("Weather by Coordinates and Timestamp:", coordsWeather);
  } catch (error) {
    console.error("Overall error:", error);
  }
})();
```

### Java

```java
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.concurrent.CompletableFuture;

public class WeatherAPIAsync {
    private static final String BASE_URL = "http://example.com/api/weather/";

    // Function to get weather by city
    public static CompletableFuture<String> getWeatherByCity(String city, String units) {
        try {
            String encodedCity = URLEncoder.encode(city, StandardCharsets.UTF_8);
            String encodedUnits = URLEncoder.encode(units, StandardCharsets.UTF_8);
            String url = BASE_URL + "?city=" + encodedCity + "&units=" + encodedUnits;
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                         .thenApply(response -> {
                             int status = response.statusCode();
                             if (status == 200) {
                                 return response.body();
                             } else if (status == 404) {
                                 throw new RuntimeException("City not found (404)");
                             }
                             throw new RuntimeException("HTTP error: " + status);
                         });
        } catch (Exception e) {
            CompletableFuture<String> cf = new CompletableFuture<>();
            cf.completeExceptionally(e);
            return cf;
        }
    }

    // Function to get weather by coordinates and timestamp
    public static CompletableFuture<String> getWeatherByCoordinatesAndTimestamp(double lat, double lon, String ts, String units) {
        try {
            String encodedTS = URLEncoder.encode(ts, StandardCharsets.UTF_8);
            String encodedUnits = URLEncoder.encode(units, StandardCharsets.UTF_8);
            String url = BASE_URL + "?lat=" + lat + "&lon=" + lon + "&ts=" + encodedTS + "&units=" + encodedUnits;
            HttpClient client = HttpClient.newHttpClient();
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .GET()
                    .build();

            return client.sendAsync(request, HttpResponse.BodyHandlers.ofString())
                         .thenApply(response -> {
                             int status = response.statusCode();
                             if (status == 200) {
                                 return response.body();
                             } else if (status == 422) {
                                 throw new RuntimeException("No weather station available within 100km (422)");
                             }
                             throw new RuntimeException("HTTP error: " + status);
                         });
        } catch (Exception e) {
            CompletableFuture<String> cf = new CompletableFuture<>();
            cf.completeExceptionally(e);
            return cf;
        }
    }

    // Example usage:
    public static void main(String[] args) {
        getWeatherByCity("Paris", "metric")
            .thenAccept(body -> System.out.println("Weather by City: " + body))
            .exceptionally(ex -> { 
                System.out.println("Error: " + ex.getMessage()); 
                return null; 
            });

        getWeatherByCoordinatesAndTimestamp(48.8566, 2.3522, "2025-04-04T16:00:00Z", "metric")
            .thenAccept(body -> System.out.println("Weather by Coordinates and Timestamp: " + body))
            .exceptionally(ex -> { 
                System.out.println("Error: " + ex.getMessage());
                return null;
            });

        // Prevent the program from exiting immediately to allow async operations to complete:
        try {
            Thread.sleep(5000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
    }
}
```

### C#

```csharp
using System;
using System.Net.Http;
using System.Threading.Tasks;

public class WeatherClient
{
    private const string BASE_URL = "http://example.com/api/weather/";

    // Function to get weather by city
    public static async Task<string> GetWeatherByCity(string city, string units = "metric")
    {
        using (HttpClient client = new HttpClient())
        {
            string url = $"{BASE_URL}?city={Uri.EscapeDataString(city)}&units={Uri.EscapeDataString(units)}";
            HttpResponseMessage response = await client.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }
            if (response.StatusCode == System.Net.HttpStatusCode.NotFound)
            {
                throw new Exception("City not found (404)");
            }
            throw new Exception("HTTP error: " + response.StatusCode);
        }
    }

    // Function to get weather by coordinates and timestamp
    public static async Task<string> GetWeatherByCoordinatesAndTimestamp(double lat, double lon, string ts, string units = "metric")
    {
        using (HttpClient client = new HttpClient())
        {
            string url = $"{BASE_URL}?lat={lat}&lon={lon}&ts={Uri.EscapeDataString(ts)}&units={Uri.EscapeDataString(units)}";
            HttpResponseMessage response = await client.GetAsync(url);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }
            if ((int)response.StatusCode == 422)
            {
                throw new Exception("No weather station found within the 100km radius (422)");
            }
            throw new Exception("HTTP error: " + response.StatusCode);
        }
    }

    // Example usage:
    public static async Task Main(string[] args)
    {
        try
        {
            string weatherCity = await GetWeatherByCity("Paris");
            Console.WriteLine("Weather by City: " + weatherCity);
            
            string weatherCoords = await GetWeatherByCoordinatesAndTimestamp(48.8566, 2.3522, "2025-04-04T16:00:00Z");
            Console.WriteLine("Weather by Coordinates and Timestamp: " + weatherCoords);
        }
        catch (Exception ex)
        {
            Console.WriteLine("Error: " + ex.Message);
        }
    }
}
```

### Ruby

```ruby
require 'net/http'
require 'uri'
require 'json'

BASE_URL = "http://example.com/api/weather/"

# Function to get weather by city
def get_weather_by_city(city, units = 'metric')
  params = { city: city, units: units }
  uri = URI(BASE_URL)
  uri.query = URI.encode_www_form(params)
  
  response = Net::HTTP.get_response(uri)
  case response
  when Net::HTTPSuccess
    JSON.parse(response.body)
  when Net::HTTPNotFound
    raise "City not found (404)"
  else
    raise "HTTP Error: #{response.code}"
  end
rescue StandardError => e
  puts "Error in get_weather_by_city: #{e.message}"
  raise
end

# Function to get weather by coordinates and timestamp
def get_weather_by_coordinates_and_timestamp(lat, lon, ts, units = 'metric')
  params = { lat: lat, lon: lon, ts: ts, units: units }
  uri = URI(BASE_URL)
  uri.query = URI.encode_www_form(params)
  
  response = Net::HTTP.get_response(uri)
  case response
  when Net::HTTPSuccess
    JSON.parse(response.body)
  when Net::HTTPUnprocessableEntity
    raise "No weather station available within 100km (422)"
  else
    raise "HTTP Error: #{response.code}"
  end
rescue StandardError => e
  puts "Error in get_weather_by_coordinates_and_timestamp: #{e.message}"
  raise
end

# Example usage:
begin
  puts "Weather by City: #{get_weather_by_city("Paris")}"
  puts "Weather by Coordinates and Timestamp: #{get_weather_by_coordinates_and_timestamp(48.8566, 2.3522, "2025-04-04T16:00:00Z")}"
rescue => e
  puts "Overall error: #{e.message}"
end
```
