import { GoogleGenAI } from '@google/genai';
import { AIInsightSchema } from '../validators/insight.validator.js';

const SYSTEM_INSTRUCTION = `You are a friendly, highly practical personal financial advisor.
Your task is to analyze a user's expenses against their real monthly income, savings goal, and fixed obligations.
All currency figures are in Indian Rupees (₹ / INR). Use the ₹ symbol for all amounts.

COMMUNICATION & LANGUAGE RULES:
1. USE SIMPLE, EVERYDAY WORDS:
   Do NOT use complicated words or jargon like "discretionary", "runway", "triage", "sprint", "inflow", or "burn rate".
   Use simple terms that anyone understands: "daily spending", "flexible spending", "money left", "safe daily limit", "next few days".

2. FIXED BILLS ARE NON-NEGOTIABLE (AND ALREADY DISPLAYED):
   Expenses like House Rent, Mobile plans, and electricity bills cannot be avoided.
   DO NOT mention or repeat fixed bills or rent in the advice cards, as they are already displayed in the budget header.

3. STRICT DATA FIDELITY (NO FAKE OR GUESSWORK CATEGORIES):
   Only reference categories that the user ACTUALLY spent on.
   If the user has an essential expense like Healthcare, NEVER tell them to cut or restrict healthcare.
   Instead say: "Don't restrict your healthcare expenses (₹X). Instead, reduce spending on [Top 1 actual category] (₹Y) and [Top 2 actual category] (₹Z)." using their actual categories and amounts.
   DO NOT invent or assume categories like shopping, food, or entertainment if the user didn't spend on them.
   If Healthcare is their only expense, tell them to keep upcoming daily spending within their safe daily limit.

4. FINANCIAL VELOCITY & CONTEXT AWARENESS (SURPLUS VS. CRISIS):
   - SURPLUS (user is spending well below budget, e.g. plenty of money left for remaining days):
     Celebrate their discipline! DO NOT tell them to cut back on reasonable everyday spending like ₹50 on transportation. Praise their control and calculate bonus savings!
   - CRISIS (e.g. spent 50% of budget in 7 days):
     Sound an urgent wake-up alert ('At this pace, your money will run out in X days'). Tell them to freeze their top non-essential expense immediately, while reassuring them: 'I am with you to manage this, don't worry, here is our gameplan.'
   - BALANCED / CAUTION: Give practical, targeted pacing adjustments.

5. THREE CLEAR, ACTIVE ACTION CARDS:
   - Tip 1 (What you spent & money left): Days passed, amount spent so far, days left, and safe daily limit to protect their savings.
   - Tip 2 (Where to save money / Surplus praise): Clear advice matching their financial state.
   - Tip 3 (Plan for the next few days): Simple, clear target for the upcoming days.

Return exclusively a valid JSON object matching the requested schema. No markdown wrapping.`;

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

/**
 * Timeout wrapper for external API calls to avoid hanging requests
 */
const callWithTimeout = (promise, ms = 7000, errorMsg = 'AI request timed out') => {
  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(errorMsg));
    }, ms);
  });
  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
};

/**
 * Generates simple, everyday, data-faithful advice without jargon
 */
const generateDataFaithfulAdvice = ({
  currentDay,
  daysInMonth,
  daysRemaining,
  monthName,
  flexibleSpent,
  flexibleRemaining,
  safeDailyAllowance,
  savingsTargetAmount,
  savingsPercent,
  sortedFlexibleCategories,
  flexibleExpenses,
  flexibleBudgetTotal,
}) => {
  const transactionCount = flexibleExpenses.length;
  const topCat = sortedFlexibleCategories[0]?.category || null;
  const topAmt = sortedFlexibleCategories[0]?.amount || 0;
  const otherCategories = sortedFlexibleCategories.filter((c) => c.category !== 'Healthcare');
  const healthItem = sortedFlexibleCategories.find((c) => c.category === 'Healthcare');
  const nonHealthCategories = sortedFlexibleCategories.filter((c) => c.category !== 'Healthcare');

  const daysAhead = Math.min(7, Math.max(1, daysRemaining));
  const budgetCap = Math.max(50, Math.round(safeDailyAllowance * daysAhead));

  const expectedDailyBudget = daysInMonth > 0 ? flexibleBudgetTotal / daysInMonth : 0;
  const actualDailyRate = currentDay > 0 ? flexibleSpent / currentDay : 0;
  const monthElapsedPercent = daysInMonth > 0 ? Math.round((currentDay / daysInMonth) * 100) : 0;
  const budgetSpentPercent = flexibleBudgetTotal > 0 ? Math.round((flexibleSpent / flexibleBudgetTotal) * 100) : 0;

  // Velocity States:
  // 1. Surplus: User is spending well below budget (e.g. spent only 29% when 83% of month elapsed, or remaining > budget)
  const isSurplus =
    flexibleRemaining > 0 &&
    (budgetSpentPercent <= monthElapsedPercent - 20 || (currentDay > 3 && actualDailyRate <= expectedDailyBudget * 0.75));

  // 2. Crisis: Over budget or burning cash at >1.5x speed with 5+ days remaining (e.g. ₹500 spent in 7 days out of ₹1,000)
  const isCrisis =
    flexibleRemaining <= 0 ||
    (currentDay >= 3 && daysRemaining >= 4 && actualDailyRate > expectedDailyBudget * 1.45);

  // 3. Caution: Pacing slightly fast (1.15x - 1.45x)
  const isCaution = !isCrisis && !isSurplus && actualDailyRate > expectedDailyBudget * 1.15;

  let tip1, tip2, tip3;

  const topSummary = sortedFlexibleCategories
    .slice(0, 2)
    .map((c) => `${c.category} ₹${c.amount.toFixed(0)}`)
    .join(', ');

  // ==================== 1. SURPLUS STATE (User has plenty of money left) ====================
  if (isSurplus) {
    const projectedBonusSavings = Math.max(
      0,
      Math.round(flexibleRemaining - actualDailyRate * daysRemaining)
    );

    tip1 = `Day ${currentDay} of ${daysInMonth}: You've spent only ₹${flexibleSpent.toFixed(0)} so far (${topSummary || 'daily needs'}). With ${daysRemaining} days left in ${monthName}, you have a massive cushion of ₹${Math.max(0, flexibleRemaining).toFixed(0)} left (Safe daily limit: ₹${Math.max(0, safeDailyAllowance).toFixed(0)}/day)!`;

    if (healthItem && nonHealthCategories.length > 0) {
      tip2 = `You are doing exceptionally well! Healthcare (₹${healthItem.amount.toFixed(0)}) is taken care of, and your spending on ${nonHealthCategories[0].category} (₹${nonHealthCategories[0].amount.toFixed(0)}) is completely reasonable and well within budget. You don't need to cut back—at your current pace (~₹${Math.round(actualDailyRate)}/day), you are on track to finish with over ₹${projectedBonusSavings} in extra bonus savings beyond your ₹${savingsTargetAmount} goal!`;
    } else {
      tip2 = `You are in complete control of your budget! Your everyday purchases (${topCat || 'daily spending'}) are very low. You don't need to cut back—if you keep spending at your current rate (~₹${Math.round(actualDailyRate)}/day), you will finish ${monthName} with an extra ₹${projectedBonusSavings} in bonus savings beyond your ₹${savingsTargetAmount} goal!`;
    }

    tip3 = `Plan for the next ${daysAhead} days: You have a comfortable cushion of ₹${Math.max(0, safeDailyAllowance).toFixed(0)}/day. Continue your mindful spending, and any leftover cash at month-end will go directly into your savings!`;
  }
  // ==================== 2. CRISIS STATE (Burning money too fast, e.g. 50% in 7 days) ====================
  else if (isCrisis) {
    const daysUntilBroke = actualDailyRate > 0 ? Math.max(1, Math.round(flexibleRemaining / actualDailyRate)) : 0;

    tip1 = `🚨 Urgent Budget Alert: Day ${currentDay} of ${daysInMonth}: You have already spent ${budgetSpentPercent}% of your monthly budget (₹${flexibleSpent.toFixed(0)}) in just ${currentDay} days! At this speed (~₹${Math.round(actualDailyRate)}/day), your money will be completely gone in about ${daysUntilBroke} days with ${daysRemaining} days still left in ${monthName}.`;

    if (healthItem) {
      tip2 = `Stop the financial drain: Don't restrict healthcare (₹${healthItem.amount.toFixed(0)}). But you must put an immediate freeze on ${nonHealthCategories[0]?.category || 'discretionary purchases'} (₹${nonHealthCategories[0]?.amount.toFixed(0) || 0}). I am with you to manage this—we need to hit the brakes now to prevent a severe month-end crisis.`;
    } else {
      tip2 = `Stop the financial drain: Your biggest expense is ${topCat} (₹${topAmt.toFixed(0)}). I am with you to manage this—you should put an immediate freeze on non-essential ${topCat} purchases starting today to protect yourself from running out of money.`;
    }

    tip3 = `Emergency Rescue Plan: For the next ${daysAhead} days, keep all everyday purchases strictly below ₹${budgetCap} total (maximum ₹${Math.max(0, Math.round(safeDailyAllowance))}/day). Stick to this limit and we will guide you safely back on track.`;
  }
  // ==================== 3. CAUTION STATE (Pacing slightly fast) ====================
  else if (isCaution) {
    tip1 = `Day ${currentDay} of ${daysInMonth}: You spent ₹${flexibleSpent.toFixed(0)} so far (${topSummary}). You are spending slightly faster than planned. You have ₹${Math.max(0, flexibleRemaining).toFixed(0)} left for the remaining ${daysRemaining} days (Safe daily limit: ₹${Math.max(0, safeDailyAllowance).toFixed(0)}/day).`;

    if (healthItem) {
      tip2 = `Don't restrict your healthcare expenses (₹${healthItem.amount.toFixed(0)}). Instead, slow down on ${nonHealthCategories[0]?.category || 'everyday purchases'} (₹${nonHealthCategories[0]?.amount.toFixed(0) || 0}) to bring your budget back into the safe zone.`;
    } else {
      tip2 = `Your highest spending is on ${topCat} (₹${topAmt.toFixed(0)}). Reducing spending here over the next few days will help bring you back into the safe zone.`;
    }

    tip3 = `Plan for the next ${daysAhead} days: Set a cap on everyday spending at ₹${budgetCap} total (about ₹${Math.round(safeDailyAllowance)}/day) to get back on track.`;
  }
  // ==================== 4. BALANCED / ON TRACK STATE ====================
  else {
    if (transactionCount === 0) {
      tip1 = `Day ${currentDay} of ${daysInMonth}: You haven't made any daily purchases yet. With ${daysRemaining} days left in ${monthName}, your full daily budget of ₹${flexibleBudgetTotal.toFixed(0)} is untouched (Safe daily limit: ₹${Math.max(0, safeDailyAllowance).toFixed(0)}/day) to hit your ₹${savingsTargetAmount} savings goal.`;
      tip2 = `You have zero extra expenses so far! Keep this habit going, stay within ₹${Math.round(safeDailyAllowance)}/day for daily needs, and put any money left straight into your savings.`;
      tip3 = `Plan for the next ${daysAhead} days: Keep your total daily spending below ₹${budgetCap} (₹${Math.round(safeDailyAllowance)}/day) so you finish ${monthName} with a positive savings balance.`;
    } else {
      tip1 = `Day ${currentDay} of ${daysInMonth}: You spent ₹${flexibleSpent.toFixed(0)} on everyday purchases (${topSummary}). With ${daysRemaining} days left in ${monthName}, you have ₹${Math.max(0, flexibleRemaining).toFixed(0)} left (Safe daily limit: ₹${Math.max(0, safeDailyAllowance).toFixed(0)}/day).`;

      if (healthItem) {
        if (nonHealthCategories.length >= 1) {
          tip2 = `Healthcare (₹${healthItem.amount.toFixed(0)}) is essential, so don't cut it. Your spending on ${nonHealthCategories[0].category} (₹${nonHealthCategories[0].amount.toFixed(0)}) is in healthy control—keep staying within ₹${Math.round(safeDailyAllowance)}/day to hit your ₹${savingsTargetAmount} savings goal.`;
        } else {
          tip2 = `Healthcare (₹${healthItem.amount.toFixed(0)}) is your only expense so far and it's essential, so don't cut it. Since you haven't spent on any other categories yet, keep your upcoming daily spending within ₹${Math.round(safeDailyAllowance)}/day to protect your ₹${savingsTargetAmount} savings.`;
        }
      } else if (sortedFlexibleCategories.length >= 2) {
        tip2 = `Your spending is balanced and on track. Your highest areas are ${sortedFlexibleCategories[0].category} (₹${sortedFlexibleCategories[0].amount.toFixed(0)}) and ${sortedFlexibleCategories[1].category} (₹${sortedFlexibleCategories[1].amount.toFixed(0)}). Staying within your ₹${Math.round(safeDailyAllowance)}/day limit will guarantee your savings goal.`;
      } else {
        tip2 = `${topCat} is your main spending area at ₹${topAmt.toFixed(0)}. Keep daily spending in this category below ₹${Math.max(20, Math.round(safeDailyAllowance * 0.5))}/day for the remaining ${daysRemaining} days to finish with extra savings.`;
      }

      tip3 = `Plan for the next ${daysAhead} days: Keep your everyday purchases below ₹${budgetCap} total (about ₹${Math.round(safeDailyAllowance)}/day) to smoothly reach your month-end goal.`;
    }
  }

  return [tip1, tip2, tip3];
};

/**
 * Generates an AI-driven monthly financial health report using Google Gemini or algorithmic pacing
 */
export const generateFinancialReport = async (month, expenses, userBudget = null) => {
  if (!expenses || expenses.length === 0) {
    const error = new Error('No expenses provided for financial analysis');
    error.status = 400;
    throw error;
  }

  const [yearNum, monthNum] = month.split('-').map(Number);
  const monthName = MONTH_NAMES[monthNum - 1] || month;
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();

  const now = new Date();
  const isCurrentMonth = now.getFullYear() === yearNum && now.getMonth() + 1 === monthNum;
  const currentDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  // Budget parameters
  const monthlyIncome = userBudget?.monthly_income ? Number(userBudget.monthly_income) : 3000;
  const savingsPercent = userBudget?.savings_target_percentage !== undefined ? Number(userBudget.savings_target_percentage) : 20;
  const savingsTargetAmount = Math.round(monthlyIncome * (savingsPercent / 100));

  const fixedBills = Array.isArray(userBudget?.fixed_bills) ? userBudget.fixed_bills : [];
  const fixedBillsTotal = fixedBills.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

  // Flexible budget pool = Income - Savings Target - Fixed Bills
  const flexibleBudgetTotal = Math.max(0, monthlyIncome - savingsTargetAmount - fixedBillsTotal);

  // Separate transactions into fixed obligations vs flexible spending
  const fixedKeywords = fixedBills.map((b) => b.name.toLowerCase());
  const fixedCategories = ['Housing']; // Base rent is always fixed

  let fixedSpent = 0;
  let flexibleSpent = 0;
  const flexibleCategoryTotals = {};
  const flexibleExpenses = [];

  expenses.forEach((e) => {
    const amt = Number(e.amount || 0);
    const merchantLower = (e.merchant || '').toLowerCase();
    const isFixed =
      fixedCategories.includes(e.category) ||
      fixedKeywords.some((k) => k && merchantLower.includes(k));

    if (isFixed) {
      fixedSpent += amt;
    } else {
      flexibleSpent += amt;
      flexibleExpenses.push(e);
      flexibleCategoryTotals[e.category] = (flexibleCategoryTotals[e.category] || 0) + amt;
    }
  });

  const totalSpentAll = expenses.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const flexibleRemaining = flexibleBudgetTotal - flexibleSpent;
  const safeDailyAllowance = daysRemaining > 0 ? Math.max(0, flexibleRemaining / daysRemaining) : 0;

  const expectedDailyBudget = daysInMonth > 0 ? flexibleBudgetTotal / daysInMonth : 0;
  const actualDailyRate = currentDay > 0 ? flexibleSpent / currentDay : 0;
  const monthElapsedPercent = daysInMonth > 0 ? Math.round((currentDay / daysInMonth) * 100) : 0;
  const budgetSpentPercent = flexibleBudgetTotal > 0 ? Math.round((flexibleSpent / flexibleBudgetTotal) * 100) : 0;

  // Determine pacing and velocity status
  const isSurplus =
    flexibleRemaining > 0 &&
    (budgetSpentPercent <= monthElapsedPercent - 20 || (currentDay > 3 && actualDailyRate <= expectedDailyBudget * 0.75));

  const isCrisis =
    flexibleRemaining <= 0 ||
    (currentDay >= 3 && daysRemaining >= 4 && actualDailyRate > expectedDailyBudget * 1.45);

  let pacingStatus = 'on_track';
  if (flexibleRemaining <= 0) {
    pacingStatus = 'deficit';
  } else if (isCrisis) {
    pacingStatus = 'crisis';
  } else if (daysRemaining > 0 && currentDay > 0 && actualDailyRate > expectedDailyBudget * 1.15) {
    pacingStatus = 'caution';
  } else if (isSurplus) {
    pacingStatus = 'surplus';
  }

  // Sorted flexible categories strictly from user transactions
  const sortedFlexibleCategories = Object.entries(flexibleCategoryTotals)
    .map(([cat, amt]) => ({
      category: cat,
      amount: amt,
      percentage: flexibleSpent > 0 ? Number(((amt / flexibleSpent) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.amount - a.amount);

  // Category breakdown for whole month
  const categoryTotalsAll = {};
  expenses.forEach((e) => {
    categoryTotalsAll[e.category] = (categoryTotalsAll[e.category] || 0) + Number(e.amount);
  });

  const categoryBreakdown = Object.entries(categoryTotalsAll)
    .map(([category, amt]) => ({
      category,
      total_spent: Number(amt.toFixed(2)),
      percentage_of_total: totalSpentAll > 0 ? Number(((amt / totalSpentAll) * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.total_spent - a.total_spent);

  const flexibleAnalysisObject = {
    monthly_income: monthlyIncome,
    savings_target_percentage: savingsPercent,
    savings_target_amount: savingsTargetAmount,
    fixed_bills_total: fixedBillsTotal,
    flexible_budget_total: flexibleBudgetTotal,
    flexible_spent_so_far: Number(flexibleSpent.toFixed(2)),
    flexible_remaining: Number(flexibleRemaining.toFixed(2)),
    days_elapsed: currentDay,
    days_remaining: daysRemaining,
    safe_daily_allowance: Number(safeDailyAllowance.toFixed(2)),
    pacing_status: pacingStatus,
  };

  const apiKey = process.env.GEMINI_API_KEY;

  // Generate simple, data-grounded advice
  const fallbackTips = generateDataFaithfulAdvice({
    currentDay,
    daysInMonth,
    daysRemaining,
    monthName,
    flexibleSpent,
    flexibleRemaining,
    safeDailyAllowance,
    savingsTargetAmount,
    savingsPercent,
    fixedBillsTotal,
    sortedFlexibleCategories,
    flexibleExpenses,
    flexibleBudgetTotal,
  });

  // Simple waste / pacing observation strictly for categories the user actually spent on
  const waste = [];
  if (flexibleRemaining <= 0) {
    const overBy = Math.abs(flexibleRemaining);
    waste.push(`Daily budget limit reached: You have spent ₹${flexibleSpent.toFixed(0)} of your ₹${flexibleBudgetTotal.toFixed(0)} everyday budget. You are ₹${overBy.toFixed(0)} over, which is now dipping into your ₹${savingsTargetAmount.toFixed(0)} savings.`);
  } else if (isCrisis) {
    waste.push(`High spending speed: At your current rate (~₹${Math.round(actualDailyRate)}/day), your remaining budget of ₹${flexibleRemaining.toFixed(0)} will run out before month-end.`);
  } else if (pacingStatus === 'caution') {
    waste.push(`Spending pace is slightly higher than expected. Moderating daily purchases will help preserve your ₹${savingsTargetAmount.toFixed(0)} savings goal.`);
  }

  sortedFlexibleCategories.forEach((catItem) => {
    if (catItem.category === 'Food & Dining') {
      const diningVisits = flexibleExpenses.filter((e) => e.category === 'Food & Dining').length;
      if (diningVisits >= 3) {
        waste.push(`Frequent food & coffee purchases (${diningVisits} visits totaling ₹${catItem.amount.toFixed(2)}).`);
      }
    } else if (catItem.category === 'Shopping') {
      waste.push(`Shopping purchases total ₹${catItem.amount.toFixed(2)} (${catItem.percentage}% of your daily spending).`);
    } else if (catItem.category === 'Entertainment') {
      waste.push(`Entertainment purchases total ₹${catItem.amount.toFixed(2)} (${catItem.percentage}% of your daily spending).`);
    }
  });

  if (waste.length === 0 && sortedFlexibleCategories.length > 0) {
    const top = sortedFlexibleCategories[0];
    if (top.category !== 'Healthcare') {
      waste.push(`${top.category} is your highest daily spending area at ₹${top.amount.toFixed(2)}.`);
    }
  }

  // Algorithmic Fallback Engine
  if (!apiKey || apiKey === 'replace_with_your_gemini_api_key') {
    console.warn('💡 Generating simple, friendly financial advice via pacing engine.');

    return {
      total_analyzed_amount: Number(totalSpentAll.toFixed(2)),
      category_breakdown: categoryBreakdown,
      unnecessary_spending_identified: waste,
      actionable_tips: fallbackTips,
      flexible_analysis: flexibleAnalysisObject,
      fixed_obligations_summary: fixedBills,
    };
  }

  // Gemini AI Prompt Integration with Strict Anti-Hallucination & Simple Language Constraints
  const presentCategories = sortedFlexibleCategories.map((c) => c.category);

  const budgetPromptContext = {
    month: monthName,
    days_in_month: daysInMonth,
    current_day: currentDay,
    days_remaining: daysRemaining,
    monthly_income: monthlyIncome,
    savings_target_percentage: savingsPercent,
    savings_target_amount: savingsTargetAmount,
    fixed_bills_total: fixedBillsTotal,
    flexible_budget_total: flexibleBudgetTotal,
    flexible_spent_so_far: flexibleSpent,
    flexible_remaining: flexibleRemaining,
    safe_daily_allowance: safeDailyAllowance,
    velocity_status: isSurplus ? 'HIGH_SURPLUS' : isCrisis ? 'CRISIS_OVERSPENDING' : pacingStatus,
    flexible_transactions: flexibleExpenses.map((e) => ({
      amount: Number(e.amount),
      merchant: e.merchant,
      category: e.category,
      date: e.expense_date,
    })),
  };

  const prompt = `Analyze this user's monthly spending using simple, friendly, everyday language (NO jargon like "discretionary", "runway", "triage"):
${JSON.stringify(budgetPromptContext, null, 2)}

Provide a JSON object adhering to the schema:
1. total_analyzed_amount (number)
2. category_breakdown (array of { category, total_spent, percentage_of_total })
3. unnecessary_spending_identified: array of simple observations. ONLY mention categories in active_categories_only (${presentCategories.join(', ') || 'None'}).
4. actionable_tips: EXACTLY 3 simple, practical tips:
   - Tip 1: Tell them what they spent in the ${currentDay} days so far, days left (${daysRemaining}), and safe daily limit (₹${Math.round(safeDailyAllowance)}/day).
   - Tip 2: ADAPT TO VELOCITY_STATUS!
     * If HIGH_SURPLUS: Praise their discipline! DO NOT tell them to cut back on small reasonable purchases (like ₹50 transportation). Tell them they are way ahead and will finish with extra bonus savings!
     * If CRISIS_OVERSPENDING: Sound an urgent wake-up alarm! Warn them that at this pace they will run out of money before month ends. Tell them to freeze their top non-essential expense, while reassuring them: "I am with you to manage this."
     * If CAUTION/ON_TRACK: Give targeted advice. NEVER tell them to restrict Healthcare!
   - Tip 3: A simple plan for the next few days with a clear rupee spending limit. NEVER tell them to cap or restrict Healthcare; only cap non-health categories!`;



  try {
    const ai = new GoogleGenAI({ apiKey });
    const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-flash-latest'];

    let responseText = '';
    let lastError = null;

    for (const modelName of candidateModels) {
      try {
        const response = await callWithTimeout(
          ai.models.generateContent({
            model: modelName,
            contents: prompt,
            config: {
              systemInstruction: SYSTEM_INSTRUCTION,
              responseMimeType: 'application/json',
            },
          }),
          7000,
          `Model ${modelName} timed out after 7s`
        );

        responseText = response.text?.trim() || '';
        if (responseText) {
          console.log(`🤖 Successfully generated AI financial report using Google Gemini (${modelName})`);
          break;
        }
      } catch (modelErr) {
        lastError = modelErr;
        console.warn(`Model ${modelName} unavailable or timed out, trying next candidate:`, modelErr.message?.slice(0, 100));
      }
    }

    if (!responseText) {
      throw lastError || new Error('Empty response received from AI advisor service');
    }

    const cleanedJson = responseText
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/```$/i, '')
      .trim();

    const parsedData = JSON.parse(cleanedJson);

    // Normalize tips and observations if the AI model output objects instead of strings
    if (Array.isArray(parsedData.actionable_tips)) {
      parsedData.actionable_tips = parsedData.actionable_tips.map((t) => {
        if (typeof t === 'string') return t;
        if (typeof t === 'object' && t !== null) {
          return t.tip || t.description || t.text || t.content || Object.values(t).join(' - ');
        }
        return String(t);
      });
    }
    if (Array.isArray(parsedData.unnecessary_spending_identified)) {
      parsedData.unnecessary_spending_identified = parsedData.unnecessary_spending_identified.map((u) => {
        if (typeof u === 'string') return u;
        if (typeof u === 'object' && u !== null) {
          return u.observation || u.text || u.description || Object.values(u).join(' - ');
        }
        return String(u);
      });
    }

    parsedData.flexible_analysis = flexibleAnalysisObject;
    parsedData.fixed_obligations_summary = fixedBills.map((b) => ({
      name: b.name,
      amount: Number(b.amount || 0),
      category: b.category || 'Miscellaneous',
    }));

    const validationResult = AIInsightSchema.safeParse(parsedData);
    if (!validationResult.success) {
      console.error('AI JSON response failed schema validation:', validationResult.error.errors);
      throw new Error('AI analysis output did not adhere to required financial health schema');
    }

    return validationResult.data;
  } catch (err) {
    console.warn('Gemini call failed, falling back to data-faithful pacing report:', err.message);

    return {
      total_analyzed_amount: Number(totalSpentAll.toFixed(2)),
      category_breakdown: categoryBreakdown,
      unnecessary_spending_identified: waste,
      actionable_tips: fallbackTips,
      flexible_analysis: flexibleAnalysisObject,
      fixed_obligations_summary: fixedBills,
    };
  }
};

/**
 * Interactive Chat with Google Gemini Financial Advisor
 */
export const chatWithFinancialAdvisor = async ({
  userMessage,
  conversationHistory = [],
  month,
  expenses = [],
  userBudget = null,
}) => {
  if (!userMessage || !userMessage.trim()) {
    throw new Error('Message is required');
  }

  const apiKey = process.env.GEMINI_API_KEY;

  const [yearNum, monthNum] = (month || new Date().toISOString().slice(0, 7)).split('-').map(Number);
  const monthName = MONTH_NAMES[monthNum - 1] || month;
  const daysInMonth = new Date(yearNum, monthNum, 0).getDate();
  const now = new Date();
  const isCurrentMonth = now.getFullYear() === yearNum && now.getMonth() + 1 === monthNum;
  const currentDay = isCurrentMonth ? Math.min(now.getDate(), daysInMonth) : daysInMonth;
  const daysRemaining = Math.max(0, daysInMonth - currentDay);

  const monthlyIncome = userBudget?.monthly_income ? Number(userBudget.monthly_income) : 3000;
  const savingsPercent = userBudget?.savings_target_percentage !== undefined ? Number(userBudget.savings_target_percentage) : 20;
  const savingsTargetAmount = Math.round(monthlyIncome * (savingsPercent / 100));

  const fixedBills = Array.isArray(userBudget?.fixed_bills) ? userBudget.fixed_bills : [];
  const fixedBillsTotal = fixedBills.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
  const flexibleBudgetTotal = Math.max(0, monthlyIncome - savingsTargetAmount - fixedBillsTotal);

  const fixedKeywords = fixedBills.map((b) => (b.name || '').toLowerCase());
  const fixedCategories = ['Housing'];

  let flexibleSpent = 0;
  const categoryTotals = {};

  expenses.forEach((e) => {
    const amt = Number(e.amount || 0);
    const mLower = (e.merchant || '').toLowerCase();
    const isFixed = fixedCategories.includes(e.category) || fixedKeywords.some((k) => k && mLower.includes(k));
    if (!isFixed) {
      flexibleSpent += amt;
      categoryTotals[e.category] = (categoryTotals[e.category] || 0) + amt;
    }
  });

  const flexibleRemaining = flexibleBudgetTotal - flexibleSpent;
  const safeDailyAllowance = daysRemaining > 0 ? Math.max(0, flexibleRemaining / daysRemaining) : 0;

  const financialContext = {
    month: monthName,
    days_in_month: daysInMonth,
    current_day: currentDay,
    days_remaining: daysRemaining,
    monthly_income: monthlyIncome,
    savings_goal: `₹${savingsTargetAmount} (${savingsPercent}%)`,
    fixed_bills_total: `₹${fixedBillsTotal}`,
    fixed_bills_list: fixedBills.map((b) => `${b.name}: ₹${b.amount}`),
    daily_spending_budget: `₹${flexibleBudgetTotal.toFixed(0)}`,
    daily_spent_so_far: `₹${flexibleSpent.toFixed(0)}`,
    money_left_for_daily_needs: `₹${flexibleRemaining.toFixed(0)}`,
    safe_daily_limit: `₹${Math.round(safeDailyAllowance)}/day`,
    spending_by_category: categoryTotals,
    recent_transactions: expenses.slice(0, 10).map((e) => `${e.expense_date}: ₹${e.amount} at ${e.merchant} (${e.category})`),
  };

  const systemInstruction = `You are a supportive, highly intelligent personal financial assistant powered by Google Gemini.
You are chatting with a user who is tracking their monthly budget in Indian Rupees (₹).
You have real-time access to their exact numbers for ${monthName}:
${JSON.stringify(financialContext, null, 2)}

COMMUNICATION & ADVISORY RULES:
1. Speak in a friendly, empathetic, personal tone ("I am with you to manage this, let's look at the numbers together").
2. Contextual understanding:
   - If they have reached or exceeded their daily spending budget (like ₹${flexibleSpent.toFixed(0)} spent of ₹${flexibleBudgetTotal.toFixed(0)}), be reassuring: remind them that their ₹${savingsTargetAmount} savings target is still safe, but any extra spending will begin reducing that savings target.
   - If they spent on Healthcare (an essential need), never tell them to cut or restrict healthcare!
   - If they are doing well with extra money left, celebrate their discipline and calculate their potential extra savings!
3. Keep responses direct, readable, and practical. Use formatting like bullet points when helpful.
4. Always use the ₹ symbol for currency. Avoid confusing corporate jargon.`;

  if (apiKey && apiKey !== 'replace_with_your_gemini_api_key') {
    try {
      const ai = new GoogleGenAI({ apiKey });
      const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3-flash-preview', 'gemini-flash-latest'];

      // Ensure multi-turn conversation starts with a 'user' message as required by Gemini API
      const contents = [];
      let hasUserStarted = false;

      if (Array.isArray(conversationHistory)) {
        conversationHistory.slice(-8).forEach((h) => {
          if (!h.text || !h.text.trim()) return;
          if (!hasUserStarted && h.role === 'model') {
            return; // Skip initial AI greeting so first turn is user
          }
          hasUserStarted = true;
          contents.push({
            role: h.role === 'model' ? 'model' : 'user',
            parts: [{ text: h.text.trim() }],
          });
        });
      }

      contents.push({
        role: 'user',
        parts: [{ text: userMessage.trim() }],
      });

      for (const model of candidateModels) {
        try {
          const response = await callWithTimeout(
            ai.models.generateContent({
              model,
              contents,
              config: {
                systemInstruction,
              },
            }),
            7000,
            `Chat model ${model} timed out after 7s`
          );

          const replyText = response.text?.trim();
          if (replyText) {
            return { reply: replyText, model_used: model };
          }
        } catch (err) {
          console.warn(`Chat model ${model} unavailable or timed out:`, err.message?.slice(0, 100));
        }
      }
    } catch (apiErr) {
      console.warn('Gemini chat failed, using fallback assistant reply:', apiErr.message);
    }
  }

  // Algorithmic Fallback response if API is unreachable
  return {
    reply: `Here is where you stand for ${monthName}: You have spent ₹${flexibleSpent.toFixed(0)} on everyday purchases out of your ₹${flexibleBudgetTotal.toFixed(0)} daily budget. With ${daysRemaining} days left, your safe daily limit is ₹${Math.round(safeDailyAllowance)}/day to protect your ₹${savingsTargetAmount} savings goal. Healthcare and fixed bills are protected. What else would you like to explore?`,
    model_used: 'local_engine',
  };
};

/**
 * Extracts structured expense information from a payment screenshot or paper receipt using Gemini Vision
 */
export const extractExpenseFromReceiptImage = async ({ imageBase64, mimeType = 'image/jpeg' }) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'replace_with_your_gemini_api_key') {
    throw new Error('Gemini API key is required to scan receipt screenshots.');
  }

  if (!imageBase64) {
    throw new Error('Image data is required.');
  }

  // Extract pure base64 payload
  const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '');

  const ai = new GoogleGenAI({ apiKey });
  const candidateModels = ['gemini-3.5-flash-lite', 'gemini-3-flash-preview'];

  const todayStr = new Date().toISOString().slice(0, 10);

  const prompt = `You are an AI financial receipt & UPI payment scanner.
Carefully examine this image (which may be a Google Pay, PhonePe, Paytm, or bank UPI transaction confirmation screenshot, or a printed receipt / bill).
Extract the transaction details into a JSON object matching this schema:
{
  "is_valid_transaction": boolean (true if this contains a payment or bill, false if unrelated photo),
  "amount": number (positive amount paid in Indian Rupees, e.g. 150.00),
  "merchant": string (clean store, recipient, or business name, e.g. "Swiggy", "Apollo Pharmacy", "Indian Oil", "DMart", "Zomato", "Uber"),
  "category": string (MUST be one of: "Food & Dining", "Transportation", "Shopping", "Entertainment", "Healthcare", "Utilities", "Housing", "Personal Care", "Miscellaneous"),
  "expense_date": string (in "YYYY-MM-DD" format. If only day/month is visible, use year 2026. If date is not visible, use "${todayStr}"),
  "notes": string (brief context, e.g. "Google Pay payment to Swiggy", "Pharmacy purchase")
}

If amount is ambiguous, look for the main bold paid number (e.g. ₹250 or Rs 250).
Output ONLY the raw JSON object. No explanation, no markdown backticks.`;

  let lastError = null;

  for (const model of candidateModels) {
    try {
      const response = await callWithTimeout(
        ai.models.generateContent({
          model,
          contents: [
            {
              role: 'user',
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType || 'image/jpeg',
                    data: cleanBase64,
                  },
                },
              ],
            },
          ],
          config: {
            responseMimeType: 'application/json',
          },
        }),
        9000,
        `Model ${model} timed out scanning image`
      );

      const replyText = response.text?.trim();
      if (replyText) {
        const cleanedJson = replyText
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/i, '')
          .replace(/```$/i, '')
          .trim();
        const parsed = JSON.parse(cleanedJson);

        // Normalize category
        const VALID_CATEGORIES = [
          'Housing',
          'Transportation',
          'Food & Dining',
          'Utilities',
          'Entertainment',
          'Healthcare',
          'Shopping',
          'Personal Care',
          'Miscellaneous',
        ];
        if (!VALID_CATEGORIES.includes(parsed.category)) {
          parsed.category = 'Miscellaneous';
        }

        // Validate amount
        parsed.amount = Number(parsed.amount || 0);

        return {
          ...parsed,
          model_used: model,
        };
      }
    } catch (err) {
      lastError = err;
      console.warn(`Vision model ${model} failed or timed out:`, err.message?.slice(0, 100));
    }
  }

  throw lastError || new Error('Could not analyze the receipt image. Please enter details manually.');
};

export default {
  generateFinancialReport,
  chatWithFinancialAdvisor,
  extractExpenseFromReceiptImage,
};
