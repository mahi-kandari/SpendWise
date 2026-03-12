import { colors } from "@/constants/theme";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import { Image, StyleSheet, Text, View } from "react-native";

const Index = () => {
  const router = useRouter();
  useEffect(() => {
    setTimeout(() => {
      router.push("/welcome");
    }, 2000);
  }, []);
  return (
    <View style={styles.container}>
      <View style={styles.imageContainer}>
        <Image
          style={styles.logo}
          resizeMode="contain"
          source={require("../assets/images/salary.png")}
        />
        <Text style={styles.text}>SpendWise</Text>
      </View>
    </View>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral900,
  },
  imageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "column",
  },
  logo: {
    height: "20%",
    aspectRatio: 1,
    marginBottom: 10, // Small gap below the image
  },
  text: {
    color: colors.white,
    fontSize: 30,
    fontWeight: "bold",
  },
});
