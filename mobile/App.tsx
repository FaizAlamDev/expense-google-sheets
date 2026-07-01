import { StyleSheet, View } from "react-native";
import Constants from "expo-constants";
import Main from "./src/Main";
import "./global.css";

const styles = StyleSheet.create({
  container: {
    paddingTop: Constants.statusBarHeight,
    flex: 1,
  },
});

export default function App() {
  return (
    <View style={styles.container}>
      <Main />
    </View>
  );
}
