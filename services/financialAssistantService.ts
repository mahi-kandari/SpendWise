import { transactionCategories } from "@/constants/data";
import {
  createOrUpdateTransaction,
  deleteTransaction,
  getUserTransactions,
} from "@/services/transactionService";
import { TransactionType } from "@/types";

export const GEMINI_API_KEY = "AIzaSyAtiUmbhJ5zj1x3QnEbqV7kJ3uiD1v1UrU";

type AssistantMessageInput = {
  message: string;
  uid?: string | null;
  userName?: string | null;
};

type AssistantActionResult = {
  reply: string;
};

type ParsedIntent =
  | {
      type: "create";
      transactionType: "income" | "expense";
      amount: number;
      category: string;
    }
  | {
      type: "update";
      transactionType?: "income" | "expense";
      amount?: number;
      category?: string;
    }
  | {
      type: "delete";
      transactionType?: "income" | "expense";
      amount?: number;
      category?: string;
    }
  | { type: "advice" };

const CATEGORY_ALIASES: { category: string; keywords: string[] }[] = [
  {
    category: "salary",
    keywords: ["salary", "payroll", "paycheck", "pay cheque"],
  },
  { category: "freelance", keywords: ["freelance", "freelancing", "contract"] },
  { category: "pocket_money", keywords: ["pocket money", "allowance"] },
  {
    category: "groceries",
    keywords: ["grocery", "groceries", "supermarket", "market"],
  },
  { category: "rent", keywords: ["rent", "house rent", "apartment rent"] },
  {
    category: "utilities",
    keywords: [
      "utilities",
      "electricity",
      "water bill",
      "internet",
      "wifi",
      "gas bill",
    ],
  },
  {
    category: "transportation",
    keywords: [
      "transport",
      "transportation",
      "bus",
      "metro",
      "taxi",
      "cab",
      "uber",
      "ola",
      "fuel",
      "petrol",
    ],
  },
  {
    category: "entertainment",
    keywords: [
      "entertainment",
      "movie",
      "movies",
      "streaming",
      "game",
      "games",
    ],
  },
  {
    category: "dining",
    keywords: [
      "dining",
      "restaurant",
      "food",
      "takeout",
      "takeaway",
      "swiggy",
      "zomato",
    ],
  },
  {
    category: "health",
    keywords: ["health", "doctor", "medicine", "medical", "pharmacy"],
  },
  { category: "insurance", keywords: ["insurance"] },
  {
    category: "clothing",
    keywords: ["clothing", "clothes", "shirt", "jeans", "dress"],
  },
  {
    category: "savings",
    keywords: ["savings", "save", "investment", "invest"],
  },
  { category: "personal", keywords: ["personal"] },
  { category: "others", keywords: ["other", "others", "misc"] },
];

const INCOME_HINTS = [
  "income",
  "salary",
  "earned",
  "received",
  "credited",
  "bonus",
  "freelance",
  "allowance",
  "pocket money",
];

const EXPENSE_HINTS = [
  "expense",
  "spent",
  "spend",
  "paid",
  "purchase",
  "bought",
  "bill",
  "rent",
  "groceries",
  "dining",
  "transport",
  "utilities",
  "shopping",
  "medicine",
];

const CREATE_HINTS = ["add", "create", "record", "log", "save", "insert"];
const UPDATE_HINTS = ["update", "edit", "change", "modify", "revise"];
const DELETE_HINTS = ["delete", "remove", "clear", "drop"];
const GREETING_HINTS = ["hey", "hi", "hello", "hey there", "hi there"];
const WEEKLY_SPEND_HINTS = [
  "spent the most this week",
  "spend the most this week",
  "where i spent the most this week",
  "where did i spend the most this week",
  "where i spent most this week",
  "where did i spend most this week",
  "top spending this week",
  "biggest spend this week",
  "highest spend this week",
];
const WEEKLY_LOWEST_SPEND_HINTS = [
  "lowest this week",
  "lowest spending this week",
  "lowest spend this week",
  "least this week",
  "least spending this week",
  "least spend this week",
  "where i spent the least this week",
  "where did i spend the least this week",
  "smallest spend this week",
];
const SPENDING_QUERY_HINTS = [
  "spend",
  "spent",
  "expense",
  "expenses",
  "budget",
  "save",
  "saving",
  "category",
  "categories",
  "week",
  "month",
  "year",
  "highest",
  "lowest",
  "most",
  "least",
  "where",
];
const FINANCIAL_ADVICE_HINTS = [
  "advice",
  "advise",
  "budget",
  "save",
  "saving",
  "financial",
  "reduce",
  "cut",
  "control",
  "improve",
  "plan",
  "tips",
];

const normalize = (value: string) => value.trim().toLowerCase();

const extractAmounts = (message: string) => {
  const matches =
    message.match(/(?:₹|rs\.?|inr|\$)?\s*\d[\d,]*(?:\.\d+)?/gi) || [];

  return matches
    .map((item) => Number(item.replace(/[^\d.]/g, "")))
    .filter((item) => Number.isFinite(item) && item > 0);
};

const detectCategory = (message: string) => {
  const normalized = normalize(message);
  const found = CATEGORY_ALIASES.find(({ keywords }) =>
    keywords.some((keyword) => normalized.includes(keyword)),
  );

  return found?.category || "others";
};

const detectTransactionType = (message: string): "income" | "expense" => {
  const normalized = normalize(message);
  const incomeHit = INCOME_HINTS.some((keyword) =>
    normalized.includes(keyword),
  );
  const expenseHit = EXPENSE_HINTS.some((keyword) =>
    normalized.includes(keyword),
  );

  if (incomeHit && !expenseHit) return "income";
  if (expenseHit && !incomeHit) return "expense";

  return normalized.includes("salary") || normalized.includes("income")
    ? "income"
    : "expense";
};

const detectIntent = (message: string): ParsedIntent => {
  const normalized = normalize(message);
  const amounts = extractAmounts(normalized);
  const amount = amounts[amounts.length - 1];
  const category = detectCategory(normalized);

  if (DELETE_HINTS.some((keyword) => normalized.includes(keyword))) {
    return {
      type: "delete",
      transactionType: detectTransactionType(normalized),
      amount,
      category,
    };
  }

  if (UPDATE_HINTS.some((keyword) => normalized.includes(keyword))) {
    return {
      type: "update",
      transactionType: detectTransactionType(normalized),
      amount,
      category,
    };
  }

  if (CREATE_HINTS.some((keyword) => normalized.includes(keyword)) && amount) {
    return {
      type: "create",
      transactionType: detectTransactionType(normalized),
      amount,
      category,
    };
  }

  return { type: "advice" };
};

const getTransactionDate = (value: TransactionType["date"]): Date | null => {
  if (!value) return null;
  if (value instanceof Date) return value;
  if (typeof value === "string") {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const maybeDate =
    typeof (value as any)?.toDate === "function"
      ? (value as any).toDate()
      : null;
  return maybeDate instanceof Date ? maybeDate : null;
};

const formatCurrency = (amount: number) => `₹${Number(amount || 0).toFixed(2)}`;

const getCategoryLabel = (category: string) =>
  transactionCategories[category]?.label || transactionCategories.others.label;

const loadUserTransactions = async (uid: string) => {
  const res = await getUserTransactions(uid);

  if (!res.success) {
    return [] as TransactionType[];
  }

  return (res.data || []).filter(Boolean) as TransactionType[];
};

const getWeekRange = () => {
  const today = new Date();
  const currentDay = today.getDay();
  const daysFromMonday = currentDay === 0 ? -6 : 1 - currentDay;

  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() + daysFromMonday);
  weekStart.setHours(0, 0, 0, 0);

  const weekEnd = new Date(today);
  weekEnd.setHours(23, 59, 59, 999);

  return { weekStart, weekEnd };
};

const isWeeklyTopSpendQuery = (message: string) => {
  const normalized = normalize(message);
  return (
    normalized.includes("week") &&
    WEEKLY_SPEND_HINTS.some((hint) => normalized.includes(hint))
  );
};

const isWeeklyLowestSpendQuery = (message: string) => {
  const normalized = normalize(message);
  return (
    normalized.includes("week") &&
    WEEKLY_LOWEST_SPEND_HINTS.some((hint) => normalized.includes(hint))
  );
};

const isGreetingMessage = (message: string) => {
  const normalized = normalize(message);
  return GREETING_HINTS.includes(normalized);
};

const isSpendingAdviceQuery = (message: string) => {
  const normalized = normalize(message);
  return SPENDING_QUERY_HINTS.some((hint) => normalized.includes(hint));
};

const isFinancialAdviceQuery = (message: string) => {
  const normalized = normalize(message);
  return FINANCIAL_ADVICE_HINTS.some((hint) => normalized.includes(hint));
};

const isAmbiguousAdviceMessage = (message: string) => {
  const normalized = normalize(message);
  const words = normalized.split(/\s+/).filter(Boolean);

  if (words.length <= 1) {
    return true;
  }

  const hasTimeContext =
    normalized.includes("week") ||
    normalized.includes("month") ||
    normalized.includes("year") ||
    normalized.includes("overall");

  const hasActionContext =
    normalized.includes("spent") ||
    normalized.includes("spending") ||
    normalized.includes("expense") ||
    normalized.includes("category") ||
    normalized.includes("where");

  return !hasTimeContext && !hasActionContext;
};

const buildUnclearMessageReply = () =>
  "I’m your expense assistant, but I couldn’t understand that yet. Try asking something like: 'where did I spend the most this week?', 'show my top spending category this month', or 'add expense 500 for groceries'.";

const getTopSpendingCategory = (transactions: TransactionType[]) => {
  const totals = new Map<string, number>();

  transactions.forEach((transaction) => {
    if (transaction.type !== "expense") return;
    const category = transaction.category || "others";
    totals.set(
      category,
      (totals.get(category) || 0) + (Number(transaction.amount) || 0),
    );
  });

  const ranked = [...totals.entries()].sort(
    (left, right) => right[1] - left[1],
  );
  const [topCategory, topAmount] = ranked[0] || [];

  return { ranked, topCategory, topAmount: topAmount || 0 };
};

const buildWeeklySpendingReply = (transactions: TransactionType[]) => {
  const { weekStart, weekEnd } = getWeekRange();

  const weeklyTransactions = transactions.filter((transaction) => {
    const transactionDate = getTransactionDate(transaction.date);
    if (!transactionDate) return false;
    return transactionDate >= weekStart && transactionDate <= weekEnd;
  });

  const weeklyExpenses = weeklyTransactions.filter(
    (transaction) => transaction.type === "expense",
  );

  if (weeklyExpenses.length === 0) {
    return "I couldn’t find any expense transactions in your data for this week yet.";
  }

  const { ranked, topCategory, topAmount } =
    getTopSpendingCategory(weeklyExpenses);
  const totalSpent = weeklyExpenses.reduce(
    (sum, transaction) => sum + (Number(transaction.amount) || 0),
    0,
  );
  const topLabel = getCategoryLabel(topCategory || "others");
  const topShare =
    totalSpent > 0 ? Math.round((topAmount / totalSpent) * 100) : 0;

  const nextCategories = ranked
    .slice(1, 3)
    .map(
      ([category, amount]) =>
        `${getCategoryLabel(category)} (${formatCurrency(amount)})`,
    );

  let reply = `You spent the most on ${topLabel} this week: ${formatCurrency(topAmount)} out of ${formatCurrency(totalSpent)} total spending.`;

  if (nextCategories.length > 0) {
    reply += ` Next were ${nextCategories.join(" and ")}.`;
  }

  reply += ` That category makes up about ${topShare}% of your weekly spending.`;

  return reply;
};

const buildWeeklyLowestSpendingReply = (transactions: TransactionType[]) => {
  const { weekStart, weekEnd } = getWeekRange();

  const weeklyTransactions = transactions.filter((transaction) => {
    const transactionDate = getTransactionDate(transaction.date);
    if (!transactionDate) return false;
    return transactionDate >= weekStart && transactionDate <= weekEnd;
  });

  const weeklyExpenses = weeklyTransactions.filter(
    (transaction) => transaction.type === "expense",
  );

  if (weeklyExpenses.length === 0) {
    return "I couldn’t find any expense transactions in your data for this week yet.";
  }

  const { ranked } = getTopSpendingCategory(weeklyExpenses);
  const [lowestCategory, lowestAmount] = ranked[ranked.length - 1] || [];

  if (!lowestCategory) {
    return "I couldn’t find enough category data for this week yet.";
  }

  const totalSpent = weeklyExpenses.reduce(
    (sum, transaction) => sum + (Number(transaction.amount) || 0),
    0,
  );
  const lowestLabel = getCategoryLabel(lowestCategory);
  const lowestShare =
    totalSpent > 0 ? Math.round(((lowestAmount || 0) / totalSpent) * 100) : 0;

  return `Your lowest spending category this week is ${lowestLabel} at ${formatCurrency(lowestAmount || 0)}. That is about ${lowestShare}% of your weekly spending (${formatCurrency(totalSpent)} total).`;
};

const buildGeneralSpendingReply = (transactions: TransactionType[]) => {
  const expenseTransactions = transactions.filter(
    (transaction) => transaction.type === "expense",
  );

  if (expenseTransactions.length === 0) {
    return "I couldn’t find any expense transactions in your data yet.";
  }

  const { topCategory, topAmount, ranked } =
    getTopSpendingCategory(expenseTransactions);
  const totalSpent = expenseTransactions.reduce(
    (sum, transaction) => sum + (Number(transaction.amount) || 0),
    0,
  );
  const topLabel = getCategoryLabel(topCategory || "others");
  const nextCategories = ranked
    .slice(1, 3)
    .map(
      ([category, amount]) =>
        `${getCategoryLabel(category)} (${formatCurrency(amount)})`,
    );

  let reply = `Your biggest spending category overall is ${topLabel} at ${formatCurrency(topAmount)}.`;

  if (nextCategories.length > 0) {
    reply += ` After that, you’ve spent the most on ${nextCategories.join(" and ")}.`;
  }

  reply += ` Your total expense spending is ${formatCurrency(totalSpent)}.`;

  return reply;
};

const buildFinancialCoachingReply = (transactions: TransactionType[]) => {
  const expenses = transactions.filter(
    (transaction) => transaction.type === "expense",
  );
  const incomes = transactions.filter(
    (transaction) => transaction.type === "income",
  );

  if (expenses.length === 0) {
    return "I don’t have enough expense data yet to give strong advice. Keep logging your spending for a few days, and I’ll give you a focused plan.";
  }

  const totalExpense = expenses.reduce(
    (sum, transaction) => sum + (Number(transaction.amount) || 0),
    0,
  );
  const totalIncome = incomes.reduce(
    (sum, transaction) => sum + (Number(transaction.amount) || 0),
    0,
  );

  const { ranked, topCategory, topAmount } = getTopSpendingCategory(expenses);
  const topLabel = getCategoryLabel(topCategory || "others");
  const topShare =
    totalExpense > 0 ? Math.round((topAmount / totalExpense) * 100) : 0;

  const recommendations: string[] = [];

  if (totalIncome > 0) {
    const balance = totalIncome - totalExpense;
    const savingsRate = Math.round((balance / totalIncome) * 100);

    if (balance < 0) {
      recommendations.push(
        `You are overspending by ${formatCurrency(Math.abs(balance))}. Start by reducing ${topLabel} by about 15% this month.`,
      );
    } else {
      recommendations.push(
        `You are currently saving ${formatCurrency(balance)} (about ${savingsRate}% of income). Try moving at least 20% of that to savings first.`,
      );
    }
  } else {
    recommendations.push(
      "I can’t see income entries yet, so add your income transactions to get a full savings and budget plan.",
    );
  }

  if (topShare >= 40) {
    recommendations.push(
      `${topLabel} is taking ${topShare}% of your expenses. Set a weekly cap near ${formatCurrency((topAmount || 0) / 4)} and track against it.`,
    );
  }

  const diningAndEntertainmentTotal = ranked
    .filter(([category]) => ["dining", "entertainment"].includes(category))
    .reduce((sum, [, amount]) => sum + amount, 0);

  if (totalExpense > 0 && diningAndEntertainmentTotal / totalExpense >= 0.2) {
    recommendations.push(
      `Dining + entertainment is ${formatCurrency(diningAndEntertainmentTotal)}. Try 2 low-spend days per week to cut this by 10-15%.`,
    );
  }

  if (recommendations.length < 2) {
    recommendations.push(
      "Create category limits for your top 3 expenses and review them every Sunday for tighter control.",
    );
  }

  const quickActions = recommendations
    .slice(0, 3)
    .map((item, index) => `${index + 1}. ${item}`)
    .join("\n");

  return `Here’s your personalized financial advice from your recent data:\n\n- Biggest expense driver: ${topLabel} (${formatCurrency(topAmount)}).\n- Total expenses tracked: ${formatCurrency(totalExpense)}.${totalIncome > 0 ? `\n- Total income tracked: ${formatCurrency(totalIncome)}.` : ""}\n\nQuick plan:\n${quickActions}`;
};

const findBestTransaction = (
  transactions: TransactionType[],
  filters: { type?: "income" | "expense"; amount?: number; category?: string },
) => {
  let candidates = [...transactions];

  if (filters.type) {
    candidates = candidates.filter((item) => item.type === filters.type);
  }

  if (filters.category) {
    candidates = candidates.filter(
      (item) =>
        normalize(item.category || "") === normalize(filters.category || ""),
    );
  }

  if (typeof filters.amount === "number") {
    candidates.sort((left, right) => {
      const leftDiff = Math.abs(Number(left.amount || 0) - filters.amount!);
      const rightDiff = Math.abs(Number(right.amount || 0) - filters.amount!);
      return leftDiff - rightDiff;
    });
  }

  candidates.sort((left, right) => {
    const leftDate = getTransactionDate(left.date)?.getTime() || 0;
    const rightDate = getTransactionDate(right.date)?.getTime() || 0;
    return rightDate - leftDate;
  });

  return candidates[0] || null;
};

export const handleFinancialAssistantMessage = async ({
  message,
  uid,
  userName = "there",
}: AssistantMessageInput): Promise<AssistantActionResult> => {
  const normalizedMessage = normalize(message);

  if (!uid) {
    return {
      reply: "Please sign in first so I can manage your transactions.",
    };
  }

  const transactions = await loadUserTransactions(uid);
  const intent = detectIntent(normalizedMessage);

  if (intent.type === "create") {
    const category = intent.category;
    const transaction: TransactionType = {
      type: intent.transactionType,
      amount: intent.amount,
      category,
      description: `${getCategoryLabel(category)} ${intent.transactionType}`,
      date: new Date(),
      uid,
    };

    const result = await createOrUpdateTransaction(transaction);

    if (!result.success) {
      return {
        reply: result.msg || "I could not add that transaction.",
      };
    }

    return {
      reply: `Added ${transaction.type} of ${formatCurrency(transaction.amount)} under ${getCategoryLabel(category)}.`,
    };
  }

  if (intent.type === "update") {
    const match = findBestTransaction(transactions, {
      type: intent.transactionType,
      amount: intent.amount,
      category: intent.category,
    });

    if (!match?.id) {
      return {
        reply:
          "I could not find a matching transaction to update. Try including the category or amount.",
      };
    }

    const updatedTransaction: TransactionType = {
      ...match,
      amount: intent.amount ?? Number(match.amount || 0),
      category: intent.category || match.category || "others",
      type: intent.transactionType || match.type,
      description:
        match.description ||
        getCategoryLabel(intent.category || match.category || "others"),
      uid,
    };

    const result = await createOrUpdateTransaction(updatedTransaction);

    if (!result.success) {
      return {
        reply: result.msg || "I could not update that transaction.",
      };
    }

    return {
      reply: `Updated ${getCategoryLabel(updatedTransaction.category || "others")} to ${formatCurrency(updatedTransaction.amount)}.`,
    };
  }

  if (intent.type === "delete") {
    const match = findBestTransaction(transactions, {
      type: intent.transactionType,
      amount: intent.amount,
      category: intent.category,
    });

    if (!match?.id) {
      return {
        reply:
          "I could not find a matching transaction to delete. Try including the category or amount.",
      };
    }

    const result = await deleteTransaction(match.id);

    if (!result.success) {
      return {
        reply: result.msg || "I could not delete that transaction.",
      };
    }

    return {
      reply: `Deleted the latest ${getCategoryLabel(match.category || "others")} transaction.`,
    };
  }

  if (isWeeklyTopSpendQuery(normalizedMessage)) {
    return {
      reply: buildWeeklySpendingReply(transactions),
    };
  }

  if (isWeeklyLowestSpendQuery(normalizedMessage)) {
    return {
      reply: buildWeeklyLowestSpendingReply(transactions),
    };
  }

  if (isGreetingMessage(normalizedMessage)) {
    return {
      reply:
        "Hey! I’m your expense assistant. Ask me things like where you spent the most this week, your top categories, or ask me to add, update, or delete a transaction.",
    };
  }

  if (!isSpendingAdviceQuery(normalizedMessage)) {
    return {
      reply: buildUnclearMessageReply(),
    };
  }

  if (isAmbiguousAdviceMessage(normalizedMessage)) {
    return {
      reply:
        "I’m your expense assistant, but I need a bit more detail to answer that. You can ask: 'lowest spending category this week', 'highest spending this month', or 'where did I spend the most this week?'.",
    };
  }

  if (isFinancialAdviceQuery(normalizedMessage)) {
    return {
      reply: buildFinancialCoachingReply(transactions),
    };
  }

  return {
    reply: buildGeneralSpendingReply(transactions),
  };
};
