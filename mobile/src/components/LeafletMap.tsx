import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';

export type MapMode = 'feed' | 'heatmap' | 'picker';

interface LeafletMapProps {
  center: { latitude: number; longitude: number };
  radiusInMeters?: number;
  issues?: Array<any>;
  mode?: MapMode;
  onLocationSelect?: (lat: number, lng: number) => void;
  onIssuePress?: (issueId: string) => void;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  center,
  radiusInMeters = 5000,
  issues = [],
  mode = 'feed',
  onLocationSelect,
  onIssuePress,
}) => {
  const webViewRef = useRef<WebView>(null);

  // When center prop changes, inject JavaScript to pan the map
  useEffect(() => {
    if (webViewRef.current && center) {
      webViewRef.current.injectJavaScript(`
        if (typeof window.recenterMap === 'function') {
          window.recenterMap(${center.latitude}, ${center.longitude});
        }
        true;
      `);
    }
  }, [center.latitude, center.longitude]);

  const getHtml = () => {
    // We pass data directly into the HTML to avoid complex messaging for initial render
    const issuesJson = JSON.stringify(issues.map(i => {
      let lat = 0; let lng = 0;
      if (typeof i.location === 'string') {
        const match = i.location.match(/POINT\(([^ ]+) ([^ ]+)\)/);
        if (match) { lng = parseFloat(match[1]); lat = parseFloat(match[2]); }
      } else if (i.location && typeof i.location === 'object') {
        lng = i.location.coordinates[0];
        lat = i.location.coordinates[1];
      }
      return { id: i.id, lat, lng, title: i.title, category: i.category, severity: i.severity };
    }).filter(i => i.lat !== 0 && i.lng !== 0));

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://unpkg.com/leaflet.heat/dist/leaflet-heat.js"></script>
        <style>
          body { padding: 0; margin: 0; background-color: #0B1120; }
          html, body, #map { height: 100%; width: 100%; }
          .leaflet-container { background: #0B1120; }
          .leaflet-container { background: #0B1120; }
          /* Dark mode filter for OSM tiles */
          .leaflet-layer,
          .leaflet-control-zoom-in, .leaflet-control-zoom-out, .leaflet-control-attribution {
            filter: invert(100%) hue-rotate(180deg) brightness(95%) contrast(90%);
          }
          .custom-pin {
            background-color: #111827;
            border: 2px solid rgba(255,255,255,0.2);
            border-radius: 50%;
            text-align: center;
            line-height: 30px;
            font-size: 16px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.3);
          }
          .custom-pin.user {
            border-color: #3b82f6;
            background-color: rgba(59,130,246,0.2);
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          const center = [${center.latitude}, ${center.longitude}];
          const radius = ${radiusInMeters};
          const mode = '${mode}';
          const issues = ${issuesJson};

          const map = L.map('map', { zoomControl: false }).setView(center, 13);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          }).addTo(map);

          // User radius circle
          if (mode === 'feed' || mode === 'heatmap') {
            L.circle(center, {
              color: '#1B5E20',
              fillColor: '#1B5E20',
              fillOpacity: 0.1,
              radius: radius
            }).addTo(map);

            // User marker
            const userIcon = L.divIcon({
              className: 'custom-pin user',
              html: '📍',
              iconSize: [30, 30],
              iconAnchor: [15, 15]
            });
            L.marker(center, { icon: userIcon }).addTo(map);
          }

          let currentPickerMarker = null;

          if (mode === 'picker') {
            currentPickerMarker = L.marker(center).addTo(map);
            map.on('click', function(e) {
              currentPickerMarker.setLatLng(e.latlng);
              window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'locationSelect', lat: e.latlng.lat, lng: e.latlng.lng }));
            });
          }

          if (mode === 'heatmap') {
            const heatPoints = issues.map(i => {
              let intensity = 0.5;
              if (i.severity === 'critical') intensity = 1.0;
              if (i.severity === 'high') intensity = 0.8;
              return [i.lat, i.lng, intensity];
            });
            L.heatLayer(heatPoints, { radius: 25, blur: 15, maxZoom: 15 }).addTo(map);
          }

          if (mode === 'feed') {
            issues.forEach(i => {
              let emoji = '🛡';
              if (i.category === 'water') emoji = '🚰';
              else if (i.category === 'electricity') emoji = '⚡';
              else if (i.category === 'roads') emoji = '🛣';
              else if (i.category === 'sanitation') emoji = '🗑';

              const icon = L.divIcon({
                className: 'custom-pin',
                html: emoji,
                iconSize: [30, 30],
                iconAnchor: [15, 15]
              });

              const marker = L.marker([i.lat, i.lng], { icon }).addTo(map);
              marker.on('click', () => {
                window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'issuePress', issueId: i.id }));
              });
            });
          }
          
          // Helper function for external recenter
          window.recenterMap = function(lat, lng) {
            map.setView([lat, lng], 15);
            if (currentPickerMarker) {
               currentPickerMarker.setLatLng([lat, lng]);
            }
          }
        </script>
      </body>
      </html>
    `;
  };

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'locationSelect' && onLocationSelect) {
        onLocationSelect(data.lat, data.lng);
      } else if (data.type === 'issuePress' && onIssuePress) {
        onIssuePress(data.issueId);
      }
    } catch (e) {
      console.warn("Error parsing webview message", e);
    }
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: getHtml() }}
        style={styles.webview}
        onMessage={handleMessage}
        scrollEnabled={false}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#22C55E" />
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B1120',
    overflow: 'hidden',
    borderRadius: 12,
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loading: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0B1120',
  }
});
