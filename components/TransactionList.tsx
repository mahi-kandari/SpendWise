import { transactionCategories } from "@/constants/data";
import { colors, radius, spacingX, spacingY } from "@/constants/theme";
import { TransactionItemProps, TransactionListType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { FlashList } from "@shopify/flash-list";
import React from "react";
import { StyleSheet, TouchableOpacity, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import Loading from "./Loading";
import Typo from "./Typo";

const formatTransactionDate = (value: TransactionItemProps["item"]["date"]) => {
  if (!value) return "-";

  const date =
    typeof value === "string"
      ? new Date(value)
      : value instanceof Date
        ? value
        : value?.toDate?.();

  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const resolveCategory = (value?: string) => {
  const normalized = (value || "").trim().toLowerCase();
  const byKey = transactionCategories[normalized];
  if (byKey) return byKey;

  const byValueOrLabel = Object.values(transactionCategories).find(
    (item) =>
      item.value.toLowerCase() === normalized ||
      item.label.toLowerCase() === normalized,
  );

  return byValueOrLabel || transactionCategories["others"];
};

const TransactionList = ({
  data,
  title,
  loading,
  emptyListMessage,
  onItemPress,
  fullHeight = false,
}: TransactionListType) => {
  const handleClick = (item: TransactionItemProps["item"]) => {
    onItemPress?.(item);
  };

  return (
    <View style={[styles.container, fullHeight && styles.containerFullHeight]}>
      {title && (
        <Typo size={20} fontWeight={"500"}>
          {title}
        </Typo>
      )}
      <View style={[styles.list, fullHeight && styles.listFullHeight]}>
        {fullHeight ? (
          <FlashList
            data={data}
            keyExtractor={(item, index) => item.id || String(index)}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <TransactionItem
                item={item}
                index={index}
                handleClick={handleClick}
              />
            )}
          />
        ) : (
          <View style={styles.listContent}>
            {data.map((item, index) => (
              <TransactionItem
                key={item.id || String(index)}
                item={item}
                index={index}
                handleClick={handleClick}
              />
            ))}
          </View>
        )}
      </View>
      {!loading && data.length === 0 && (
        <Typo
          color={colors.neutral400}
          style={{ textAlign: "center" }}
          size={15}
        >
          {emptyListMessage}
        </Typo>
      )}
      {loading && (
        <View style={{ top: verticalScale(100) }}>
          <Loading />
        </View>
      )}
    </View>
  );
};
const TransactionItem = ({
  item,
  index,
  handleClick,
}: TransactionItemProps) => {
  const category = resolveCategory(item.category);
  const IconComponent = category.icon;
  const amountPrefix = item.type === "income" ? "+" : "-";
  const amountColor = item.type === "income" ? colors.primary : colors.rose;

  return (
    <Animated.View entering={FadeInDown.delay(index * 70).damping(14)}>
      <TouchableOpacity style={styles.row} onPress={() => handleClick?.(item)}>
        <View style={[styles.icon, { backgroundColor: category.bgColor }]}>
          {IconComponent && (
            <IconComponent
              size={verticalScale(25)}
              color={colors.white}
              weight="fill"
            />
          )}
        </View>

        <View style={styles.categoryDes}>
          <Typo size={17}>{category.label}</Typo>
          <Typo
            size={12}
            color={colors.neutral400}
            textProps={{ numberOfLines: 1 }}
          >
            {item.description?.trim() || "No description"}
          </Typo>
        </View>

        <View style={styles.amountDate}>
          <Typo color={amountColor} fontWeight={"500"}>
            {amountPrefix} ₹{Number(item.amount || 0).toFixed(2)}
          </Typo>
          <Typo size={13} color={colors.neutral400}>
            {formatTransactionDate(item.date)}
          </Typo>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default TransactionList;

const styles = StyleSheet.create({
  container: {
    gap: spacingY._17,
    // flex: 1,
    // backgroundColor: "red",
  },
  containerFullHeight: {
    flex: 1,
  },
  list: {
    minHeight: verticalScale(120),
  },
  listFullHeight: {
    flex: 1,
  },
  listContent: {
    paddingBottom: spacingY._20,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: spacingX._12,
    marginBottom: spacingY._12,
    // list with background
    backgroundColor: colors.neutral800,
    padding: spacingY._10,
    paddingHorizontal: spacingY._10,
    borderRadius: radius._17,
  },
  icon: {
    height: verticalScale(44),
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: radius._12,
    borderCurve: "continuous",
  },
  categoryDes: {
    flex: 1,
    gap: 2.5,
  },
  amountDate: {
    alignItems: "flex-end",
    gap: 3,
  },
});
