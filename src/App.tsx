import { useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type HoldingKind = 'ETF/株式' | '投資信託';
type Holding = {
  id: string;
  name: string;
  code: string;
  account: string;
  category: string;
  kind: HoldingKind;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  profitLoss: number;
  profitRate: number;
  policy: string;
};

type TradeMemo = {
  id: string;
  date: string;
  name: string;
  type: string;
  account: string;
  quantity: number;
  amount: number;
  memo: string;
};

type MonthlyAsset = {
  id: string;
  month: string;
  totalAsset: number;
  profitLoss: number;
  depositMemo: string;
  comment: string;
};

type CanadaAsset = {
  id: string;
  name: string;
  currency: 'CAD';
  amountCad: number;
  rate: number;
  category: string;
  memo: string;
};

type ExchangeSetting = {
  cadJpyRate: number;
  updatedAt: string;
  otherAssetsJpy: number;
};

type SimulationInput = {
  currentAsset: number;
  monthlyContribution: number;
  annualReturn: number;
  target: number;
  years: number;
  mode: 'global' | 'japan';
};

type Summary = {
  japanTotal: number;
  canadaCad: number;
  canadaJpy: number;
  totalAsset: number;
  totalProfitLoss: number;
  principal: number;
  remaining: number;
  globalProgress: number;
  japanProgress: number;
  japanRatio: number;
  canadaRatio: number;
  japanEquityRatio: number;
  developedRatio: number;
  leverageRatio: number;
};

const GOAL = 100_000_000;
const STORAGE_KEYS = {
  holdings: 'roadmap_holdings_v1',
  trades: 'roadmap_trade_memos_v1',
  history: 'roadmap_monthly_history_v1',
  canada: 'roadmap_canada_assets_v1',
  exchange: 'roadmap_exchange_v1',
  simulation: 'roadmap_simulation_v1',
};

const COLORS = ['#0f9f6e', '#2563eb', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#64748b', '#84cc16', '#ec4899'];

const initialHoldings: Holding[] = [
  { id: 'h1', name: 'iS 日経 1329', code: '1329', account: 'NISA', category: '日本株ETF', kind: 'ETF/株式', quantity: 30, averageCost: 5070, currentPrice: 6540, marketValue: 196200, profitLoss: 44100, profitRate: 28.99, policy: '保有継続' },
  { id: 'h2', name: '日経高配当50', code: '1489', account: 'NISA', category: '日本株ETF・高配当', kind: 'ETF/株式', quantity: 251, averageCost: 2617, currentPrice: 3177, marketValue: 797427, profitLoss: 140531, profitRate: 21.4, policy: '12株追加済み。高配当ETFとして保有継続。今後も追加候補。' },
  { id: 'h3', name: '日経レバ', code: '1570', account: '特定', category: '日本株ETF・レバレッジ', kind: 'ETF/株式', quantity: 13, averageCost: 15961, currentPrice: 65140, marketValue: 846820, profitLoss: 639327, profitRate: 308.11, policy: '追加しない。上がれば一部利確候補。' },
  { id: 'h4', name: '日経レバ', code: '1570', account: '旧NISA', category: '日本株ETF・レバレッジ', kind: 'ETF/株式', quantity: 6, averageCost: 15387, currentPrice: 65140, marketValue: 390840, profitLoss: 298518, profitRate: 323.34, policy: '保有継続。追加しない。' },
  { id: 'h5', name: 'GX半導体', code: '2243', account: 'NISA', category: '日本株ETF・半導体', kind: 'ETF/株式', quantity: 241, averageCost: 2160, currentPrice: 4428, marketValue: 1067148, profitLoss: 546588, profitRate: 105, policy: '保有継続。追加は慎重。現時点では追加しない。' },
  { id: 'h6', name: 'イオン', code: '8267', account: '特定', category: '日本株・個別株', kind: 'ETF/株式', quantity: 300, averageCost: 453, currentPrice: 1545.5, marketValue: 463650, profitLoss: 327750, profitRate: 241.16, policy: '優待・生活株として保有継続。' },
  { id: 'h7', name: 'eMAXIS Slim 国内株式（TOPIX）', code: 'TOPIX', account: 'NISA', category: '国内株式投信', kind: '投資信託', quantity: 46969, averageCost: 20531, currentPrice: 30455, marketValue: 143044, profitLoss: 46609, profitRate: 48.3, policy: '60,000円購入注文済み。日本株の土台として厚くする。反映後の概算評価額：203,044円。' },
  { id: 'h8', name: 'iFreeNEXT FANG+インデックス', code: 'FANG+', account: '特定', category: '先進国株式・攻め', kind: '投資信託', quantity: 804, averageCost: 60759, currentPrice: 89214, marketValue: 7172, profitLoss: 2287, profitRate: 46.8, policy: '保有継続。追加しない。' },
  { id: 'h9', name: 'iFreeNEXT FANG+インデックス', code: 'FANG+', account: 'NISA', category: '先進国株式・攻め', kind: '投資信託', quantity: 77491, averageCost: 72133, currentPrice: 89214, marketValue: 691328, profitLoss: 132358, profitRate: 23.7, policy: '保有継続。追加しない。' },
  { id: 'h10', name: 'iFreeNEXT FANG+インデックス', code: 'FANG+', account: '積立NISA', category: '先進国株式・攻め', kind: '投資信託', quantity: 61478, averageCost: 76450, currentPrice: 89214, marketValue: 548469, profitLoss: 78469, profitRate: 16.7, policy: '保有継続。追加しない。' },
  { id: 'h11', name: 'eMAXIS Slim 米国株式（S&P500）', code: 'S&P500', account: '特定', category: '先進国株式・コア', kind: '投資信託', quantity: 47055, averageCost: 17002, currentPrice: 42272, marketValue: 198910, profitLoss: 118910, profitRate: 148.6, policy: 'コア資産として保有継続。' },
  { id: 'h12', name: 'eMAXIS Slim 米国株式（S&P500）', code: 'S&P500', account: '旧NISA', category: '先進国株式・コア', kind: '投資信託', quantity: 59471, averageCost: 18833, currentPrice: 42272, marketValue: 251395, profitLoss: 139395, profitRate: 124.5, policy: 'コア資産として保有継続。' },
  { id: 'h13', name: 'eMAXIS Slim 米国株式（S&P500）', code: 'S&P500', account: 'NISA', category: '先進国株式・コア', kind: '投資信託', quantity: 236593, averageCost: 33499, currentPrice: 42272, marketValue: 1000125, profitLoss: 207544, profitRate: 26.2, policy: 'コア資産として保有継続。' },
  { id: 'h14', name: 'iFree S&P500インデックス', code: 'S&P500', account: '特定', category: '先進国株式・コア', kind: '投資信託', quantity: 19234, averageCost: 19987, currentPrice: 46856, marketValue: 90122, profitLoss: 51680, profitRate: 134.4, policy: '保有継続。新規追加はeMAXIS Slim S&P500に寄せる。' },
  { id: 'h15', name: 'iFree S&P500インデックス', code: 'S&P500', account: '旧NISA', category: '先進国株式・コア', kind: '投資信託', quantity: 4430, averageCost: 24831, currentPrice: 46856, marketValue: 20757, profitLoss: 9757, profitRate: 88.7, policy: '保有継続。' },
  { id: 'h16', name: 'iFree S&P500インデックス', code: 'S&P500', account: 'NISA', category: '先進国株式・コア', kind: '投資信託', quantity: 4513, averageCost: 31531, currentPrice: 46856, marketValue: 21146, profitLoss: 6916, profitRate: 48.6, policy: '保有継続。' },
  { id: 'h17', name: 'SBI 日本株4.3ブル', code: '4.3ブル', account: '特定', category: '国内株式投信・超レバレッジ', kind: '投資信託', quantity: 22865, averageCost: 24535, currentPrice: 69943, marketValue: 159924, profitLoss: 103827, profitRate: 185.1, policy: '追加しない。このまま放置してもう少し勝ちを狙う。ただし出口ルールあり。' },
];

const initialTrades: TradeMemo[] = [
  { id: 't1', date: '2026-05-11', name: 'eMAXIS Slim 国内株式（TOPIX）', type: '購入注文済み', account: 'NISA', quantity: 0, amount: 60000, memo: '日本株の土台を厚くするため、投資信託として追加。分配金コースは再投資。注文受付 05/11 12:33、締切 05/11 15:00、受渡日 05/14。' },
  { id: 't2', date: '2026-05-11', name: '1489 日経高配当50', type: '購入済み', account: 'NISA', quantity: 12, amount: 38125, memo: '高配当ETF枠を厚くするため追加。1株3,178円、11株3,177円で約定。' },
];

const initialHistory: MonthlyAsset[] = [
  { id: 'm1', month: '2025-06', totalAsset: 5600000, profitLoss: 1650000, depositMemo: '定期入金', comment: '土台資産を継続積立' },
  { id: 'm2', month: '2025-07', totalAsset: 5750000, profitLoss: 1710000, depositMemo: '10万円', comment: 'S&P500中心に堅調' },
  { id: 'm3', month: '2025-08', totalAsset: 5900000, profitLoss: 1800000, depositMemo: '10万円', comment: '日本株ETFが上昇' },
  { id: 'm4', month: '2025-09', totalAsset: 6020000, profitLoss: 1850000, depositMemo: '10万円', comment: '攻め枠は様子見' },
  { id: 'm5', month: '2025-10', totalAsset: 6180000, profitLoss: 1920000, depositMemo: '10万円', comment: '高配当ETFを確認' },
  { id: 'm6', month: '2025-11', totalAsset: 6310000, profitLoss: 1980000, depositMemo: '10万円', comment: 'コア資産維持' },
  { id: 'm7', month: '2025-12', totalAsset: 6420000, profitLoss: 2020000, depositMemo: '賞与一部', comment: '年末スナップショット' },
  { id: 'm8', month: '2026-01', totalAsset: 6500000, profitLoss: 2100000, depositMemo: '10万円', comment: 'NISA枠を意識' },
  { id: 'm9', month: '2026-02', totalAsset: 6630000, profitLoss: 2180000, depositMemo: '10万円', comment: '半導体が堅調' },
  { id: 'm10', month: '2026-03', totalAsset: 6740000, profitLoss: 2230000, depositMemo: '10万円', comment: 'レバレッジ追加なし' },
  { id: 'm11', month: '2026-04', totalAsset: 6859221, profitLoss: 2410000, depositMemo: '10万円', comment: '松井証券資産の概算' },
  { id: 'm12', month: '2026-05', totalAsset: 6957346, profitLoss: 2538966, depositMemo: 'TOPIX注文・1489追加', comment: 'カナダ側込みで1億円まで約2,416万円' },
];

const initialCanadaAssets: CanadaAsset[] = [
  { id: 'c1', name: 'カナダ現金・預金', currency: 'CAD', amountCad: 180000, rate: 114.8, category: '現金・預金', memo: '概算。あとで修正可能。' },
  { id: 'c2', name: 'カナダ投資・RRSP等', currency: 'CAD', amountCad: 420000, rate: 114.8, category: '投資・退職口座', memo: '概算。あとで修正可能。' },
];

const initialExchange: ExchangeSetting = { cadJpyRate: 114.8, updatedAt: '2026-05-11', otherAssetsJpy: 0 };
const initialSimulation: SimulationInput = { currentAsset: 75837346, monthlyContribution: 100000, annualReturn: 5, target: GOAL, years: 30, mode: 'global' };
const emptyTrade: TradeMemo = { id: '', date: '2026-05-11', name: '', type: '購入注文済み', account: 'NISA', quantity: 0, amount: 0, memo: '' };

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function yen(value: number): string {
  return `¥${Math.round(Number.isFinite(value) ? value : 0).toLocaleString('ja-JP')}`;
}
function cad(value: number): string {
  return `${(Number.isFinite(value) ? value : 0).toLocaleString('ja-JP', { maximumFractionDigits: 2 })} CAD`;
}
function pct(value: number, digits = 1): string {
  return `${(Number.isFinite(value) ? value : 0).toFixed(digits)}%`;
}
function num(value: number): number {
  return Number.isFinite(value) ? value : 0;
}
function sumBy<T>(items: T[], selector: (item: T) => number): number {
  return items.reduce((sum, item) => sum + num(selector(item)), 0);
}
function groupByValue<T>(items: T[], keySelector: (item: T) => string, valueSelector: (item: T) => number) {
  return Object.values(items.reduce<Record<string, { name: string; value: number }>>((acc, item) => {
    const name = keySelector(item);
    acc[name] = acc[name] ?? { name, value: 0 };
    acc[name].value += num(valueSelector(item));
    return acc;
  }, {}));
}
function save<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
}
function todayMonth(): string {
  return new Date().toISOString().slice(0, 7);
}
function holdingLabel(holding: Holding): string {
  if (holding.code === '1489') return '高配当';
  if (holding.code === 'TOPIX') return '土台';
  if (holding.code.includes('S&P500')) return 'コア';
  if (['1570', '4.3ブル', 'FANG+', '2243'].includes(holding.code)) return '攻め枠';
  return '通常';
}
function judgment(holding: Holding): string {
  if (holding.code === '4.3ブル') {
    if (holding.marketValue >= 200000) return '一部利確候補：65,000円〜70,000円程度の売却を検討し、元本回収型へ移行。ナンピン禁止。';
    if (holding.marketValue < 130000) return '防御検討：13万円割れ。追加せずリスク縮小を検討。';
    return '追加せず保有継続。利確ライン未満、防御ライン以上。';
  }
  if (holding.code === '1570') return holding.profitRate >= 300 ? '大きく利益あり。追加せず保有。上昇時は一部利確候補。' : '追加しない。保有継続。';
  if (holding.code === '2243') return '半導体・AI相場に乗れている。追いかけ買いは慎重。';
  if (holding.code === 'FANG+') return '攻め枠として保有継続。追加は慎重。';
  if (holding.code === 'TOPIX') return '日本株の土台として追加候補。60,000円注文済み。';
  if (holding.code === '1489') return '高配当ETFとして追加済み。保有継続。';
  if (holding.code.includes('S&P500')) return 'コア資産として保有継続。';
  return '保有継続。';
}
function riskClass(text: string): string {
  if (text.includes('防御') || text.includes('禁止')) return 'danger';
  if (text.includes('利確') || text.includes('慎重')) return 'warning';
  return 'safe';
}
function scenarioData(input: SimulationInput) {
  const scenarios = [
    { name: '保守的 3%', rate: 3 },
    { name: '標準 5%', rate: 5 },
    { name: '強気 8%', rate: 8 },
    { name: '攻め 12%', rate: 12 },
  ];
  const rows = Array.from({ length: Math.max(1, input.years) + 1 }, (_, year) => ({ year: `${year}年後` } as Record<string, string | number>));
  const reaches: { name: string; years: string; final: number }[] = [];
  scenarios.forEach((scenario) => {
    let asset = num(input.currentAsset);
    let reached: number | null = asset >= input.target ? 0 : null;
    rows[0][scenario.name] = Math.round(asset);
    for (let year = 1; year <= input.years; year += 1) {
      for (let month = 1; month <= 12; month += 1) {
        asset = asset * (1 + scenario.rate / 12 / 100) + num(input.monthlyContribution);
      }
      rows[year][scenario.name] = Math.round(asset);
      if (reached === null && asset >= input.target) reached = year;
    }
    reaches.push({ name: scenario.name, years: reached === null ? `${input.years}年以内では未達` : `${reached}年後に到達`, final: Math.round(asset) });
  });
  return { rows, reaches };
}

function App() {
  const [holdings, setHoldings] = useState<Holding[]>(() => readStorage(STORAGE_KEYS.holdings, initialHoldings));
  const [trades, setTrades] = useState<TradeMemo[]>(() => readStorage(STORAGE_KEYS.trades, initialTrades));
  const [history, setHistory] = useState<MonthlyAsset[]>(() => readStorage(STORAGE_KEYS.history, initialHistory));
  const [canadaAssets, setCanadaAssets] = useState<CanadaAsset[]>(() => readStorage(STORAGE_KEYS.canada, initialCanadaAssets));
  const [exchange, setExchange] = useState<ExchangeSetting>(() => readStorage(STORAGE_KEYS.exchange, initialExchange));
  const [simulation, setSimulation] = useState<SimulationInput>(() => readStorage(STORAGE_KEYS.simulation, initialSimulation));
  const [tradeDraft, setTradeDraft] = useState<TradeMemo>(emptyTrade);
  const [sensitivityRate, setSensitivityRate] = useState(114.8);

  const canadaWithRate = useMemo(() => canadaAssets.map((asset) => ({ ...asset, rate: exchange.cadJpyRate, jpy: asset.amountCad * exchange.cadJpyRate })), [canadaAssets, exchange.cadJpyRate]);
  const summary: Summary = useMemo(() => {
    const japanTotal = sumBy(holdings, (h) => h.marketValue);
    const canadaCad = sumBy(canadaAssets, (a) => a.amountCad);
    const canadaJpy = canadaCad * exchange.cadJpyRate;
    const totalAsset = japanTotal + canadaJpy + exchange.otherAssetsJpy;
    const totalProfitLoss = sumBy(holdings, (h) => h.profitLoss);
    const principal = japanTotal - totalProfitLoss;
    const leverageValue = sumBy(holdings.filter((h) => ['1570', '4.3ブル'].includes(h.code)), (h) => h.marketValue);
    const japanEquity = sumBy(holdings.filter((h) => h.category.includes('日本') || h.category.includes('国内')), (h) => h.marketValue);
    const developed = sumBy(holdings.filter((h) => h.category.includes('先進国') || h.code.includes('S&P500') || h.code === 'FANG+'), (h) => h.marketValue);
    return {
      japanTotal,
      canadaCad,
      canadaJpy,
      totalAsset,
      totalProfitLoss,
      principal,
      remaining: Math.max(GOAL - totalAsset, 0),
      globalProgress: (totalAsset / GOAL) * 100,
      japanProgress: (japanTotal / GOAL) * 100,
      japanRatio: totalAsset ? (japanTotal / totalAsset) * 100 : 0,
      canadaRatio: totalAsset ? (canadaJpy / totalAsset) * 100 : 0,
      japanEquityRatio: japanTotal ? (japanEquity / japanTotal) * 100 : 0,
      developedRatio: japanTotal ? (developed / japanTotal) * 100 : 0,
      leverageRatio: japanTotal ? (leverageValue / japanTotal) * 100 : 0,
    };
  }, [holdings, canadaAssets, exchange]);

  const charts = useMemo(() => {
    const themeData = groupByValue(holdings, holdingLabel, (h) => h.marketValue);
    return {
      byCategory: groupByValue(holdings, (h) => h.category, (h) => h.marketValue),
      byAccount: groupByValue(holdings, (h) => h.account, (h) => h.marketValue),
      byHolding: holdings.map((h) => ({ name: `${h.code} ${h.account}`, 評価額: h.marketValue })),
      byProfit: holdings.map((h) => ({ name: `${h.code} ${h.account}`, 評価損益: h.profitLoss })),
      byTheme: themeData,
      country: [
        { name: '日本側資産', value: summary.japanTotal },
        { name: 'カナダ側資産（円換算）', value: summary.canadaJpy },
        { name: 'その他資産', value: exchange.otherAssetsJpy },
      ].filter((d) => d.value > 0),
      currency: [
        { name: 'JPY', value: summary.japanTotal + exchange.otherAssetsJpy },
        { name: 'CAD円換算', value: summary.canadaJpy },
      ],
      canadaBreakdown: canadaWithRate.map((a) => ({ name: a.category, value: a.jpy })),
    };
  }, [holdings, summary, exchange.otherAssetsJpy, canadaWithRate]);

  const leverageRisk = useMemo(() => {
    const nikkeiLever = sumBy(holdings.filter((h) => h.code === '1570'), (h) => h.marketValue);
    const bull = sumBy(holdings.filter((h) => h.code === '4.3ブル'), (h) => h.marketValue);
    return { nikkeiLever: nikkeiLever * 2, bull: bull * 4.3, total: nikkeiLever * 2 + bull * 4.3 };
  }, [holdings]);

  const milestones = [10000000, 20000000, 30000000, 50000000, 70000000, GOAL];
  const nextMilestone = milestones.find((m) => summary.totalAsset < m) ?? GOAL;
  const simData = useMemo(() => scenarioData(simulation), [simulation]);
  const sensitivityJpy = summary.canadaCad * sensitivityRate;
  const sensitivityTotal = summary.japanTotal + sensitivityJpy + exchange.otherAssetsJpy;
  const todayMemos = [
    holdings.find((h) => h.code === '4.3ブル') ? `4.3ブル：${judgment(holdings.find((h) => h.code === '4.3ブル')!)}` : '4.3ブルは未登録です。',
    'TOPIX投信60,000円は購入注文済み。',
    '1489は12株追加済み。高配当ETF枠を厚くしました。',
    `1570と4.3ブルのレバレッジ資産比率は${pct(summary.leverageRatio)}。追加は慎重。`,
    `現在の1億円達成率は日本側のみ${pct(summary.japanProgress)}、カナダ側込み${pct(summary.globalProgress)}。次の目標は${yen(nextMilestone)}。`,
  ];

  const updateHolding = (id: string, field: keyof Holding, value: string) => {
    const numericFields: (keyof Holding)[] = ['quantity', 'averageCost', 'currentPrice', 'marketValue', 'profitLoss', 'profitRate'];
    const next = holdings.map((h) => h.id === id ? { ...h, [field]: numericFields.includes(field) ? Number(value) || 0 : value } : h);
    setHoldings(next);
    save(STORAGE_KEYS.holdings, next);
  };
  const updateCanada = (id: string, field: keyof CanadaAsset, value: string) => {
    const next = canadaAssets.map((a) => a.id === id ? { ...a, [field]: field === 'amountCad' || field === 'rate' ? Number(value) || 0 : value } : a);
    setCanadaAssets(next);
    save(STORAGE_KEYS.canada, next);
  };
  const updateExchange = (field: keyof ExchangeSetting, value: string) => {
    const next = { ...exchange, [field]: field === 'updatedAt' ? value : Number(value) || 0 };
    setExchange(next);
    save(STORAGE_KEYS.exchange, next);
  };
  const updateHistory = (id: string, field: keyof MonthlyAsset, value: string) => {
    const next = history.map((h) => h.id === id ? { ...h, [field]: field === 'totalAsset' || field === 'profitLoss' ? Number(value) || 0 : value } : h);
    setHistory(next);
    save(STORAGE_KEYS.history, next);
  };
  const updateSimulation = (field: keyof SimulationInput, value: string) => {
    const next = { ...simulation, [field]: field === 'mode' ? value : Number(value) || 0 } as SimulationInput;
    setSimulation(next);
    save(STORAGE_KEYS.simulation, next);
  };
  const addTrade = () => {
    if (!tradeDraft.name.trim()) return;
    const next = [...trades, { ...tradeDraft, id: crypto.randomUUID() }];
    setTrades(next);
    save(STORAGE_KEYS.trades, next);
    setTradeDraft(emptyTrade);
  };
  const updateTrade = (id: string, field: keyof TradeMemo, value: string) => {
    const next = trades.map((t) => t.id === id ? { ...t, [field]: field === 'quantity' || field === 'amount' ? Number(value) || 0 : value } : t);
    setTrades(next);
    save(STORAGE_KEYS.trades, next);
  };
  const deleteTrade = (id: string) => {
    const next = trades.filter((t) => t.id !== id);
    setTrades(next);
    save(STORAGE_KEYS.trades, next);
  };
  const addSnapshot = () => {
    const next = [...history, { id: crypto.randomUUID(), month: todayMonth(), totalAsset: Math.round(summary.totalAsset), profitLoss: Math.round(summary.totalProfitLoss), depositMemo: '今月のスナップショット', comment: '日本側資産＋カナダ側資産込み' }];
    setHistory(next);
    save(STORAGE_KEYS.history, next);
  };
  const addHistoryRow = () => {
    const next = [...history, { id: crypto.randomUUID(), month: todayMonth(), totalAsset: 0, profitLoss: 0, depositMemo: '', comment: '' }];
    setHistory(next);
    save(STORAGE_KEYS.history, next);
  };
  const resetAll = () => {
    setHoldings(initialHoldings); setTrades(initialTrades); setHistory(initialHistory); setCanadaAssets(initialCanadaAssets); setExchange(initialExchange); setSimulation(initialSimulation); setSensitivityRate(initialExchange.cadJpyRate);
    save(STORAGE_KEYS.holdings, initialHoldings); save(STORAGE_KEYS.trades, initialTrades); save(STORAGE_KEYS.history, initialHistory); save(STORAGE_KEYS.canada, initialCanadaAssets); save(STORAGE_KEYS.exchange, initialExchange); save(STORAGE_KEYS.simulation, initialSimulation);
  };
  const exportCsv = () => {
    const header = ['銘柄名','コード','口座','資産分類','数量または保有数量','取得平均','現在値または基準価額','評価額','評価損益','損益率','方針','自動判定'];
    const rows = holdings.map((h) => [h.name, h.code, h.account, h.category, h.quantity, h.averageCost, h.currentPrice, h.marketValue, h.profitLoss, h.profitRate, h.policy, judgment(h)]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
    const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = 'holdings.csv'; a.click(); URL.revokeObjectURL(url);
  };
  const syncSimulationAsset = (mode: 'global' | 'japan') => {
    const next = { ...simulation, mode, currentAsset: Math.round(mode === 'global' ? summary.totalAsset : summary.japanTotal) };
    setSimulation(next); save(STORAGE_KEYS.simulation, next);
  };

  return (
    <main className="app">
      <header className="hero">
        <div>
          <p className="eyebrow">資産管理・判断支援・シミュレーション専用</p>
          <h1>1億円ロードマップ 投資ダッシュボード</h1>
          <p>日本側資産とカナダ側資産を円換算で統合し、1億円までの現在地を見える化します。API連携・自動売買・注文機能はありません。</p>
        </div>
        <button className="ghost dangerText" onClick={resetAll}>初期値に戻す</button>
      </header>

      <section className="summaryGrid">
        <SummaryCard title="金融総資産" value={yen(summary.totalAsset)} note="日本側＋カナダ側円換算＋その他" accent="blue" />
        <SummaryCard title="日本側資産合計" value={yen(summary.japanTotal)} note={`日本側のみ達成率 ${pct(summary.japanProgress)}`} />
        <SummaryCard title="カナダ側資産合計" value={cad(summary.canadaCad)} note={`円換算 ${yen(summary.canadaJpy)}`} />
        <SummaryCard title="使用為替レート" value={`1 CAD = ${exchange.cadJpyRate} 円`} note={`更新日 ${exchange.updatedAt}`} />
        <SummaryCard title="1億円までの残り" value={yen(summary.remaining)} note={`カナダ側込み達成率 ${pct(summary.globalProgress)}`} accent="green" />
        <SummaryCard title="評価損益合計" value={yen(summary.totalProfitLoss)} note={`日本側元本 ${yen(summary.principal)}`} accent="green" />
        <SummaryCard title="日本資産比率" value={pct(summary.japanRatio)} note={`カナダ資産比率 ${pct(summary.canadaRatio)}`} />
        <SummaryCard title="レバレッジ資産比率" value={pct(summary.leverageRatio)} note="日本側評価額に対する比率" accent="yellow" />
      </section>

      <section className="card memoCard">
        <h2>今日の判断メモ</h2>
        <ul>{todayMemos.map((memo) => <li key={memo}>{memo}</li>)}</ul>
      </section>

      <section className="card roadmap">
        <div className="sectionTitle"><h2>1億円ロードマップ</h2><span>日本側のみ {pct(summary.japanProgress)} / カナダ側込み {pct(summary.globalProgress)}</span></div>
        <div className="progress"><div style={{ width: `${Math.min(summary.globalProgress, 100)}%` }} /></div>
        <p className="bigNote">次の目標：{yen(nextMilestone)} まで残り {yen(Math.max(nextMilestone - summary.totalAsset, 0))}</p>
        <div className="milestones">{milestones.map((m) => <div key={m} className={summary.totalAsset >= m ? 'done' : ''}><strong>{yen(m)}</strong><span>{summary.totalAsset >= m ? '到達' : `残り ${yen(m - summary.totalAsset)}`}</span></div>)}</div>
      </section>

      <section className="grid2">
        <div className="card">
          <h2>為替レートを手動更新</h2>
          <div className="formGrid">
            <label>CAD/JPY<input type="number" step="0.1" value={exchange.cadJpyRate} onChange={(e) => updateExchange('cadJpyRate', e.target.value)} /></label>
            <label>更新日<input type="date" value={exchange.updatedAt} onChange={(e) => updateExchange('updatedAt', e.target.value)} /></label>
            <label>その他資産（JPY）<input type="number" value={exchange.otherAssetsJpy} onChange={(e) => updateExchange('otherAssetsJpy', e.target.value)} /></label>
          </div>
          <p className="hint">カナダ側資産合計：{cad(summary.canadaCad)} / 円換算：{yen(summary.canadaJpy)}</p>
        </div>
        <div className="card">
          <h2>為替感応度</h2>
          <label className="rangeLabel">CAD/JPY: {sensitivityRate.toFixed(1)}円<input type="range" min="100" max="130" step="0.1" value={sensitivityRate} onChange={(e) => setSensitivityRate(Number(e.target.value))} /></label>
          <div className="miniStats"><span>カナダ側円換算 {yen(sensitivityJpy)}</span><span>金融総資産 {yen(sensitivityTotal)}</span><span>1億円まで {yen(Math.max(GOAL - sensitivityTotal, 0))}</span></div>
          <table className="compact"><tbody>{[105, 110, 114.8, 120, 125].map((r) => <tr key={r}><td>1CAD = {r}円</td><td>{yen(summary.canadaCad * r)}</td><td>総資産 {yen(summary.japanTotal + summary.canadaCad * r + exchange.otherAssetsJpy)}</td></tr>)}</tbody></table>
        </div>
      </section>

      <section className="card">
        <div className="sectionTitle"><h2>カナダ側資産内訳</h2><span>円換算は cadAmount × cadJpyRate</span></div>
        <div className="tableWrap"><table><thead><tr><th>項目名</th><th>通貨</th><th>金額</th><th>為替レート</th><th>円換算</th><th>分類</th><th>メモ</th></tr></thead><tbody>{canadaWithRate.map((a) => <tr key={a.id}><td><input value={a.name} onChange={(e) => updateCanada(a.id, 'name', e.target.value)} /></td><td>{a.currency}</td><td><input type="number" value={a.amountCad} onChange={(e) => updateCanada(a.id, 'amountCad', e.target.value)} /></td><td>{exchange.cadJpyRate}</td><td>{yen(a.jpy)}</td><td><input value={a.category} onChange={(e) => updateCanada(a.id, 'category', e.target.value)} /></td><td><textarea value={a.memo} onChange={(e) => updateCanada(a.id, 'memo', e.target.value)} /></td></tr>)}</tbody></table></div>
      </section>

      <section className="chartGrid">
        <ChartCard title="日本側資産 vs カナダ側資産"><Donut data={charts.country} /></ChartCard>
        <ChartCard title="通貨別資産比率"><Donut data={charts.currency} /></ChartCard>
        <ChartCard title="カナダ側資産内訳"><Donut data={charts.canadaBreakdown} /></ChartCard>
        <ChartCard title="資産分類別"><Donut data={charts.byCategory} /></ChartCard>
        <ChartCard title="口座別評価額"><Donut data={charts.byAccount} /></ChartCard>
        <ChartCard title="攻め枠・土台・コア・高配当"><Donut data={charts.byTheme} /></ChartCard>
        <ChartCard title="銘柄別評価額"><BarGraph data={charts.byHolding} dataKey="評価額" color="#2563eb" /></ChartCard>
        <ChartCard title="銘柄別評価損益"><BarGraph data={charts.byProfit} dataKey="評価損益" color="#0f9f6e" /></ChartCard>
      </section>

      <section className="card">
        <div className="sectionTitle"><h2>保有銘柄一覧</h2><div><button onClick={exportCsv}>CSV出力</button></div></div>
        <div className="tableWrap holdings"><table><thead><tr><th>銘柄名</th><th>コード</th><th>口座</th><th>資産分類</th><th>数量/保有数量</th><th>取得平均</th><th>現在値/基準価額</th><th>評価額</th><th>評価損益</th><th>損益率</th><th>方針</th><th>自動判定</th></tr></thead><tbody>{holdings.map((h) => <tr key={h.id}><td><strong>{h.name}</strong><span className={`tag tag-${holdingLabel(h)}`}>{holdingLabel(h)}</span></td><td>{h.code}</td><td>{h.account}</td><td>{h.category}</td><td><input type="number" value={h.quantity} onChange={(e) => updateHolding(h.id, 'quantity', e.target.value)} /></td><td><input type="number" value={h.averageCost} onChange={(e) => updateHolding(h.id, 'averageCost', e.target.value)} /></td><td><input type="number" value={h.currentPrice} onChange={(e) => updateHolding(h.id, 'currentPrice', e.target.value)} /></td><td><input type="number" value={h.marketValue} onChange={(e) => updateHolding(h.id, 'marketValue', e.target.value)} /><span>{yen(h.marketValue)}</span></td><td className={h.profitLoss >= 0 ? 'plus' : 'minus'}><input type="number" value={h.profitLoss} onChange={(e) => updateHolding(h.id, 'profitLoss', e.target.value)} />{yen(h.profitLoss)}</td><td><input type="number" value={h.profitRate} onChange={(e) => updateHolding(h.id, 'profitRate', e.target.value)} />{pct(h.profitRate, 2)}</td><td><textarea value={h.policy} onChange={(e) => updateHolding(h.id, 'policy', e.target.value)} /></td><td><span className={`judge ${riskClass(judgment(h))}`}>{judgment(h)}</span></td></tr>)}</tbody></table></div>
      </section>

      <section className="grid2">
        <div className="card">
          <h2>レバレッジ実質リスク表示</h2>
          <div className="miniStats"><span>1570の実質リスク感 {yen(leverageRisk.nikkeiLever)}</span><span>4.3ブルの実質リスク感 {yen(leverageRisk.bull)}</span><span>合計 {yen(leverageRisk.total)}</span><span>評価額比率 {pct(summary.leverageRatio)}</span></div>
          <p className="warningBox">レバレッジ資産は上昇時のリターンが大きい一方、下落時の損失も大きくなるため、追加投資は慎重に判断する</p>
        </div>
        <div className="card policy"><h2>現在の基本方針</h2><ul>{['4.3ブルは追加しない。このまま放置してもう少し勝ちを狙う。','ただし、20万円超で一部利確検討。','13万円割れで防御検討。','4.3ブルのナンピンは禁止。','TOPIX投信は60,000円購入注文済み。','1489日経高配当50は12株追加済み。','1570は追加しない。すでに十分大きい。','FANG+とGX半導体は追加しない。保有継続。','S&P500はコア資産として保有継続。','目的は短期の一発勝負ではなく、最終的に1億円を目指すこと。'].map((p) => <li key={p}>{p}</li>)}</ul></div>
      </section>

      <section className="card">
        <div className="sectionTitle"><h2>過去推移グラフ</h2><div><button onClick={addSnapshot}>今月のスナップショットを保存</button><button className="ghost" onClick={addHistoryRow}>月次行を追加</button><button className="ghost" onClick={() => { setHistory(initialHistory); save(STORAGE_KEYS.history, initialHistory); }}>初期サンプルに戻す</button></div></div>
        <div className="chartTall"><ResponsiveContainer width="100%" height="100%"><LineChart data={history}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" /><YAxis tickFormatter={(v) => `${Math.round(Number(v) / 10000)}万`} /><Tooltip formatter={(v) => yen(Number(v))} /><Legend /><Line type="monotone" dataKey="totalAsset" name="資産総額" stroke="#2563eb" strokeWidth={3} /><Line type="monotone" dataKey="profitLoss" name="評価損益" stroke="#0f9f6e" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
        <div className="tableWrap"><table><thead><tr><th>年月</th><th>資産総額</th><th>評価損益</th><th>入金額メモ</th><th>コメント</th></tr></thead><tbody>{history.map((m) => <tr key={m.id}><td><input type="month" value={m.month} onChange={(e) => updateHistory(m.id, 'month', e.target.value)} /></td><td><input type="number" value={m.totalAsset} onChange={(e) => updateHistory(m.id, 'totalAsset', e.target.value)} /></td><td><input type="number" value={m.profitLoss} onChange={(e) => updateHistory(m.id, 'profitLoss', e.target.value)} /></td><td><input value={m.depositMemo} onChange={(e) => updateHistory(m.id, 'depositMemo', e.target.value)} /></td><td><input value={m.comment} onChange={(e) => updateHistory(m.id, 'comment', e.target.value)} /></td></tr>)}</tbody></table></div>
      </section>

      <section className="card">
        <div className="sectionTitle"><h2>今後の推移予想グラフ</h2><span>単純な月次複利シミュレーションです</span></div>
        <div className="buttonRow"><button onClick={() => syncSimulationAsset('global')} className={simulation.mode === 'global' ? 'active' : ''}>カナダ側込みをメイン</button><button onClick={() => syncSimulationAsset('japan')} className={simulation.mode === 'japan' ? 'active' : ''}>日本側資産のみ</button></div>
        <div className="formGrid simulation"><label>現在資産額<input type="number" value={simulation.currentAsset} onChange={(e) => updateSimulation('currentAsset', e.target.value)} /></label><label>毎月追加投資額<input type="number" value={simulation.monthlyContribution} onChange={(e) => updateSimulation('monthlyContribution', e.target.value)} /></label><label>年間想定リターン<input type="number" value={simulation.annualReturn} onChange={(e) => updateSimulation('annualReturn', e.target.value)} /></label><label>目標金額<input type="number" value={simulation.target} onChange={(e) => updateSimulation('target', e.target.value)} /></label><label>期間（年）<input type="number" value={simulation.years} onChange={(e) => updateSimulation('years', e.target.value)} /></label></div>
        <div className="chartTall"><ResponsiveContainer width="100%" height="100%"><LineChart data={simData.rows}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis tickFormatter={(v) => `${Math.round(Number(v) / 10000000)}千万`} /><Tooltip formatter={(v) => yen(Number(v))} /><Legend />{['保守的 3%','標準 5%','強気 8%','攻め 12%'].map((k, i) => <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i]} strokeWidth={3} dot={false} />)}</LineChart></ResponsiveContainer></div>
        <div className="tableWrap"><table><thead><tr><th>シナリオ</th><th>到達見込み</th><th>期間末資産額</th></tr></thead><tbody>{simData.reaches.map((r) => <tr key={r.name}><td>{r.name}</td><td>{r.years}</td><td>{yen(r.final)}</td></tr>)}</tbody></table></div>
      </section>

      <section className="card">
        <div className="sectionTitle"><h2>取引メモ</h2><span>追加・編集・削除できます</span></div>
        <div className="tradeDraft"><input type="date" value={tradeDraft.date} onChange={(e) => setTradeDraft({ ...tradeDraft, date: e.target.value })} /><input placeholder="銘柄" value={tradeDraft.name} onChange={(e) => setTradeDraft({ ...tradeDraft, name: e.target.value })} /><input placeholder="区分" value={tradeDraft.type} onChange={(e) => setTradeDraft({ ...tradeDraft, type: e.target.value })} /><input placeholder="口座" value={tradeDraft.account} onChange={(e) => setTradeDraft({ ...tradeDraft, account: e.target.value })} /><input type="number" placeholder="数量" value={tradeDraft.quantity} onChange={(e) => setTradeDraft({ ...tradeDraft, quantity: Number(e.target.value) || 0 })} /><input type="number" placeholder="金額" value={tradeDraft.amount} onChange={(e) => setTradeDraft({ ...tradeDraft, amount: Number(e.target.value) || 0 })} /><input placeholder="メモ" value={tradeDraft.memo} onChange={(e) => setTradeDraft({ ...tradeDraft, memo: e.target.value })} /><button onClick={addTrade}>追加</button></div>
        <div className="tableWrap"><table><thead><tr><th>日付</th><th>銘柄</th><th>区分</th><th>口座</th><th>数量</th><th>金額</th><th>メモ</th><th></th></tr></thead><tbody>{trades.map((t) => <tr key={t.id}><td><input type="date" value={t.date} onChange={(e) => updateTrade(t.id, 'date', e.target.value)} /></td><td><input value={t.name} onChange={(e) => updateTrade(t.id, 'name', e.target.value)} /></td><td><input value={t.type} onChange={(e) => updateTrade(t.id, 'type', e.target.value)} /></td><td><input value={t.account} onChange={(e) => updateTrade(t.id, 'account', e.target.value)} /></td><td><input type="number" value={t.quantity} onChange={(e) => updateTrade(t.id, 'quantity', e.target.value)} /></td><td><input type="number" value={t.amount} onChange={(e) => updateTrade(t.id, 'amount', e.target.value)} />{yen(t.amount)}</td><td><textarea value={t.memo} onChange={(e) => updateTrade(t.id, 'memo', e.target.value)} /></td><td><button className="ghost dangerText" onClick={() => deleteTrade(t.id)}>削除</button></td></tr>)}</tbody></table></div>
      </section>

      <footer className="notice">このアプリは個人の資産管理とシミュレーション用です。売買を自動実行するものではありません。表示される将来推移は仮定に基づく試算であり、将来の成果を保証するものではありません。実際の投資判断はご自身の責任で行ってください。カナダ側資産の円換算額は、入力されたCAD/JPY為替レートに基づく概算です。実際の換金額は為替手数料、送金手数料、税金、口座種別により異なります。</footer>
    </main>
  );
}

function SummaryCard({ title, value, note, accent = 'default' }: { title: string; value: string; note: string; accent?: 'default' | 'green' | 'blue' | 'yellow' }) {
  return <div className={`summaryCard ${accent}`}><span>{title}</span><strong>{value}</strong><small>{note}</small></div>;
}
function ChartCard({ title, children }: { title: string; children: ReactNode }) {
  return <div className="card chartCard"><h2>{title}</h2>{children}</div>;
}
function Donut({ data }: { data: { name: string; value: number }[] }) {
  return <div className="chartBox"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={data} dataKey="value" nameKey="name" innerRadius="45%" outerRadius="75%" paddingAngle={2}>{data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip formatter={(v) => yen(Number(v))} /><Legend /></PieChart></ResponsiveContainer></div>;
}
function BarGraph({ data, dataKey, color }: { data: Record<string, string | number>[]; dataKey: string; color: string }) {
  return <div className="chartBox"><ResponsiveContainer width="100%" height="100%"><BarChart data={data}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" interval={0} angle={-35} textAnchor="end" height={88} /><YAxis tickFormatter={(v) => `${Math.round(Number(v) / 10000)}万`} /><Tooltip formatter={(v) => yen(Number(v))} /><Bar dataKey={dataKey} fill={color} radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div>;
}

export default App;
