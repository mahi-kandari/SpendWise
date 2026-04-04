import { firestore } from "@/config/firebaseConfig";
import { colors } from "@/constants/theme";
import { ResponseType, TransactionType } from "@/types";
import { getLast7Days } from "@/utils/common";
import { scale } from "@/utils/styling";
import {
    addDoc,
    collection,
    deleteDoc,
    doc,
    getDocs,
    query,
    serverTimestamp,
    Timestamp,
    updateDoc,
    where,
} from "firebase/firestore";

export const createOrUpdateTransaction = async (
  transaction: TransactionType,
): Promise<ResponseType> => {
  try {
    const { id, ...payload } = transaction;

    if (id) {
      await updateDoc(doc(firestore, "transactions", id), {
        ...payload,
        updatedAt: serverTimestamp(),
      });
      return { success: true, msg: "Transaction updated successfully" };
    }

    const transactionRef = await addDoc(collection(firestore, "transactions"), {
      ...payload,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      msg: "Transaction added successfully",
      data: { id: transactionRef.id },
    };
  } catch (error: any) {
    console.log("error saving transaction:", error);
    return {
      success: false,
      msg: error?.message || "Unable to save transaction",
    };
  }
};

export const deleteTransaction = async (id: string): Promise<ResponseType> => {
  try {
    await deleteDoc(doc(firestore, "transactions", id));
    return { success: true, msg: "Transaction deleted successfully" };
  } catch (error: any) {
    console.log("error deleting transaction:", error);
    return {
      success: false,
      msg: error?.message || "Unable to delete transaction",
    };
  }
};

export const getUserTransactions = async (
  uid: string,
): Promise<ResponseType> => {
  try {
    const transactionsRef = collection(firestore, "transactions");
    const transactionsQuery = query(transactionsRef, where("uid", "==", uid));

    const snapshot = await getDocs(transactionsQuery);
    const transactions: TransactionType[] = snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<TransactionType, "id">),
    }));

    // Sort newest first without requiring a Firestore composite index.
    transactions.sort((a, b) => {
      const getTime = (value: TransactionType["date"]) => {
        if (!value) return 0;
        if (typeof value === "string") return new Date(value).getTime() || 0;
        if (value instanceof Date) return value.getTime() || 0;
        return value?.toDate?.()?.getTime?.() || 0;
      };

      return getTime(b.date) - getTime(a.date);
    });

    return { success: true, data: transactions };
  } catch (error: any) {
    console.log("error getting transactions:", error);
    return {
      success: false,
      msg: error?.message || "Unable to fetch transactions",
      data: [],
    };
  }
};

export const fetchWeeklyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const today = new Date();
    const currentDay = today.getDay(); // 0 = Sun, 1 = Mon, ..., 6 = Sat
    const daysFromMonday = currentDay === 0 ? -6 : 1 - currentDay;

    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() + daysFromMonday);
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    const getLocalDateKey = (date: Date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const day = String(date.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    };

    const getTransactionDate = (value: TransactionType["date"]) => {
      if (!value) return null;
      if (value instanceof Date) return value;
      if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      if (value instanceof Timestamp) return value.toDate();
      const maybeDate =
        typeof (value as any)?.toDate === "function"
          ? (value as any).toDate()
          : null;
      return maybeDate instanceof Date ? maybeDate : null;
    };

    const transactionsRes = await getUserTransactions(uid);
    if (!transactionsRes.success) {
      return {
        success: false,
        msg: transactionsRes.msg || "Unable to fetch transactions",
      };
    }

    const allTransactions = (transactionsRes.data || []) as TransactionType[];
    const transactions = allTransactions.filter((transaction) => {
      const transactionDateObj = getTransactionDate(transaction.date);
      if (!transactionDateObj) return false;
      return transactionDateObj >= weekStart && transactionDateObj <= weekEnd;
    });

    const weeklyData = getLast7Days();

    transactions.forEach((transaction) => {
      const transactionDateObj = getTransactionDate(transaction.date);
      if (!transactionDateObj) return;

      const transactionDate = getLocalDateKey(transactionDateObj);
      const dayData = weeklyData.find((day) => day.date === transactionDate);
      if (!dayData) return;

      if (transaction.type === "income") {
        dayData.income += Number(transaction.amount) || 0;
      } else if (transaction.type === "expense") {
        dayData.expense += Number(transaction.amount) || 0;
      }
    });

    const stats = weeklyData.flatMap((day) => [
      {
        value: day.income,
        label: day.day,
        spacing: scale(4),
        labelWidth: scale(30),
        frontColor: colors.primary,
      },
      {
        value: day.expense,
        frontColor: colors.rose,
      },
    ]);
    return { success: true, data: { stats, transactions } };
  } catch (err: any) {
    console.log("error fetching weekly stats: ", err);
    return { success: false, msg: err.message };
  }
};

export const fetchMonthlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const today = new Date();
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    const getTransactionDate = (value: TransactionType["date"]) => {
      if (!value) return null;
      if (value instanceof Date) return value;
      if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      if (value instanceof Timestamp) return value.toDate();
      const maybeDate =
        typeof (value as any)?.toDate === "function"
          ? (value as any).toDate()
          : null;
      return maybeDate instanceof Date ? maybeDate : null;
    };

    const transactionsRes = await getUserTransactions(uid);
    if (!transactionsRes.success) {
      return {
        success: false,
        msg: transactionsRes.msg || "Unable to fetch transactions",
      };
    }

    const allTransactions = (transactionsRes.data || []) as TransactionType[];
    const transactions = allTransactions.filter((transaction) => {
      const transactionDateObj = getTransactionDate(transaction.date);
      if (!transactionDateObj) return false;
      return transactionDateObj >= monthStart && transactionDateObj <= monthEnd;
    });

    const numberOfDays = monthEnd.getDate();
    const monthData = Array.from({ length: numberOfDays }, (_, index) => ({
      dayNumber: index + 1,
      income: 0,
      expense: 0,
    }));

    transactions.forEach((transaction) => {
      const transactionDateObj = getTransactionDate(transaction.date);
      if (!transactionDateObj) return;

      const dayIndex = transactionDateObj.getDate() - 1;
      const dayData = monthData[dayIndex];
      if (!dayData) return;

      if (transaction.type === "income") {
        dayData.income += Number(transaction.amount) || 0;
      } else if (transaction.type === "expense") {
        dayData.expense += Number(transaction.amount) || 0;
      }
    });

    const stats = monthData.flatMap((day, index) => [
      {
        value: day.income,
        label:
          index % 5 === 0 || index === numberOfDays - 1
            ? String(day.dayNumber)
            : "",
        spacing: scale(2),
        labelWidth: scale(20),
        frontColor: colors.primary,
      },
      {
        value: day.expense,
        frontColor: colors.rose,
      },
    ]);

    return { success: true, data: { stats, transactions } };
  } catch (err: any) {
    console.log("error fetching monthly stats: ", err);
    return { success: false, msg: err.message };
  }
};

export const fetchYearlyStats = async (uid: string): Promise<ResponseType> => {
  try {
    const today = new Date();
    const yearStart = new Date(today.getFullYear(), 0, 1);
    yearStart.setHours(0, 0, 0, 0);

    const yearEnd = new Date(today.getFullYear(), 11, 31);
    yearEnd.setHours(23, 59, 59, 999);

    const monthLabels = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];

    const getTransactionDate = (value: TransactionType["date"]) => {
      if (!value) return null;
      if (value instanceof Date) return value;
      if (typeof value === "string") {
        const parsed = new Date(value);
        return Number.isNaN(parsed.getTime()) ? null : parsed;
      }
      if (value instanceof Timestamp) return value.toDate();
      const maybeDate =
        typeof (value as any)?.toDate === "function"
          ? (value as any).toDate()
          : null;
      return maybeDate instanceof Date ? maybeDate : null;
    };

    const transactionsRes = await getUserTransactions(uid);
    if (!transactionsRes.success) {
      return {
        success: false,
        msg: transactionsRes.msg || "Unable to fetch transactions",
      };
    }

    const allTransactions = (transactionsRes.data || []) as TransactionType[];
    const transactions = allTransactions.filter((transaction) => {
      const transactionDateObj = getTransactionDate(transaction.date);
      if (!transactionDateObj) return false;
      return transactionDateObj >= yearStart && transactionDateObj <= yearEnd;
    });

    const yearData = monthLabels.map((label) => ({
      label,
      income: 0,
      expense: 0,
    }));

    transactions.forEach((transaction) => {
      const transactionDateObj = getTransactionDate(transaction.date);
      if (!transactionDateObj) return;

      const monthIndex = transactionDateObj.getMonth();
      const monthData = yearData[monthIndex];
      if (!monthData) return;

      if (transaction.type === "income") {
        monthData.income += Number(transaction.amount) || 0;
      } else if (transaction.type === "expense") {
        monthData.expense += Number(transaction.amount) || 0;
      }
    });

    const stats = yearData.flatMap((month) => [
      {
        value: month.income,
        label: month.label,
        spacing: scale(3),
        labelWidth: scale(26),
        frontColor: colors.primary,
      },
      {
        value: month.expense,
        frontColor: colors.rose,
      },
    ]);

    return { success: true, data: { stats, transactions } };
  } catch (err: any) {
    console.log("error fetching yearly stats: ", err);
    return { success: false, msg: err.message };
  }
};
