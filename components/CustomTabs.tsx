import { View, TouchableOpacity, Platform , StyleSheet } from "react-native";
import { Text } from "@react-navigation/elements";
import { BottomTabBarProps } from "@react-navigation/bottom-tabs";
import { useRouter, Href } from "expo-router";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { verticalScale } from "@/utils/styling";
import * as Icons from "phosphor-react-native"

export default function CustomTabs({
  state,
  descriptors,
}: BottomTabBarProps) {

    const tabbarIcons: any  = {
      index: (isFocused: boolean)=> (
        <Icons.House
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400} 
        />
      ),
      statistics: (isFocused: boolean)=> (
        <Icons.ChartBar
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400} 
        />
      ),
      profile: (isFocused: boolean)=> (
        <Icons.User
            size={verticalScale(30)}
            weight={isFocused ? "fill" : "regular"}
            color={isFocused ? colors.primary : colors.neutral400} 
        />
      ),
    };
  const router = useRouter();

  const routes: Record<string, Href> = {
    index: "/(tabs)",
    profile: "/(tabs)/profile",
    statistics: "/(tabs)/statistics",
  };

  return (
    <View style={styles.tabbar}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];

        const label =
          typeof options.tabBarLabel === "string"
            ? options.tabBarLabel
            : typeof options.title === "string"
            ? options.title
            : route.name;

        const isFocused = state.index === index;

        return (
          <TouchableOpacity
            key={route.name}
            onPress={() => router.push(routes[route.name])}
            style={styles.tabbarItem}
          >
            {tabbarIcons[route.name] && tabbarIcons[route.name](isFocused)}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  tabbar: {
    flexDirection: "row",
    width: "100%",
    height: Platform.OS === "ios" ? verticalScale(73) : verticalScale(55),
    backgroundColor: colors.neutral800,
    justifyContent: "space-around",
    alignItems: "center",
    borderTopColor: colors.neutral700,
    borderTopWidth: 1,
  },
  tabbarItem: {
    marginBottom: Platform.OS === "ios" ? spacingY._10 : spacingX._5,
    justifyContent: "center",
    alignItems: "center",
  },
});
