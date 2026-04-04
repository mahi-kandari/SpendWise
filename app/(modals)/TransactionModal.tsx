import BackButton from "@/components/BackButton";
import Button from "@/components/Button";
import Input from "@/components/Input";
import ModalWrapper from "@/components/ModalWrapper";
import Typo from "@/components/Typo";
import {
    expenseCategories,
    incomeCategories,
    transactionTypes,
} from "@/constants/data";
import { colors, spacingX, spacingY } from "@/constants/theme";
import { useAuth } from "@/contexts/authContext";
import {
    createOrUpdateTransaction,
    deleteTransaction,
} from "@/services/transactionService";
import { TransactionType } from "@/types";
import { scale, verticalScale } from "@/utils/styling";
import { useLocalSearchParams, useRouter } from "expo-router";
import * as Icons from "phosphor-react-native";
import React, { useEffect, useMemo, useState } from "react";
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
    View,
} from "react-native";

type TransactionParams = {
  id?: string;
  type?: string;
  amount?: string;
  category?: string;
  description?: string;
  date?: string;
};

const getStringValue = (value?: string | string[]) => {
  if (Array.isArray(value)) return value[0] || "";
  return value || "";
};

const normalizeCategory = (value?: string) =>
  (value || "").trim().toLowerCase();

const getCategoryOption = (
  value?: string,
  options = Object.values(expenseCategories),
) => {
  const normalized = normalizeCategory(value);
  return options.find(
    (option) =>
      option.value.toLowerCase() === normalized ||
      option.label.toLowerCase() === normalized,
  );
};

const getTypeOption = (value?: string) => {
  const normalized = (value || "").trim().toLowerCase();
  return transactionTypes.find(
    (option) => option.value.toLowerCase() === normalized,
  );
};

const TransactionModal = () => {
  const router = useRouter();
  const { user } = useAuth();
  const params = useLocalSearchParams<TransactionParams>();
  const idParam = getStringValue(params?.id);
  const typeParam = getStringValue(params?.type);
  const amountParam = getStringValue(params?.amount);
  const categoryParam = getStringValue(params?.category);
  const descriptionParam = getStringValue(params?.description);
  const dateParam = getStringValue(params?.date);
  const isEditMode = useMemo(() => Boolean(idParam), [idParam]);
  const typeOptions = useMemo(() => transactionTypes, []);

  const [transaction, setTransaction] = useState<TransactionType>({
    type: "expense",
    amount: 0,
    category: "",
    description: "",
    date: new Date(),
    image: null,
  });
  const [loading, setLoading] = useState(false);
  const [showTypeMenu, setShowTypeMenu] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const selectedTypeValue = getTypeOption(transaction.type)?.value || "expense";
  const activeCategoryOptions = useMemo(
    () =>
      selectedTypeValue === "income"
        ? Object.values(incomeCategories)
        : Object.values(expenseCategories),
    [selectedTypeValue],
  );

  useEffect(() => {
    if (!idParam) return;

    const parsedDate = dateParam ? new Date(dateParam) : new Date();
    const nextType = getTypeOption(typeParam)?.value || "expense";
    const nextAmount = amountParam ? Number(amountParam) || 0 : 0;
    const nextCategory = categoryParam || "";
    const nextDescription = descriptionParam || "";
    const nextDate = Number.isNaN(parsedDate.getTime())
      ? new Date()
      : parsedDate;

    setTransaction((prev) => {
      const prevDate =
        prev.date instanceof Date
          ? prev.date
          : typeof prev.date === "string"
            ? new Date(prev.date)
            : prev.date?.toDate?.() || new Date(0);
      const isSame =
        prev.id === idParam &&
        prev.type === nextType &&
        prev.amount === nextAmount &&
        (prev.category || "") === nextCategory &&
        (prev.description || "") === nextDescription &&
        prevDate.getTime() === nextDate.getTime();

      if (isSame) return prev;

      return {
        ...prev,
        id: idParam,
        type: nextType,
        amount: nextAmount,
        category: nextCategory,
        description: nextDescription,
        date: nextDate,
      };
    });
  }, [
    idParam,
    dateParam,
    amountParam,
    typeParam,
    categoryParam,
    descriptionParam,
  ]);

  const onSubmit = async () => {
    if (!user?.uid) {
      Alert.alert("Transaction", "Please login to continue");
      return;
    }

    const selectedCategory = getCategoryOption(
      transaction.category,
      activeCategoryOptions,
    );
    if (!selectedCategory) {
      Alert.alert("Transaction", "Please select a valid category");
      return;
    }

    const selectedType = getTypeOption(transaction.type);
    if (!selectedType) {
      Alert.alert("Transaction", "Please select a valid transaction type");
      return;
    }

    if (!Number.isFinite(transaction.amount) || transaction.amount <= 0) {
      Alert.alert("Transaction", "Please enter a valid amount");
      return;
    }

    try {
      setLoading(true);
      const payload: TransactionType = {
        ...transaction,
        uid: user.uid,
        type: selectedType.value,
        category: selectedCategory.value,
      };

      const res = await createOrUpdateTransaction(payload);
      if (res.success) {
        router.back();
      } else {
        Alert.alert("Transaction", res.msg || "Unable to save transaction");
      }
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    if (!transaction.id) return;

    try {
      setLoading(true);
      const res = await deleteTransaction(transaction.id);
      if (res.success) {
        router.back();
      } else {
        Alert.alert("Transaction", res.msg || "Unable to delete transaction");
      }
    } finally {
      setLoading(false);
    }
  };

  const showDeleteAlert = () => {
    Alert.alert("Confirm", "Delete this transaction?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Delete",
        style: "destructive",
        onPress: onDelete,
      },
    ]);
  };

  return (
    <ModalWrapper>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.scrollArea}
          contentContainerStyle={styles.form}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          keyboardDismissMode="interactive"
        >
          <View style={styles.header}>
            <View style={styles.backButton}>
              <BackButton />
            </View>

            <Typo style={styles.headerTitle}>
              {isEditMode ? "Update Transaction" : "Add Transaction"}
            </Typo>
          </View>

          <View
            style={[
              styles.inputContainer,
              showTypeMenu ? styles.dropdownOpenContainer : undefined,
            ]}
          >
            <Typo color={colors.neutral200}>Type</Typo>
            <View style={styles.dropdownWrapper}>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                activeOpacity={0.8}
                onPress={() => {
                  setShowCategoryMenu(false);
                  setShowTypeMenu((prev) => !prev);
                }}
              >
                <Typo color={colors.white}>
                  {getTypeOption(transaction.type)?.label ||
                    "Select transaction type"}
                </Typo>
                <Icons.CaretDown
                  size={verticalScale(18)}
                  color={colors.neutral300}
                  weight="bold"
                />
              </TouchableOpacity>

              {showTypeMenu && (
                <View style={styles.dropdownMenu}>
                  {typeOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setTransaction({
                          ...transaction,
                          type: option.value,
                          category: "",
                        });
                        setShowTypeMenu(false);
                      }}
                    >
                      <Typo color={colors.neutral100}>{option.label}</Typo>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Amount</Typo>
            <Input
              placeholder="₹ 1000"
              keyboardType="numeric"
              value={String(transaction.amount || "")}
              onChangeText={(value) =>
                setTransaction({
                  ...transaction,
                  amount: Number(value.replace(/[^\d.]/g, "")) || 0,
                })
              }
            />
          </View>

          <View style={[styles.inputContainer]}>
            <Typo color={colors.neutral200}>Category</Typo>
            <View>
              <TouchableOpacity
                style={styles.dropdownTrigger}
                activeOpacity={0.8}
                onPress={() => {
                  setShowTypeMenu(false);
                  setShowCategoryMenu((prev) => !prev);
                }}
              >
                <Typo color={colors.white}>
                  {getCategoryOption(
                    transaction.category,
                    activeCategoryOptions,
                  )?.label || "Select a category"}
                </Typo>
                <Icons.CaretDown
                  size={verticalScale(18)}
                  color={colors.neutral300}
                  weight="bold"
                />
              </TouchableOpacity>

              {showCategoryMenu && (
                <View style={styles.dropdownMenuInline}>
                  {activeCategoryOptions.map((option) => (
                    <TouchableOpacity
                      key={option.value}
                      style={styles.dropdownItem}
                      onPress={() => {
                        setTransaction({
                          ...transaction,
                          category: option.value,
                        });
                        setShowCategoryMenu(false);
                      }}
                    >
                      <Typo color={colors.neutral100}>{option.label}</Typo>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Typo color={colors.neutral200}>Description</Typo>
            <Input
              placeholder="Add note"
              value={transaction.description || ""}
              onChangeText={(value) =>
                setTransaction({ ...transaction, description: value })
              }
            />
          </View>
        </ScrollView>

        <View style={styles.footer}>
          {isEditMode && (
            <Button
              onPress={showDeleteAlert}
              loading={loading}
              style={{ ...styles.deleteButton, flex: 1 }}
            >
              <Typo color={colors.white} fontWeight={"700"} size={18}>
                Delete
              </Typo>
            </Button>
          )}
          <Button onPress={onSubmit} loading={loading} style={{ flex: 1 }}>
            <Typo color={colors.black} fontWeight={"700"} size={18}>
              {isEditMode ? "Update" : "Add"}
            </Typo>
          </Button>
        </View>
      </KeyboardAvoidingView>
    </ModalWrapper>
  );
};

export default TransactionModal;

const styles = StyleSheet.create({
  inputContainer: {
    gap: spacingY._10,
  },
  container: {
    flex: 1,
    paddingHorizontal: spacingY._20,
  },
  scrollArea: {
    flex: 1,
  },
  footer: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: spacingX._20,
    gap: scale(12),
    paddingTop: spacingY._15,
    borderTopColor: colors.neutral700,
    marginBottom: spacingY._5,
    borderTopWidth: 1,
  },
  form: {
    gap: spacingY._25,
    marginTop: spacingY._15,
    paddingBottom: verticalScale(140),
  },
  header: {
    justifyContent: "center",
    alignItems: "center",
    marginBottom: spacingY._15,
    paddingTop: verticalScale(15),
  },
  backButton: {
    position: "absolute",
    left: spacingX._5,
    top: verticalScale(11),
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "600",
    color: colors.neutral100,
  },
  deleteButton: {
    backgroundColor: colors.rose,
  },
  dropdownTrigger: {
    borderWidth: 1,
    borderColor: colors.neutral300,
    borderRadius: verticalScale(17),
    minHeight: verticalScale(54),
    paddingHorizontal: spacingX._15,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dropdownWrapper: {
    position: "relative",
  },
  dropdownMenu: {
    position: "absolute",
    top: verticalScale(58),
    left: 0,
    right: 0,
    zIndex: 50,
    elevation: 20,
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
    borderRadius: verticalScale(12),
    marginTop: spacingY._7,
    overflow: "hidden",
  },
  dropdownMenuInline: {
    marginTop: spacingY._7,
    backgroundColor: colors.neutral800,
    borderWidth: 1,
    borderColor: colors.neutral700,
    borderRadius: verticalScale(12),
    overflow: "hidden",
  },
  dropdownOpenContainer: {
    zIndex: 30,
    elevation: 15,
  },
  dropdownItem: {
    paddingHorizontal: spacingX._15,
    paddingVertical: spacingY._12,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral700,
  },
});
