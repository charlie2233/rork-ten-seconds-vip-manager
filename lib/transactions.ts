type TranslateFn = (key: string, params?: Record<string, string>) => string;

const IRVINE_STORE_NAME = 'Irvine';

const DESCRIPTION_TRANSLATION_KEYS: Record<string, { key: string; params?: Record<string, string> }> = {
  '门店消费 - 十秒到(朝阳店)': { key: 'transactions.desc.storeSpend', params: { store: IRVINE_STORE_NAME } },
  '门店消费 - 十秒到(海淀店)': { key: 'transactions.desc.storeSpend', params: { store: IRVINE_STORE_NAME } },
  '门店消费 - 十秒到(西城店)': { key: 'transactions.desc.storeSpend', params: { store: IRVINE_STORE_NAME } },
  '会员日充值赠送': { key: 'transactions.desc.memberDayBonus' },
  '账户充值': { key: 'transactions.desc.accountTopUp' },
  '新年会员礼': { key: 'transactions.desc.newYearGift' },
};

export function getTransactionDescription(rawDescription: string, t: TranslateFn): string {
  const entry = DESCRIPTION_TRANSLATION_KEYS[rawDescription];
  if (!entry) return rawDescription;
  return t(entry.key, entry.params);
}

