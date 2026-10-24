import { generateInsightSchema, AIInsightSchema } from '../validators/insight.validator.js';

describe('AI Insight Schemas & Validation', () => {
  describe('generateInsightSchema', () => {
    it('should accept valid YYYY-MM formatted month', () => {
      const valid = generateInsightSchema.safeParse({ month: '2026-09' });
      expect(valid.success).toBe(true);
      expect(valid.data.month).toBe('2026-09');
    });

    it('should reject invalid month formats', () => {
      const badCases = [
        { month: '2026-9' },
        { month: '09-2026' },
        { month: '2026/09' },
        { month: 'September 2026' },
        { month: '' },
      ];

      for (const testCase of badCases) {
        const result = generateInsightSchema.safeParse(testCase);
        expect(result.success).toBe(false);
      }
    });
  });

  describe('AIInsightSchema (Gemini Output Schema)', () => {
    it('should validate structured Gemini output accurately', () => {
      const sampleGeminiOutput = {
        total_analyzed_amount: 1250.75,
        category_breakdown: [
          {
            category: 'Food & Dining',
            total_spent: 450.0,
            percentage_of_total: 35.9,
          },
          {
            category: 'Housing',
            total_spent: 800.75,
            percentage_of_total: 64.1,
          },
        ],
        unnecessary_spending_identified: [
          'Frequent small transactions at Starbucks totaling $85.',
        ],
        actionable_tips: [
          'Reduce daily coffee shop visits by brewing coffee at home to save approximately $80 next month.',
          'Review recurring monthly streaming subscriptions for unused services.',
          'Plan grocery meals in advance to minimize last-minute takeout orders.',
        ],
      };

      const result = AIInsightSchema.safeParse(sampleGeminiOutput);
      expect(result.success).toBe(true);
      expect(result.data.actionable_tips.length).toBe(3);
      expect(result.data.total_analyzed_amount).toBe(1250.75);
    });

    it('should fail if actionable_tips has more or less than 3 tips', () => {
      const invalidTipsOutput = {
        total_analyzed_amount: 500,
        category_breakdown: [
          { category: 'Utilities', total_spent: 500, percentage_of_total: 100 },
        ],
        unnecessary_spending_identified: [],
        actionable_tips: [
          'Only one tip provided',
        ],
      };

      const result = AIInsightSchema.safeParse(invalidTipsOutput);
      expect(result.success).toBe(false);
      expect(result.error.errors.some((e) => e.path.includes('actionable_tips'))).toBe(true);
    });

    it('should fail if total_analyzed_amount is not a number', () => {
      const invalidAmountOutput = {
        total_analyzed_amount: 'one thousand',
        category_breakdown: [],
        unnecessary_spending_identified: [],
        actionable_tips: ['Tip 1', 'Tip 2', 'Tip 3'],
      };

      const result = AIInsightSchema.safeParse(invalidAmountOutput);
      expect(result.success).toBe(false);
    });
  });
});
