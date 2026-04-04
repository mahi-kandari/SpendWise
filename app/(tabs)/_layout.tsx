import { StyleSheet, Text, View } from "react-native";
import React from "react";
import { Tabs } from "expo-router";
import CustomTabs from "@/components/CustomTabs";


const _layout = () => {
  return (
    <Tabs screenOptions={{headerShown : false}} tabBar={(props) => <CustomTabs {...props} />}>
      <Tabs.Screen name="index" options={{ title: "Home" }} />  
      <Tabs.Screen name="statistics" options={{ title: "Stats" }} />
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
};

export default _layout;

const styles = StyleSheet.create({});
