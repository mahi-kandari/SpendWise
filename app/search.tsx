import BackButton from "@/components/BackButton";
import Input from "@/components/Input";
import ScreenWrapper from "@/components/ScreenWrapper";
import TransactionList from "@/components/TransactionList";
import Typo from "@/components/Typo";
import { spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import { getUserTransactions } from "@/services/transactionService";
import { TransactionType } from "@/types";
import { verticalScale } from "@/utils/styling";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

const SearchScreen = () => {
  const router = useRouter();
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<TransactionType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchTransactions = useCallback(async () => {
    if (!user?.uid) {
      setTransactions([]);
      return;
    }

    setLoading(true);
    const res = await getUserTransactions(user.uid);
    setLoading(false);

    if (res.success) {
      setTransactions((res.data as TransactionType[]) || []);
      return;
    }

    setTransactions([]);
  }, [user?.uid]);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
    }, [fetchTransactions]),
  );

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return transactions;

    return transactions.filter((item) => {
      const text = [
        item.type,
        item.category,
        item.description,
        String(item.amount),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return text.includes(query);
    });
  }, [searchQuery, transactions]);

  const onPressTransaction = (item: TransactionType) => {
    router.push({
      pathname: "/(modals)/TransactionModal",
      params: {
        id: item.id,
        type: item.type,
        amount: String(item.amount),
        category: item.category || "",
        description: item.description || "",
        date:
          typeof item.date === "string"
            ? item.date
            : item.date instanceof Date
              ? item.date.toISOString()
              : item.date?.toDate?.()?.toISOString() || "",
      },
    });
  };

  return (
    <ScreenWrapper>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <BackButton />
          <Typo size={20} fontWeight={"600"}>
            Search Transactions
          </Typo>
          <View style={styles.headerRightSpace} />
        </View>

        <View style={styles.searchBoxWrap}>
          <Input
            placeholder="Search by type, category or description"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
          />
        </View>

        <View style={styles.resultsWrap}>
          <TransactionList
            data={filteredTransactions}
            loading={loading}
            emptyListMessage={
              searchQuery.trim()
                ? "No transactions match your search"
                : "No Transaction added yet "
            }
            title="Transactions"
            onItemPress={onPressTransaction}
            fullHeight
          />
        </View>
      </View>
    </ScreenWrapper>
  );
};

export default SearchScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacingX._20,
    gap: spacingY._20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: verticalScale(20),
  },
  headerRightSpace: {
    width: verticalScale(26),
  },
  searchBoxWrap: {
    borderRadius: verticalScale(17),
  },
  resultsWrap: {
    flex: 1,
  },
});
