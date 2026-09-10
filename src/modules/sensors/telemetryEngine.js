/**
 * telemetryEngine.js - Low-power ambient field telemetry (GPS, altitude, bearing).
 */
export class TelemetryEngine {
  /**
   * Retrieves the current position with battery-conscious timeouts.
   * Resolves null if permissions are denied or unavailable.
   */
  static async getCurrentTelemetry() {
    if (!('geolocation' in navigator)) {
      return null;
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude, altitude, heading } = pos.coords;
          resolve({
            lat: latitude,
            lng: longitude,
            altitude: altitude ? Math.round(altitude) : null,
            heading: heading ? Math.round(heading) : null,
            timestamp: pos.timestamp
          });
        },
        (err) => {
          console.warn('Telemetry bypassed:', err.message);
          resolve(null);
        },
        {
          enableHighAccuracy: false,
          timeout: 4500,
          maximumAge: 60000
        }
      );
    });
  }

  /**
   * Formats raw coordinates into naturalist notation:
   * e.g., "17.4065° N, 78.4772° E • 505m ASL"
   */
  static formatTelemetry(telemetry) {
    if (!telemetry || typeof telemetry.lat !== 'number') {
      return null;
    }

    const latDir = telemetry.lat >= 0 ? 'N' : 'S';
    const lngDir = telemetry.lng >= 0 ? 'E' : 'W';
    const latStr = `${Math.abs(telemetry.lat).toFixed(4)}° ${latDir}`;
    const lngStr = `${Math.abs(telemetry.lng).toFixed(4)}° ${lngDir}`;

    let result = `${latStr}, ${lngStr}`;
    if (telemetry.altitude !== null && telemetry.altitude !== undefined) {
      result += ` • ${telemetry.altitude}m ASL`;
    }

    return result;
  }
}
