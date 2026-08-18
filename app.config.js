require('dotenv').config();

export default {
  expo: {
    name: "smart-motos-app",
    slug: "smart-motos-app",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: "myapp",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.nihonor.smartmotosapp",
      googleServicesFile: process.env.GOOGLE_SERVICES_PLIST ?? "./GoogleService-Info.plist"
    },
    web: {
      bundler: "metro",
      output: "single",
      favicon: "./assets/images/favicon.png"
    },
    plugins: [
      "@react-native-firebase/app",
      "expo-router",
      "expo-font",
      "expo-web-browser",
      [
        "@rnmapbox/maps",
        {
          RNMapboxMapsImpl: "mapbox",
          RNMapboxMapsDownloadToken: process.env.EXPO_PUBLIC_MAPBOX_DOWNLOAD_TOKEN
        }
      ],
      "expo-secure-store",
      [
        "expo-image-picker",
        {
          photosPermission: "Allow $(PRODUCT_NAME) to access your photos to upload your license."
        }
      ],
      [
        "expo-camera",
        {
          cameraPermission: "Allow $(PRODUCT_NAME) to access your camera",
          microphonePermission: "Allow $(PRODUCT_NAME) to access your microphone",
          recordAudioAndroid: true
        }
      ]
    ],
    experiments: {
      typedRoutes: true
    },
    android: {
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      package: "com.nihonor.smartmotosapp",
      permissions: [
        "android.permission.CAMERA",
        "android.permission.RECORD_AUDIO"
      ]
    },
    extra: {
      router: {},
      eas: {
        projectId: "15383f5a-a84a-4b36-938b-b40dc875a7ed"
      }
    },
    owner: "myshi"
  }
};