export default {
  "name": "LocalPulse",
  "slug": "localpulse",
  "version": "1.0.0",
  "orientation": "portrait",
  "icon": "./assets/icon.png",
  "userInterfaceStyle": "automatic",
  "splash": {
    "image": "./assets/splash-icon.png",
    "resizeMode": "contain",
    "backgroundColor": "#1B5E20"
  },
  "assetBundlePatterns": [
    "**/*"
  ],
  "ios": {
    "supportsTablet": true,
    "bundleIdentifier": "com.localpulse.app"
  },
  "android": {
    "adaptiveIcon": {
      "foregroundImage": "./assets/adaptive-icon.png",
      "backgroundColor": "#1B5E20"
    },
    "package": "com.localpulse.app",
    "config": {
      "googleMaps": {
        "apiKey": process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || "YOUR_GOOGLE_MAPS_API_KEY"
      }
    },
    "permissions": [
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.CAMERA",
      "android.permission.READ_EXTERNAL_STORAGE",
      "android.permission.ACCESS_COARSE_LOCATION",
      "android.permission.ACCESS_FINE_LOCATION",
      "android.permission.RECORD_AUDIO"
    ]
  },
  "cli": {
    "appVersionSource": "remote"
  },
  "plugins": [
    [
      "expo-location",
      {
        "locationAlwaysAndWhenInUsePermission": "Allow LocalPulse to access your location to show nearby issues."
      }
    ],
    [
      "expo-image-picker",
      {
        "photosPermission": "Allow LocalPulse to access your photos to report issues.",
        "cameraPermission": "Allow LocalPulse to use your camera to capture issues."
      }
    ],
    "@react-native-google-signin/google-signin",
    "expo-font"
  ],
  "extra": {
    "eas": {
      "projectId": "400eb609-a3c8-40f4-b457-b98c23292fa1"
    }
  }
};
