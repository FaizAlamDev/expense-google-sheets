/* eslint-disable no-undef */
import "dotenv/config";

export default {
  expo: {
    name: "expenseSheetsApp",
    slug: "expenseSheetsApp",
    scheme: "expenseSheetsApp",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/icon.png",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    splash: {
      image: "./assets/splash-icon.png",
      resizeMode: "contain",
      backgroundColor: "#ffffff",
    },
    ios: {
      supportsTablet: true,
    },
    android: {
      adaptiveIcon: {
        foregroundImage: "./assets/adaptive-icon.png",
        backgroundColor: "#ffffff",
      },
      edgeToEdgeEnabled: true,
      package: "com.faizalam.expensesheets",
    },
    web: {
      bundler: "metro",
      favicon: "./assets/favicon.png",
    },
    extra: {
      apiUrl: process.env.API_URL,
      eas: {
        projectId: "63ca2984-f319-4701-8be9-5af59faf46f2",
      },
    },
  },
};
