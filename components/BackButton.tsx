import { colors, radius } from "@/constants/theme";
import { BackButtonProps } from "@/types";
import { verticalScale } from "@/utils/styling";
import { useRouter } from "expo-router";
import { CaretLeft } from "phosphor-react-native";
import { StyleSheet, TouchableOpacity } from "react-native";

const BackButton = ({
  style,
  iconSize = 26,
  fallbackRoute,
}: BackButtonProps) => {
  const router = useRouter();

  const handlePress = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }

    if (fallbackRoute) {
      router.replace(fallbackRoute);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} style={[styles.button, style]}>
      <CaretLeft
        size={verticalScale(iconSize)}
        color={colors.white}
        weight="bold"
      />
    </TouchableOpacity>
  );
};

export default BackButton;

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.neutral600,
    alignSelf: "flex-start",
    borderRadius: radius._12,
    borderCurve: "continuous",
    padding: 5,
  },
});
