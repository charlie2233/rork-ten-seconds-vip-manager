import * as z from "zod";
import { createTRPCRouter, publicProcedure } from "../create-context";

interface Transaction {
  id: string;
  type: 'spend' | 'deposit' | 'bonus' | 'refund';
  amount: number;
  description: string;
  date: string;
  balance: number;
}

const mockTransactions: Transaction[] = [
  {
    id: '1',
    type: 'spend',
    amount: -128.00,
    description: '门店消费 - 十秒到(朝阳店)',
    date: '2026-01-12 12:30',
    balance: 2580.00,
  },
  {
    id: '2',
    type: 'bonus',
    amount: 50.00,
    description: '会员日充值赠送',
    date: '2026-01-10 14:22',
    balance: 2708.00,
  },
  {
    id: '3',
    type: 'deposit',
    amount: 500.00,
    description: '账户充值',
    date: '2026-01-10 14:20',
    balance: 2658.00,
  },
  {
    id: '4',
    type: 'spend',
    amount: -89.50,
    description: '门店消费 - 十秒到(海淀店)',
    date: '2026-01-08 19:15',
    balance: 2158.00,
  },
  {
    id: '5',
    type: 'spend',
    amount: -156.00,
    description: '门店消费 - 十秒到(西城店)',
    date: '2026-01-05 13:45',
    balance: 2247.50,
  },
  {
    id: '6',
    type: 'deposit',
    amount: 1000.00,
    description: '账户充值',
    date: '2026-01-01 10:00',
    balance: 2403.50,
  },
  {
    id: '7',
    type: 'bonus',
    amount: 100.00,
    description: '新年会员礼',
    date: '2026-01-01 00:00',
    balance: 1403.50,
  },
];

export const transactionsRouter = createTRPCRouter({
  list: publicProcedure
    .input(z.object({ 
      userId: z.string().optional(),
      limit: z.number().optional().default(10),
    }))
    .query(({ input }) => {
      if (!input.userId) {
        return [];
      }
      return mockTransactions.slice(0, input.limit);
    }),

  getRecent: publicProcedure
    .input(z.object({ 
      userId: z.string().optional(),
      count: z.number().optional().default(3),
    }))
    .query(({ input }) => {
      if (!input.userId) {
        return [];
      }
      return mockTransactions.slice(0, input.count);
    }),
});
