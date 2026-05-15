import { TaxRules } from "./tax-rules.js";

export const defaults = {
  caseName: "",
  meetingDate: new Date().toISOString().slice(0, 10),
  staffName: "",
  mainPurpose: "overall",
  meetingMemo: "",
  hasSpouse: "yes",
  spouseAge: "",
  spouseOwnAssets: 0,
  spouseFutureConsumption: 0,
  childrenCount: 2,
  adoptedCount: 0,
  parentsCount: 0,
  siblingsCount: 0,
  coResident: "unknown",
  homePlanChild: "unknown",
  cash: 30000000,
  securities: 10000000,
  homeProperty: 40000000,
  rentalProperty: 0,
  businessAssets: 0,
  otherAssets: 0,
  debts: 0,
  funeralCosts: 2000000,
  cashReserveTarget: 0,
  lifeInsurance: 0,
  lifeInsuranceHeirs: 0,
  priorGiftsAddBack: 0,
  priorGiftMode: "auto",
  assumedInheritanceYear: new Date().getFullYear(),
  giftsWithin3Years: 0,
  giftsYears4to7: 0,
  annualGiftPerPerson: 1100000,
  annualGiftRecipients: 2,
  annualGiftYears: 5,
  giftRateType: "special",
  settlementGift: 0,
  settlementDeductionUsed: 0,
  housingGift: 0,
  housingType: "unknown",
  spouseHomeGift: "unknown",
  nextTasks: "",
  actionAnnualGiftEnabled: false,
  actionAnnualGiftPerPerson: 1100000,
  actionAnnualGiftRecipients: 2,
  actionAnnualGiftYears: 5,
  actionHousingGiftEnabled: false,
  actionHousingGiftAmount: 10000000,
  actionLifeInsuranceEnabled: false,
  actionLifeInsuranceAmount: 10000000,
  actionSpouseHomeGiftEnabled: false,
  actionSpouseHomeGiftAmount: 20000000,
  actionSettlementEnabled: false,
  actionSettlementAmount: 25000000,
  actionRentalPropertyEnabled: false,
  actionRentalPurchaseAmount: 30000000,
  actionRentalLoanAmount: 0,
  actionRentalValuationReductionAmount: 10000000,
  actionRentalAnnualNetIncome: 0,
  actionStockReductionEnabled: false,
  actionStockReductionAmount: 0,
  actionCustomReductionEnabled: false,
  actionCustomReductionAmount: 0,
  divisionPlanName: "生活基盤・承継配慮案",
  divisionCashSpousePct: 50,
  divisionSecuritiesSpousePct: 50,
  divisionHomePropertySpousePct: 100,
  divisionRentalPropertySpousePct: 0,
  divisionBusinessAssetsSpousePct: 0,
  divisionOtherAssetsSpousePct: 50
};

const moneyFields = new Set([
  "spouseOwnAssets", "spouseFutureConsumption", "cash", "securities", "homeProperty", "rentalProperty", "businessAssets", "otherAssets",
  "debts", "funeralCosts", "cashReserveTarget", "lifeInsurance", "lifeInsuranceHeirs", "priorGiftsAddBack", "giftsWithin3Years", "giftsYears4to7",
  "annualGiftPerPerson", "settlementGift", "settlementDeductionUsed", "housingGift",
  "actionAnnualGiftPerPerson", "actionHousingGiftAmount", "actionLifeInsuranceAmount", "actionSpouseHomeGiftAmount",
  "actionSettlementAmount", "actionRentalPurchaseAmount", "actionRentalLoanAmount", "actionRentalValuationReductionAmount",
  "actionRentalAnnualNetIncome", "actionStockReductionAmount", "actionCustomReductionAmount"
]);

const percentFields = new Set([
  "divisionCashSpousePct", "divisionSecuritiesSpousePct", "divisionHomePropertySpousePct",
  "divisionRentalPropertySpousePct", "divisionBusinessAssetsSpousePct", "divisionOtherAssetsSpousePct"
]);

let state = normalizeState({ ...defaults });

export function normalizeState(input) {
  const out = { ...defaults, ...input };
  for (const field of moneyFields) out[field] = toNumber(out[field]);
  for (const field of percentFields) out[field] = Math.min(100, Math.max(0, toNumber(out[field])));
  ["childrenCount", "adoptedCount", "parentsCount", "siblingsCount", "annualGiftRecipients", "annualGiftYears", "actionAnnualGiftRecipients", "actionAnnualGiftYears", "assumedInheritanceYear"].forEach((field) => {
    out[field] = Math.max(0, Math.floor(toNumber(out[field])));
  });
  ["actionAnnualGiftEnabled", "actionHousingGiftEnabled", "actionLifeInsuranceEnabled", "actionSpouseHomeGiftEnabled", "actionSettlementEnabled", "actionRentalPropertyEnabled", "actionStockReductionEnabled", "actionCustomReductionEnabled"].forEach((field) => {
    out[field] = Boolean(out[field]);
  });
  return out;
}

function toNumber(v) {
  if (typeof v === "number") return Number.isFinite(v) ? v : 0;
  if (typeof v === "boolean") return v ? 1 : 0;
  const s = String(v ?? "").replace(/[０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0)).replace(/[^0-9.-]/g, "");
  const n = Number(s);
  return Number.isFinite(n) ? n : 0;
}

const num = (v) => toNumber(v);
const yen = (v) => num(v).toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
const comma = (v) => {
  const n = num(v);
  if (!n) return "";
  return n.toLocaleString("ja-JP");
};
const pct = (v) => `${Math.round(v * 100)}%`;
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
const GIFT_TAX_URL = "https://takatrp.github.io/gift-tax/";
const VERSION = "Rev.21";
const CHART_COLORS = ["#578899", "#6b8f71", "#b7791f", "#7c6f99", "#9a6b5b", "#4f7c8c", "#8a7f5a"];
const DIVISION_ASSETS = [
  { key: "cash", pctField: "divisionCashSpousePct", label: "現預金" },
  { key: "securities", pctField: "divisionSecuritiesSpousePct", label: "上場株式・投信等" },
  { key: "homeProperty", pctField: "divisionHomePropertySpousePct", label: "自宅土地建物" },
  { key: "rentalProperty", pctField: "divisionRentalPropertySpousePct", label: "賃貸不動産" },
  { key: "businessAssets", pctField: "divisionBusinessAssetsSpousePct", label: "非上場株式・事業用資産" },
  { key: "otherAssets", pctField: "divisionOtherAssetsSpousePct", label: "その他財産" }
];
const tabFlow = [
  ["summary", "概要"],
  ["family", "家族構成"],
  ["assets", "資産構成"],
  ["gifts", "贈与・保険"],
  ["diagnosis", "現状診断"],
  ["division", "分割案"],
  ["actions", "打ち手比較"],
  ["report", "面談レポート"],
  ["tps", "TPS8200転記表"],
  ["sources", "根拠一覧"]
];

function calcValueHtml(value, key) {
  const text = esc(value);
  return key ? `<button type="button" class="calc-link" data-breakdown="${esc(key)}" title="計算過程を表示">${text}</button>` : text;
}

function buildGiftTaxUrl(kind, overrides = {}) {
  const e = calcEstate(state);
  const params = new URLSearchParams({
    source: "estate-planning",
    caseName: state.caseName || "",
    estateTotal: Math.floor(e.netEstate),
    heirs: e.heirs.heirsForTax,
    spouse: state.hasSpouse === "yes" ? "1" : "0"
  });

  if (kind === "annual") {
    const amount = overrides.amount ?? state.annualGiftPerPerson;
    const annualMode = state.giftRateType === "general" ? "general" : "special";
    params.set("tabMode", "single");
    params.set("mode", "annual");
    params.set("annualMode", annualMode);
    params.set(annualMode === "general" ? "annualGeneralAmount" : "annualSpecialAmount", Math.floor(num(amount)));
  }

  if (kind === "settlement") {
    const amount = overrides.amount ?? state.settlementGift;
    params.set("tabMode", "single");
    params.set("mode", "seisan");
    params.set("seisanAmount", Math.floor(num(amount)));
    params.set("seisanUsedSpecial", Math.floor(num(state.settlementDeductionUsed)));
  }

  if (kind === "long") {
    params.set("tabMode", "multi");
    params.set("multiEstateTotal", Math.floor(e.netEstate));
    params.set("multiYears", Math.max(1, Math.floor(num(overrides.years ?? state.annualGiftYears) || 1)));
    params.set("multiReturnRate", "0");
    params.set("multiRecipients", Math.max(1, Math.floor(num(overrides.recipients ?? state.annualGiftRecipients) || 1)));
    params.set("multiHeirs", Math.max(1, e.heirs.heirsForTax || 1));
    params.set("multiSpouse", state.hasSpouse === "yes" ? "1" : "0");
    params.set("multiAnnualGiftPerPerson", Math.floor(num(overrides.annualGift ?? state.annualGiftPerPerson)));
    params.set("multiSeisanInitialGift", Math.floor(num(overrides.settlementGift ?? state.settlementGift)));
    params.set("multiSeisanAnnualGift", Math.floor(num(overrides.settlementAnnualGift ?? 1100000)));
    params.set("multiSeisanUsedSpecialBefore", Math.floor(num(state.settlementDeductionUsed)));
  }

  return `${GIFT_TAX_URL}?${params.toString()}`;
}

function giftTaxLink(kind, label, overrides = {}) {
  return `<a class="tool-link" href="${buildGiftTaxUrl(kind, overrides)}" target="_blank" rel="noopener">${label}</a>`;
}

function applyRate(amount, rates) {
  const taxable = Math.max(0, Math.floor(amount));
  const row = rates.find((r) => taxable <= r.max);
  return Math.max(0, Math.floor(taxable * row.rate - row.deduction));
}

export function getHeirInfo(input = state) {
  const spouse = input.hasSpouse === "yes" ? 1 : 0;
  const naturalChildren = Math.max(0, Math.floor(num(input.childrenCount)));
  const adopted = Math.max(0, Math.floor(num(input.adoptedCount)));
  const adoptedForTax = adopted ? Math.min(adopted, naturalChildren > 0 ? 1 : 2) : 0;
  const childHeirsForTax = naturalChildren + adoptedForTax;
  const parents = Math.max(0, Math.floor(num(input.parentsCount)));
  const siblings = Math.max(0, Math.floor(num(input.siblingsCount)));

  let rank = "";
  let heirsForTax = spouse;
  const shares = [];

  if (childHeirsForTax > 0) {
    rank = "子";
    heirsForTax += childHeirsForTax;
    if (spouse) {
      shares.push({ label: "配偶者", share: 1 / 2 });
      shares.push({ label: `子等 ${childHeirsForTax}人合計`, share: 1 / 2 });
    } else {
      shares.push({ label: `子等 ${childHeirsForTax}人合計`, share: 1 });
    }
  } else if (parents > 0) {
    rank = "直系尊属";
    heirsForTax += parents;
    if (spouse) {
      shares.push({ label: "配偶者", share: 2 / 3 });
      shares.push({ label: `直系尊属 ${parents}人合計`, share: 1 / 3 });
    } else {
      shares.push({ label: `直系尊属 ${parents}人合計`, share: 1 });
    }
  } else if (siblings > 0) {
    rank = "兄弟姉妹";
    heirsForTax += siblings;
    if (spouse) {
      shares.push({ label: "配偶者", share: 3 / 4 });
      shares.push({ label: `兄弟姉妹等 ${siblings}人合計`, share: 1 / 4 });
    } else {
      shares.push({ label: `兄弟姉妹等 ${siblings}人合計`, share: 1 });
    }
  } else {
    rank = spouse ? "配偶者のみ" : "要確認";
    shares.push({ label: spouse ? "配偶者" : "法定相続人未入力", share: spouse ? 1 : 0 });
  }

  return {
    spouse,
    naturalChildren,
    adopted,
    adoptedForTax,
    childHeirsForTax,
    parents,
    siblings,
    rank,
    heirsForTax,
    basicDeduction: 30000000 + 6000000 * heirsForTax,
    shares
  };
}

function calcGiftAddBack(input = state) {
  const year = Math.max(2024, Math.floor(num(input.assumedInheritanceYear)) || new Date().getFullYear());
  const addBackYears = year <= 2026 ? 3 : Math.min(7, 3 + (year - 2026));
  const extendedRatio = Math.max(0, addBackYears - 3) / 4;
  const extendedCandidate = num(input.giftsYears4to7) * extendedRatio;
  const extendedAddBack = extendedRatio > 0 ? Math.max(0, extendedCandidate - 1000000) : 0;
  const autoAddBack = num(input.giftsWithin3Years) + extendedAddBack;
  const effectiveAddBack = input.priorGiftMode === "manual" ? num(input.priorGiftsAddBack) : autoAddBack;
  const note = addBackYears === 7
    ? "4〜7年内部分は総額から100万円を控除した後に加算する前提です。"
    : addBackYears > 3
      ? "4〜7年内部分は日付別入力ではないため、移行年数に応じた目安です。実行前に贈与日別で確認してください。"
      : "3年以内の暦年贈与を加算対象として扱う目安です。";
  return {
    year,
    addBackYears,
    extendedRatio,
    extendedCandidate,
    extendedAddBack,
    autoAddBack,
    effectiveAddBack,
    note
  };
}

export function calcEstate(input = state) {
  const heirs = getHeirInfo(input);
  const insuranceExemption = Math.min(num(input.lifeInsuranceHeirs), 5000000 * heirs.heirsForTax);
  const taxableInsurance = Math.max(0, num(input.lifeInsurance) - insuranceExemption);
  const priorGift = calcGiftAddBack(input);
  const grossAssets =
    num(input.cash) + num(input.securities) + num(input.homeProperty) +
    num(input.rentalProperty) + num(input.businessAssets) + num(input.otherAssets) +
    taxableInsurance + priorGift.effectiveAddBack;
  const deductions = num(input.debts) + num(input.funeralCosts);
  const netEstate = Math.max(0, grossAssets - deductions);
  const taxableEstate = Math.max(0, netEstate - heirs.basicDeduction);
  const inheritanceTaxTotal = calcInheritanceTaxTotal(taxableEstate, heirs);
  const illiquid = num(input.homeProperty) + num(input.rentalProperty) + num(input.businessAssets);
  const illiquidRatio = grossAssets ? illiquid / grossAssets : 0;
  return { heirs, insuranceExemption, taxableInsurance, priorGiftAddBack: priorGift.effectiveAddBack, grossAssets, deductions, netEstate, taxableEstate, inheritanceTaxTotal, illiquid, illiquidRatio };
}

function calcInheritanceTaxTotal(taxableEstate, heirs) {
  if (!taxableEstate || heirs.heirsForTax <= 0) return 0;
  let total = 0;
  for (const s of heirs.shares) {
    if (s.share <= 0) continue;
    if (s.label.includes("子等")) {
      const count = Math.max(1, heirs.childHeirsForTax);
      const each = taxableEstate * s.share / count;
      total += applyRate(each, TaxRules.inheritanceTaxRates) * count;
    } else if (s.label.includes("直系尊属")) {
      const count = Math.max(1, heirs.parents);
      const each = taxableEstate * s.share / count;
      total += applyRate(each, TaxRules.inheritanceTaxRates) * count;
    } else if (s.label.includes("兄弟姉妹")) {
      const count = Math.max(1, heirs.siblings);
      const each = taxableEstate * s.share / count;
      total += applyRate(each, TaxRules.inheritanceTaxRates) * count;
    } else {
      total += applyRate(taxableEstate * s.share, TaxRules.inheritanceTaxRates);
    }
  }
  return Math.floor(total);
}

function calcSpouseScenario(spouseShare) {
  const e = calcEstate(state);
  if (!e.heirs.spouse) return null;
  const totalTaxBeforeCredit = e.inheritanceTaxTotal;
  const spouseTaxBefore = totalTaxBeforeCredit * spouseShare;
  const spouseStatutoryShare = e.heirs.shares.find((s) => s.label === "配偶者")?.share || 0;
  const spouseReliefLimit = Math.max(160000000, e.netEstate * spouseStatutoryShare);
  const spouseAcquisition = e.netEstate * spouseShare;
  const spouseRelief = spouseAcquisition <= spouseReliefLimit ? spouseTaxBefore : spouseTaxBefore * (spouseReliefLimit / Math.max(spouseAcquisition, 1));
  const firstTax = Math.max(0, totalTaxBeforeCredit - spouseRelief);

  const secondEstate = Math.max(0, num(state.spouseOwnAssets) + spouseAcquisition - num(state.spouseFutureConsumption));
  const secondHeirsInput = {
    ...state,
    hasSpouse: "no",
    childrenCount: state.childrenCount,
    adoptedCount: state.adoptedCount,
    parentsCount: 0,
    siblingsCount: 0,
    lifeInsurance: 0,
    lifeInsuranceHeirs: 0,
    cash: secondEstate,
    securities: 0,
    homeProperty: 0,
    rentalProperty: 0,
    businessAssets: 0,
    otherAssets: 0,
    priorGiftsAddBack: 0,
    debts: 0,
    funeralCosts: 0
  };
  const second = calcEstate(secondHeirsInput);
  return {
    spouseShare,
    firstTax: Math.floor(firstTax),
    spouseAcquisition: Math.floor(spouseAcquisition),
    secondEstate: Math.floor(secondEstate),
    secondTax: Math.floor(second.inheritanceTaxTotal),
    totalTax: Math.floor(firstTax + second.inheritanceTaxTotal),
    comment: spouseShare === 1 ? "一次は軽く見えやすいが二次相続が重くなりやすい" :
      spouseShare === 0 ? "一次で子へ寄せる案。配偶者生活資金に注意" :
      "一次・二次のバランス確認"
  };
}

export function calcDivisionPlan(input = state) {
  const normalized = normalizeState(input);
  const e = calcEstate(normalized);
  const hasSpouse = e.heirs.spouse === 1;
  const rows = DIVISION_ASSETS.map((asset) => {
    const amount = Math.max(0, num(normalized[asset.key]));
    const spousePct = hasSpouse ? Math.min(100, Math.max(0, num(normalized[asset.pctField]))) / 100 : 0;
    const spouseAmount = Math.floor(amount * spousePct);
    return {
      ...asset,
      amount,
      spousePct,
      spouseAmount,
      othersAmount: Math.max(0, amount - spouseAmount)
    };
  });
  const visibleAssets = rows.reduce((sum, row) => sum + row.amount, 0);
  const spouseVisibleAssets = rows.reduce((sum, row) => sum + row.spouseAmount, 0);
  const spouseShare = hasSpouse && visibleAssets > 0 ? spouseVisibleAssets / visibleAssets : 0;
  const spouseAcquisition = Math.floor(e.netEstate * spouseShare);
  const othersAcquisition = Math.max(0, e.netEstate - spouseAcquisition);
  const spouseStatutoryShare = e.heirs.shares.find((s) => s.label === "配偶者")?.share || 0;
  const spouseReliefLimit = hasSpouse ? Math.max(160000000, e.netEstate * spouseStatutoryShare) : 0;
  const taxBeforeCredit = e.inheritanceTaxTotal;
  const spouseTaxBefore = Math.floor(taxBeforeCredit * spouseShare);
  const spouseRelief = hasSpouse && spouseAcquisition > 0
    ? Math.floor(spouseTaxBefore * Math.min(1, spouseReliefLimit / spouseAcquisition))
    : 0;
  const spouseTaxAfter = Math.max(0, spouseTaxBefore - spouseRelief);
  const othersTax = Math.max(0, taxBeforeCredit - spouseTaxBefore);
  const payableTax = spouseTaxAfter + othersTax;
  const spouseCash = rows.find((row) => row.key === "cash")?.spouseAmount || 0;
  const othersCash = Math.max(0, num(normalized.cash) - spouseCash);
  const spouseCashShortage = Math.max(0, spouseTaxAfter - spouseCash);
  const othersCashShortage = Math.max(0, othersTax - othersCash);
  const cashShortage = spouseCashShortage + othersCashShortage;
  return {
    estate: e,
    hasSpouse,
    rows,
    visibleAssets,
    spouseVisibleAssets,
    spouseShare,
    spouseAcquisition,
    othersAcquisition,
    spouseStatutoryShare,
    spouseReliefLimit,
    taxBeforeCredit,
    spouseTaxBefore,
    spouseRelief,
    spouseTaxAfter,
    othersTax,
    payableTax,
    spouseCash,
    othersCash,
    spouseCashShortage,
    othersCashShortage,
    cashShortage
  };
}

export function calcGift(input = state) {
  const annualTaxable = Math.max(0, num(input.annualGiftPerPerson) - 1100000);
  const annualGiftTaxPerPerson = applyRate(annualTaxable, TaxRules.giftTaxRates[input.giftRateType] || TaxRules.giftTaxRates.special);
  const totalAnnualGift = num(input.annualGiftPerPerson) * num(input.annualGiftRecipients) * num(input.annualGiftYears);
  const totalAnnualGiftTax = annualGiftTaxPerPerson * num(input.annualGiftRecipients) * num(input.annualGiftYears);

  const settlementBase = Math.max(0, num(input.settlementGift) - 1100000);
  const remainingSpecial = Math.max(0, 25000000 - num(input.settlementDeductionUsed));
  const settlementTaxable = Math.max(0, settlementBase - remainingSpecial);
  const settlementTax = Math.floor(settlementTaxable * 0.2);

  const housingLimit = input.housingType === "eco" ? 10000000 : input.housingType === "other" ? 5000000 : 0;
  const housingTaxable = Math.max(0, num(input.housingGift) - housingLimit);
  const housingGiftTax = input.housingType === "unknown" ? 0 : applyRate(housingTaxable, TaxRules.giftTaxRates[input.giftRateType] || TaxRules.giftTaxRates.special);

  return { annualTaxable, annualGiftTaxPerPerson, totalAnnualGift, totalAnnualGiftTax, settlementBase, remainingSpecial, settlementTaxable, settlementTax, housingLimit, housingTaxable, housingGiftTax, giftAddBack: calcGiftAddBack(input) };
}

function rateLabel(amount, rates) {
  const taxable = Math.max(0, Math.floor(num(amount)));
  const row = rates.find((r) => taxable <= r.max) || rates[rates.length - 1];
  const maxLabel = Number.isFinite(row.max) ? `${yen(row.max)}以下` : "超過階層";
  return `${maxLabel}：税率${Math.round(row.rate * 100)}%・控除${yen(row.deduction)}`;
}

function inheritanceTaxBreakdownLines(e) {
  if (!e.taxableEstate || e.heirs.heirsForTax <= 0) return ["課税遺産総額が0円のため、相続税総額は0円"];
  const lines = [`課税遺産総額 ${yen(e.taxableEstate)} を法定相続分で按分`];
  e.heirs.shares.forEach((s) => {
    if (s.share <= 0) return;
    const shareAmount = e.taxableEstate * s.share;
    if (s.label.includes("子等")) {
      const count = Math.max(1, e.heirs.childHeirsForTax);
      const each = shareAmount / count;
      lines.push(`${s.label}：${yen(e.taxableEstate)} × ${pct(s.share)} ÷ ${count}人 = ${yen(each)} / 人、${rateLabel(each, TaxRules.inheritanceTaxRates)}`);
    } else if (s.label.includes("直系尊属")) {
      const count = Math.max(1, e.heirs.parents);
      const each = shareAmount / count;
      lines.push(`${s.label}：${yen(e.taxableEstate)} × ${pct(s.share)} ÷ ${count}人 = ${yen(each)} / 人、${rateLabel(each, TaxRules.inheritanceTaxRates)}`);
    } else if (s.label.includes("兄弟姉妹")) {
      const count = Math.max(1, e.heirs.siblings);
      const each = shareAmount / count;
      lines.push(`${s.label}：${yen(e.taxableEstate)} × ${pct(s.share)} ÷ ${count}人 = ${yen(each)} / 人、${rateLabel(each, TaxRules.inheritanceTaxRates)}`);
    } else {
      lines.push(`${s.label}：${yen(e.taxableEstate)} × ${pct(s.share)} = ${yen(shareAmount)}、${rateLabel(shareAmount, TaxRules.inheritanceTaxRates)}`);
    }
  });
  lines.push(`上記の各人別税額を合計 = ${yen(e.inheritanceTaxTotal)}`);
  return lines;
}

function getCalculationBreakdowns(input = state) {
  const e = calcEstate(input);
  const g = calcGift(input);
  const effect = calcActionEffect();
  const giftRateRows = TaxRules.giftTaxRates[input.giftRateType] || TaxRules.giftTaxRates.special;
  const annualTaxable = Math.max(0, num(input.annualGiftPerPerson) - 1100000);
  const cashAvailable = num(input.cash) - num(input.cashReserveTarget);
  const cashShortage = Math.max(0, e.inheritanceTaxTotal - cashAvailable);
  const cashSurplus = Math.max(0, cashAvailable - e.inheritanceTaxTotal);
  return {
    heirsForTax: {
      title: "法定相続人の数（税額計算用）",
      note: "養子は、実子がいる場合1人まで、実子がいない場合2人までを税額計算上の法定相続人に算入します。",
      lines: [
        `配偶者：${e.heirs.spouse}人`,
        `実子：${e.heirs.naturalChildren}人`,
        `養子入力：${e.heirs.adopted}人、税額計算上の養子算入：${e.heirs.adoptedForTax}人`,
        `子等の人数：${e.heirs.naturalChildren} + ${e.heirs.adoptedForTax} = ${e.heirs.childHeirsForTax}人`,
        `法定相続人の数：${e.heirs.heirsForTax}人（相続順位：${e.heirs.rank}）`
      ]
    },
    basicDeduction: {
      title: "相続税の基礎控除",
      lines: [
        `3,000万円 + 600万円 × 法定相続人 ${e.heirs.heirsForTax}人`,
        `${yen(30000000)} + ${yen(6000000 * e.heirs.heirsForTax)} = ${yen(e.heirs.basicDeduction)}`
      ]
    },
    grossAssets: {
      title: "課税対象財産 概算",
      lines: [
        `現預金 ${yen(input.cash)} + 上場株式・投信等 ${yen(input.securities)} + 自宅土地建物 ${yen(input.homeProperty)}`,
        `貸付不動産 ${yen(input.rentalProperty)} + 非上場株式・事業用資産 ${yen(input.businessAssets)} + その他財産 ${yen(input.otherAssets)}`,
        `課税対象保険金 ${yen(e.taxableInsurance)} + 生前贈与加算 ${yen(e.priorGiftAddBack)}`,
        `合計 = ${yen(e.grossAssets)}`
      ]
    },
    deductions: {
      title: "債務・葬式費用",
      lines: [`債務 ${yen(input.debts)} + 葬式費用 ${yen(input.funeralCosts)} = ${yen(e.deductions)}`]
    },
    netEstate: {
      title: "正味財産 概算",
      lines: [`課税対象財産 ${yen(e.grossAssets)} - 債務・葬式費用 ${yen(e.deductions)} = ${yen(e.netEstate)}`]
    },
    taxableEstate: {
      title: "課税遺産総額",
      lines: [`正味財産 ${yen(e.netEstate)} - 基礎控除 ${yen(e.heirs.basicDeduction)} = ${yen(e.taxableEstate)}`]
    },
    inheritanceTaxTotal: {
      title: "相続税総額 概算",
      note: "配偶者の税額軽減などの税額控除前の概算です。",
      lines: inheritanceTaxBreakdownLines(e)
    },
    actionAfterInheritanceTax: {
      title: "打ち手後の相続税総額 概算",
      note: "選択済みの打ち手を反映した後の概算です。贈与税コスト等は別途確認します。",
      lines: [
        `現状の相続税総額概算：${yen(effect.before.inheritanceTaxTotal)}`,
        `打ち手後の課税遺産総額：${yen(effect.after.taxableEstate)}`,
        ...inheritanceTaxBreakdownLines(effect.after),
        `現状との差額：${yen(effect.before.inheritanceTaxTotal - effect.after.inheritanceTaxTotal)}`
      ]
    },
    insuranceExemption: {
      title: "死亡保険金非課税枠",
      lines: [
        `法定上限：500万円 × 法定相続人 ${e.heirs.heirsForTax}人 = ${yen(5000000 * e.heirs.heirsForTax)}`,
        `相続人が受け取る死亡保険金入力額：${yen(input.lifeInsuranceHeirs)}`,
        `非課税枠利用額：min(${yen(input.lifeInsuranceHeirs)}, ${yen(5000000 * e.heirs.heirsForTax)}) = ${yen(e.insuranceExemption)}`
      ]
    },
    taxableInsurance: {
      title: "課税対象保険金",
      lines: [`死亡保険金総額 ${yen(input.lifeInsurance)} - 非課税枠利用額 ${yen(e.insuranceExemption)} = ${yen(e.taxableInsurance)}`]
    },
    annualGiftTaxPerPerson: {
      title: "暦年贈与税 / 人・年",
      lines: [
        `課税価格：贈与額 ${yen(input.annualGiftPerPerson)} - 基礎控除 ${yen(1100000)} = ${yen(g.annualTaxable)}`,
        `速算表：${rateLabel(annualTaxable, giftRateRows)}`,
        `贈与税：${yen(g.annualTaxable)} に速算表を適用 = ${yen(g.annualGiftTaxPerPerson)}`
      ]
    },
    totalAnnualGift: {
      title: "暦年贈与 移転総額",
      lines: [`${yen(input.annualGiftPerPerson)} × ${input.annualGiftRecipients}人 × ${input.annualGiftYears}年 = ${yen(g.totalAnnualGift)}`]
    },
    totalAnnualGiftTax: {
      title: "暦年贈与税 合計概算",
      lines: [`1人1年あたり贈与税 ${yen(g.annualGiftTaxPerPerson)} × ${input.annualGiftRecipients}人 × ${input.annualGiftYears}年 = ${yen(g.totalAnnualGiftTax)}`]
    },
    priorGiftAddBack: {
      title: "相続財産へ加算する贈与額",
      lines: [
        `想定相続年：${g.giftAddBack.year}年、加算対象期間目安：${g.giftAddBack.addBackYears}年`,
        `3年以内贈与：${yen(input.giftsWithin3Years)}`,
        `4〜7年部分の入力：${yen(input.giftsYears4to7)} × 移行割合 ${Math.round(g.giftAddBack.extendedRatio * 100)}% - ${yen(1000000)} = ${yen(g.giftAddBack.extendedAddBack)}`,
        `自動計算額：${yen(g.giftAddBack.autoAddBack)}、反映額：${yen(e.priorGiftAddBack)}`
      ]
    },
    settlementTax: {
      title: "相続時精算課税 贈与税概算",
      lines: [
        `年110万円控除後：${yen(input.settlementGift)} - ${yen(1100000)} = ${yen(g.settlementBase)}`,
        `特別控除残額：${yen(25000000)} - 使用済み ${yen(input.settlementDeductionUsed)} = ${yen(g.remainingSpecial)}`,
        `課税価格：${yen(g.settlementBase)} - ${yen(g.remainingSpecial)} = ${yen(g.settlementTaxable)}`,
        `贈与税：${yen(g.settlementTaxable)} × 20% = ${yen(g.settlementTax)}`
      ]
    },
    housingLimit: {
      title: "住宅資金贈与 非課税枠",
      lines: [`住宅区分：${input.housingType}、非課税枠 = ${yen(g.housingLimit)}`]
    },
    housingTaxable: {
      title: "住宅資金贈与 課税候補",
      lines: [`住宅資金贈与 ${yen(input.housingGift)} - 非課税枠 ${yen(g.housingLimit)} = ${yen(g.housingTaxable)}`]
    },
    illiquidRatio: {
      title: "不動産・事業資産比率",
      lines: [
        `固定的・分けにくい資産：自宅 ${yen(input.homeProperty)} + 貸付不動産 ${yen(input.rentalProperty)} + 事業資産 ${yen(input.businessAssets)} = ${yen(e.illiquid)}`,
        `総財産 ${yen(e.grossAssets)} に占める割合：${yen(e.illiquid)} ÷ ${yen(e.grossAssets)} = ${pct(e.illiquidRatio)}`
      ]
    },
    cashShortage: {
      title: "納税資金不足目安",
      lines: [
        `現預金目安：入力された現預金 = ${yen(input.cash)}`,
        `使える現預金目安：現預金 ${yen(input.cash)} - 生活費・予備資金 ${yen(input.cashReserveTarget)} = ${yen(cashAvailable)}`,
        `相続税総額概算 ${yen(e.inheritanceTaxTotal)} - 使える現預金目安 = ${yen(cashShortage)}`
      ]
    },
    taxFunding: {
      title: "納税資金",
      note: cashShortage > 0 ? "現預金だけでは不足する目安です。" : "生活費・予備資金を除いた後でも、概算相続税を賄える目安です。",
      lines: [
        `現預金目安：入力された現預金 = ${yen(input.cash)}`,
        `使える現預金目安：現預金 ${yen(input.cash)} - 生活費・予備資金 ${yen(input.cashReserveTarget)} = ${yen(cashAvailable)}`,
        `相続税総額概算：${yen(e.inheritanceTaxTotal)}`,
        cashShortage > 0
          ? `不足額：${yen(e.inheritanceTaxTotal)} - ${yen(cashAvailable)} = ${yen(cashShortage)}`
          : `余裕額：${yen(cashAvailable)} - ${yen(e.inheritanceTaxTotal)} = ${yen(cashSurplus)}`
      ]
    },
    cash: {
      title: "現預金",
      lines: [`入力値：${yen(input.cash)}`]
    }
  };
}

function actionCashShortageDetails(effect = calcActionEffect()) {
  const beforeAvailable = num(state.cash) - num(state.cashReserveTarget);
  const afterAvailable = num(effect.afterInput.cash) - num(effect.afterInput.cashReserveTarget);
  return {
    beforeAvailable,
    afterAvailable,
    beforeShortage: Math.max(0, effect.before.inheritanceTaxTotal - beforeAvailable),
    afterShortage: Math.max(0, effect.after.inheritanceTaxTotal - afterAvailable)
  };
}

function estateCompositionLines(input, estate, prefix) {
  return [
    `${prefix}の財産：現預金 ${yen(input.cash)} + 上場株式・投信等 ${yen(input.securities)} + 自宅土地建物 ${yen(input.homeProperty)}`,
    `貸付不動産 ${yen(input.rentalProperty)} + 非上場株式・事業用資産 ${yen(input.businessAssets)} + その他財産 ${yen(input.otherAssets)}`,
    `課税対象保険金 ${yen(estate.taxableInsurance)} + 生前贈与加算 ${yen(estate.priorGiftAddBack)} = 課税対象財産 ${yen(estate.grossAssets)}`,
    `債務 ${yen(input.debts)} + 葬式費用 ${yen(input.funeralCosts)} = 控除 ${yen(estate.deductions)}`
  ];
}

function actionEffectBreakdown(key) {
  const match = /^actionEffect:(before|after):([a-zA-Z]+)$/.exec(key || "");
  if (!match) return null;
  const [, side, metric] = match;
  const effect = calcActionEffect();
  const cash = actionCashShortageDetails(effect);
  const beforeInput = normalizeState({ ...state });
  const afterInput = effect.afterInput;
  const isAfter = side === "after";
  const current = isAfter ? effect.after : effect.before;
  const currentInput = isAfter ? afterInput : beforeInput;
  const sideLabel = isAfter ? "対策後" : "現状";
  const titles = {
    netEstate: "正味財産",
    taxableEstate: "課税遺産総額",
    inheritanceTaxTotal: "相続税総額概算",
    cashShortage: "納税資金不足目安",
    insuranceExemption: "死亡保険金非課税利用額",
    giftTaxCost: "贈与税等概算コスト"
  };
  const title = titles[metric];
  if (!title) return null;

  if (metric === "netEstate") {
    return {
      title: `${sideLabel}の${title}`,
      note: isAfter ? "選択済みの打ち手を反映した後の正味財産です。" : "入力中の現状値による正味財産です。",
      lines: [
        ...estateCompositionLines(currentInput, current, sideLabel),
        `正味財産：課税対象財産 ${yen(current.grossAssets)} - 控除 ${yen(current.deductions)} = ${yen(current.netEstate)}`
      ]
    };
  }

  if (metric === "taxableEstate") {
    return {
      title: `${sideLabel}の${title}`,
      lines: [
        `正味財産 ${yen(current.netEstate)} - 基礎控除 ${yen(current.heirs.basicDeduction)} = ${yen(current.taxableEstate)}`,
        `法定相続人：${current.heirs.heirsForTax}人（養子の税法算入 ${current.heirs.adoptedForTax}人）`
      ]
    };
  }

  if (metric === "inheritanceTaxTotal") {
    return {
      title: `${sideLabel}の${title}`,
      note: "配偶者の税額軽減などの税額控除前の概算です。",
      lines: inheritanceTaxBreakdownLines(current)
    };
  }

  if (metric === "cashShortage") {
    const available = isAfter ? cash.afterAvailable : cash.beforeAvailable;
    const shortage = isAfter ? cash.afterShortage : cash.beforeShortage;
    const cashDelta = num(currentInput.cash) - num(state.cash);
    const cashBasisLine = isAfter
      ? `現預金目安：現状現預金 ${yen(state.cash)} + 打ち手による現預金増減 ${yen(cashDelta)} = ${yen(currentInput.cash)}`
      : `現預金目安：入力された現預金 = ${yen(currentInput.cash)}`;
    return {
      title: `${sideLabel}の${title}`,
      note: "現預金から生活費・予備資金として残したい現金を控除した後、相続税概算に不足する額です。",
      lines: [
        cashBasisLine,
        `使える現預金目安：現預金 ${yen(currentInput.cash)} - 生活費・予備資金 ${yen(currentInput.cashReserveTarget)} = ${yen(available)}`,
        `納税資金不足目安：相続税総額概算 ${yen(current.inheritanceTaxTotal)} - 使える現預金目安 ${yen(available)} = ${yen(shortage)}`
      ]
    };
  }

  if (metric === "insuranceExemption") {
    return {
      title: `${sideLabel}の${title}`,
      lines: [
        `法定上限：500万円 × 法定相続人 ${current.heirs.heirsForTax}人 = ${yen(5000000 * current.heirs.heirsForTax)}`,
        `相続人が受け取る死亡保険金：${yen(currentInput.lifeInsuranceHeirs)}`,
        `非課税利用額：min(${yen(currentInput.lifeInsuranceHeirs)}, ${yen(5000000 * current.heirs.heirsForTax)}) = ${yen(current.insuranceExemption)}`
      ]
    };
  }

  if (metric === "giftTaxCost") {
    const cost = isAfter ? effect.giftTaxCost : 0;
    return {
      title: `${sideLabel}の贈与税等概算コスト`,
      note: "打ち手比較で概算反映している贈与税等の合計です。実行時は贈与者・受贈者・年分ごとに確認してください。",
      lines: [
        `概算コスト：${yen(cost)}`,
        isAfter && effect.notes.length ? `反映メモ：${effect.notes.join(" ")}` : "現状または打ち手未選択では、概算コストは0円です。"
      ]
    };
  }

  return null;
}

function actionDiffBreakdown(key) {
  const match = /^actionDiff:([a-zA-Z]+)$/.exec(key || "");
  if (!match) return null;
  const metric = match[1];
  const effect = calcActionEffect();
  const cash = actionCashShortageDetails(effect);
  const metrics = {
    netEstate: {
      title: "正味財産の差額",
      before: effect.before.netEstate,
      after: effect.after.netEstate,
      label: "現状の正味財産 - 対策後の正味財産"
    },
    taxableEstate: {
      title: "課税遺産総額の差額",
      before: effect.before.taxableEstate,
      after: effect.after.taxableEstate,
      label: "現状の課税遺産総額 - 対策後の課税遺産総額"
    },
    inheritanceTaxTotal: {
      title: "相続税総額概算の差額",
      before: effect.before.inheritanceTaxTotal,
      after: effect.after.inheritanceTaxTotal,
      label: "現状の相続税総額概算 - 対策後の相続税総額概算"
    },
    cashShortage: {
      title: "納税資金不足目安の差額",
      before: cash.beforeShortage,
      after: cash.afterShortage,
      label: "現状の不足額 - 対策後の不足額"
    },
    insuranceExemption: {
      title: "死亡保険金非課税利用額の差額",
      before: effect.before.insuranceExemption,
      after: effect.after.insuranceExemption,
      label: "対策後の非課税利用額 - 現状の非課税利用額",
      reverse: true
    },
    giftTaxCost: {
      title: "贈与税等概算コストの差額",
      before: 0,
      after: effect.giftTaxCost,
      label: "0円 - 贈与税等概算コスト"
    }
  };
  const item = metrics[metric];
  if (!item) return null;
  const diff = item.reverse ? item.after - item.before : item.before - item.after;
  return {
    title: item.title,
    lines: [
      `現状：${yen(item.before)}`,
      `対策後：${yen(item.after)}`,
      `${item.label} = ${yen(diff)}`
    ]
  };
}

function spouseScenarioBreakdown(key) {
  const match = /^spouseScenario:(.+)$/.exec(key || "");
  if (!match) return null;
  const spouseShare = Number(match[1]);
  if (!Number.isFinite(spouseShare)) return null;
  const e = calcEstate(state);
  const scenario = calcSpouseScenario(spouseShare);
  if (!scenario) {
    return {
      title: "一次・二次相続の合計",
      note: "配偶者がいない前提のため、配偶者取得割合別の二次相続比較は対象外です。",
      lines: ["配偶者なし"]
    };
  }
  const spouseStatutoryShare = e.heirs.shares.find((s) => s.label === "配偶者")?.share || 0;
  const spouseReliefLimit = Math.max(160000000, e.netEstate * spouseStatutoryShare);
  return {
    title: `一次・二次相続の合計（配偶者 ${pct(spouseShare)}取得）`,
    note: "一次相続では配偶者の税額軽減を概算反映し、二次相続では配偶者固有財産と一次取得額から生活費消費見込を控除した財産で再計算します。",
    lines: [
      `一次相続の正味財産：${yen(e.netEstate)}`,
      `配偶者取得額：${yen(e.netEstate)} × ${pct(spouseShare)} = ${yen(scenario.spouseAcquisition)}`,
      `配偶者の税額軽減上限：max(1億6,000万円, 正味財産 ${yen(e.netEstate)} × 法定相続分 ${pct(spouseStatutoryShare)}) = ${yen(spouseReliefLimit)}`,
      `一次相続税概算：${yen(scenario.firstTax)}`,
      `二次相続財産：配偶者固有財産 ${yen(state.spouseOwnAssets)} + 配偶者取得額 ${yen(scenario.spouseAcquisition)} - 生活費消費見込 ${yen(state.spouseFutureConsumption)} = ${yen(scenario.secondEstate)}`,
      `二次相続税概算：${yen(scenario.secondTax)}`,
      `一次・二次合計：${yen(scenario.firstTax)} + ${yen(scenario.secondTax)} = ${yen(scenario.totalTax)}`
    ]
  };
}

function divisionPlanBreakdown(key) {
  const match = /^divisionPlan:([a-zA-Z]+)$/.exec(key || "");
  if (!match) return null;
  const metric = match[1];
  const plan = calcDivisionPlan(state);
  const labels = {
    spouseAcquisition: "配偶者取得額",
    othersAcquisition: "その他相続人取得額",
    spouseRelief: "配偶者の税額軽減",
    payableTax: "分割案の一次相続税",
    spouseTaxAfter: "配偶者の納付税額",
    othersTax: "その他相続人の納付税額",
    cashShortage: "分割案上の納税資金不足"
  };
  if (!labels[metric]) return null;
  const assetLines = plan.rows.map((row) => `${row.label}：${yen(row.amount)} × 配偶者取得割合 ${pct(row.spousePct)} = ${yen(row.spouseAmount)}`);
  const ratioLine = plan.visibleAssets > 0
    ? `配偶者取得割合：${yen(plan.spouseVisibleAssets)} ÷ ${yen(plan.visibleAssets)} = ${pct(plan.spouseShare)}`
    : "配偶者取得割合：資産別入力額が0円のため0%";
  const commonLines = [
    `資産別入力額の合計：${yen(plan.visibleAssets)}`,
    ...assetLines,
    `配偶者の資産別取得額合計：${yen(plan.spouseVisibleAssets)}`,
    ratioLine,
    `正味財産ベースの配偶者取得額：${yen(plan.estate.netEstate)} × ${pct(plan.spouseShare)} = ${yen(plan.spouseAcquisition)}`
  ];
  if (metric === "spouseAcquisition") {
    return {
      title: labels[metric],
      note: "資産別取得割合から配偶者取得割合を求め、正味財産に乗じて概算しています。",
      lines: commonLines
    };
  }
  if (metric === "othersAcquisition") {
    return {
      title: labels[metric],
      lines: [
        ...commonLines,
        `その他相続人取得額：正味財産 ${yen(plan.estate.netEstate)} - 配偶者取得額 ${yen(plan.spouseAcquisition)} = ${yen(plan.othersAcquisition)}`
      ]
    };
  }
  if (metric === "spouseRelief") {
    return {
      title: labels[metric],
      note: "配偶者がいない場合、または配偶者取得額がない場合は税額軽減を0円として表示します。",
      lines: [
        ...commonLines,
        `相続税総額概算：${yen(plan.taxBeforeCredit)}`,
        `配偶者の税額軽減前税額：${yen(plan.taxBeforeCredit)} × ${pct(plan.spouseShare)} = ${yen(plan.spouseTaxBefore)}`,
        `軽減上限：max(1億6,000万円, 正味財産 ${yen(plan.estate.netEstate)} × 法定相続分 ${pct(plan.spouseStatutoryShare)}) = ${yen(plan.spouseReliefLimit)}`,
        `配偶者の税額軽減：${yen(plan.spouseRelief)}`
      ]
    };
  }
  if (metric === "spouseTaxAfter") {
    return {
      title: labels[metric],
      lines: [
        `配偶者の税額軽減前税額：${yen(plan.spouseTaxBefore)}`,
        `配偶者の税額軽減：${yen(plan.spouseRelief)}`,
        `配偶者の納付税額：${yen(plan.spouseTaxBefore)} - ${yen(plan.spouseRelief)} = ${yen(plan.spouseTaxAfter)}`
      ]
    };
  }
  if (metric === "othersTax") {
    return {
      title: labels[metric],
      lines: [
        `相続税総額概算：${yen(plan.taxBeforeCredit)}`,
        `配偶者の税額軽減前税額：${yen(plan.spouseTaxBefore)}`,
        `その他相続人の納付税額：${yen(plan.taxBeforeCredit)} - ${yen(plan.spouseTaxBefore)} = ${yen(plan.othersTax)}`
      ]
    };
  }
  if (metric === "payableTax") {
    return {
      title: labels[metric],
      lines: [
        `相続税総額概算：${yen(plan.taxBeforeCredit)}`,
        `配偶者の税額軽減：${yen(plan.spouseRelief)}`,
        `分割案の一次相続税：${yen(plan.taxBeforeCredit)} - ${yen(plan.spouseRelief)} = ${yen(plan.payableTax)}`
      ]
    };
  }
  return {
    title: labels[metric],
    note: "各グループに分けた現預金を納付税額に充てられる前提で、分割案上の不足額を確認します。",
    lines: [
      `配偶者側不足：配偶者納付税額 ${yen(plan.spouseTaxAfter)} - 配偶者取得現預金 ${yen(plan.spouseCash)} = ${yen(plan.spouseCashShortage)}`,
      `その他相続人側不足：その他相続人納付税額 ${yen(plan.othersTax)} - その他相続人取得現預金 ${yen(plan.othersCash)} = ${yen(plan.othersCashShortage)}`,
      `分割案上の納税資金不足：${yen(plan.spouseCashShortage)} + ${yen(plan.othersCashShortage)} = ${yen(plan.cashShortage)}`
    ]
  };
}

function calcActionEffect() {
  const beforeInput = normalizeState({ ...state });
  const before = calcEstate(beforeInput);
  const afterInput = normalizeState({ ...state });
  const notes = [];
  let giftTaxCost = 0;
  let transferAmount = 0;

  if (state.actionAnnualGiftEnabled) {
    const annualInput = {
      ...afterInput,
      annualGiftPerPerson: state.actionAnnualGiftPerPerson,
      annualGiftRecipients: state.actionAnnualGiftRecipients,
      annualGiftYears: state.actionAnnualGiftYears
    };
    const perYearTaxable = Math.max(0, num(state.actionAnnualGiftPerPerson) - 1100000);
    const taxPerPerson = applyRate(perYearTaxable, TaxRules.giftTaxRates[state.giftRateType] || TaxRules.giftTaxRates.special);
    const amount = num(state.actionAnnualGiftPerPerson) * num(state.actionAnnualGiftRecipients) * num(state.actionAnnualGiftYears);
    const tax = taxPerPerson * num(state.actionAnnualGiftRecipients) * num(state.actionAnnualGiftYears);
    afterInput.cash = Math.max(0, num(afterInput.cash) - amount);
    transferAmount += amount;
    giftTaxCost += tax;
    notes.push(`暦年贈与：${yen(amount)}を財産から控除。相続開始時期により生前贈与加算の対象となる可能性があります。`);
  }

  if (state.actionHousingGiftEnabled) {
    const limit = state.housingType === "eco" ? 10000000 : state.housingType === "other" ? 5000000 : 0;
    const amount = num(state.actionHousingGiftAmount);
    if (!limit) {
      notes.push("住宅取得等資金贈与：住宅区分が未確認のため、相続税圧縮効果には反映していません。要件確認後に再計算してください。");
    } else {
      const taxable = Math.max(0, amount - limit);
      const tax = applyRate(taxable, TaxRules.giftTaxRates[state.giftRateType] || TaxRules.giftTaxRates.special);
      afterInput.cash = Math.max(0, num(afterInput.cash) - amount);
      transferAmount += amount;
      giftTaxCost += tax;
      notes.push(`住宅取得等資金贈与：${yen(amount)}を財産から控除。非課税枠 ${yen(limit)}、超過部分の贈与税概算 ${yen(tax)}。住宅要件・期限・所得要件は要確認です。`);
    }
  }

  if (state.actionLifeInsuranceEnabled) {
    const amount = num(state.actionLifeInsuranceAmount);
    afterInput.cash = Math.max(0, num(afterInput.cash) - amount);
    afterInput.lifeInsurance = num(afterInput.lifeInsurance) + amount;
    afterInput.lifeInsuranceHeirs = num(afterInput.lifeInsuranceHeirs) + amount;
    notes.push(`生命保険活用：現預金${yen(amount)}を保険に振替。相続人受取分の非課税枠内で相続税課税価格を圧縮します。`);
  }

  if (state.actionSpouseHomeGiftEnabled) {
    const max = 21100000;
    const amount = Math.min(num(state.actionSpouseHomeGiftAmount), max);
    const fromHome = Math.min(num(afterInput.homeProperty), amount);
    afterInput.homeProperty = Math.max(0, num(afterInput.homeProperty) - fromHome);
    afterInput.cash = Math.max(0, num(afterInput.cash) - Math.max(0, amount - fromHome));
    afterInput.spouseOwnAssets = num(afterInput.spouseOwnAssets) + amount;
    transferAmount += amount;
    notes.push(`夫婦間居住用不動産贈与：${yen(amount)}を一次相続財産から控除し、配偶者固有財産へ移動。二次相続リスクも同時確認が必要です。`);
  }

  if (state.actionSettlementEnabled) {
    const amount = num(state.actionSettlementAmount);
    const base = Math.max(0, amount - 1100000);
    const remaining = Math.max(0, 25000000 - num(state.settlementDeductionUsed));
    const taxable = Math.max(0, base - remaining);
    const tax = taxable * 0.2;
    giftTaxCost += tax;
    notes.push(`相続時精算課税：移転額${yen(amount)}。相続税上は原則として相続財産に足し戻すため、ここでは相続税圧縮効果には入れず、将来値上がり分の固定化論点として表示します。`);
  }

  if (state.actionRentalPropertyEnabled) {
    const purchase = num(state.actionRentalPurchaseAmount);
    const loan = Math.min(num(state.actionRentalLoanAmount), purchase);
    const ownFunds = Math.max(0, purchase - loan);
    const reduction = Math.min(num(state.actionRentalValuationReductionAmount), purchase);
    const evaluatedValue = Math.max(0, purchase - reduction);
    afterInput.cash = Math.max(0, num(afterInput.cash) - ownFunds);
    afterInput.rentalProperty = num(afterInput.rentalProperty) + evaluatedValue;
    afterInput.debts = num(afterInput.debts) + loan;
    notes.push(`収益用不動産の取得：取得額${yen(purchase)}、借入${yen(loan)}、評価圧縮見込${yen(reduction)}を仮置き。概算上は貸付不動産評価と借入金を反映しますが、空室・修繕・金利上昇・換金性低下・分割困難リスクを個別確認してください。年間手残り見込は${yen(state.actionRentalAnnualNetIncome)}です。`);
  }

  if (state.actionStockReductionEnabled) {
    const amount = Math.min(num(state.actionStockReductionAmount), num(afterInput.businessAssets));
    afterInput.businessAssets = Math.max(0, num(afterInput.businessAssets) - amount);
    transferAmount += amount;
    notes.push(`会社株価対策：非上場株式・事業用資産の評価を${yen(amount)}圧縮する仮置きです。退職金、配当、類似業種比準要素、純資産、含み益、役員借入金、事業承継税制の可否を個別確認してください。`);
  }

  if (state.actionCustomReductionEnabled) {
    const amount = num(state.actionCustomReductionAmount);
    const fields = ["otherAssets", "securities", "rentalProperty", "businessAssets", "homeProperty", "cash"];
    let remaining = amount;
    for (const field of fields) {
      const used = Math.min(num(afterInput[field]), remaining);
      afterInput[field] = Math.max(0, num(afterInput[field]) - used);
      remaining -= used;
      if (remaining <= 0) break;
    }
    transferAmount += amount - Math.max(0, remaining);
    notes.push(`その他の評価圧縮・資産移転：${yen(amount - Math.max(0, remaining))}を概算控除。具体策の根拠・評価方法は必ず個別確認してください。`);
  }

  const after = calcEstate(afterInput);
  return {
    before,
    after,
    afterInput,
    giftTaxCost: Math.floor(giftTaxCost),
    transferAmount: Math.floor(transferAmount),
    taxReduction: Math.floor(before.inheritanceTaxTotal - after.inheritanceTaxTotal),
    taxableEstateReduction: Math.floor(before.taxableEstate - after.taxableEstate),
    netEstateReduction: Math.floor(before.netEstate - after.netEstate),
    notes
  };
}

function riskClass(level) {
  return level === "高" ? "high" : level === "中" ? "mid" : "low";
}

function diagnoseRisks(input = state) {
  const e = calcEstate(input);
  const cashAfterReserve = num(input.cash) - num(input.cashReserveTarget);
  const taxRisk = e.taxableEstate > 0 ? (e.inheritanceTaxTotal > 10000000 ? "高" : "中") : "低";
  const cashRisk = e.inheritanceTaxTotal > cashAfterReserve ? "高" : e.inheritanceTaxTotal > cashAfterReserve * 0.5 ? "中" : "低";
  const splitRisk = e.illiquidRatio >= 0.7 ? "高" : e.illiquidRatio >= 0.45 ? "中" : "低";
  const secondRisk = input.hasSpouse === "yes" && num(input.spouseOwnAssets) + e.netEstate * 0.5 > e.heirs.basicDeduction ? "中" : "低";
  return { taxRisk, cashRisk, splitRisk, secondRisk };
}

function getUnreflectedItems(input = state) {
  const items = [
    "実行判断・申告計算では、土地評価、評価単位、路線価補正、貸家建付地等を個別確認",
    "遺産分割、遺留分、名義預金、過去贈与の証拠関係は本ツール外で確認",
    "死亡退職金の非課税枠は未入力のため、支給規程・支給見込がある場合は別途確認"
  ];
  if (num(input.homeProperty) || num(input.rentalProperty)) items.unshift("小規模宅地等の特例は未反映");
  if (num(input.businessAssets)) items.unshift("非上場株式・事業用資産評価、事業承継税制は未反映");
  if (num(input.siblingsCount) > 0) items.push("相続税額の2割加算の対象者判定は未反映");
  if (num(input.spouseAge) < 20 && num(input.spouseAge) > 0) items.push("未成年者控除などの税額控除は未反映");
  if (input.priorGiftMode === "auto") items.push("生前贈与加算の4〜7年部分は日付別ではなく年数比の目安");
  return [...new Set(items)];
}

function getTaskSuggestions(input = state) {
  const e = calcEstate(input);
  const r = diagnoseRisks(input);
  const tasks = [];
  if (input.coResident === "unknown" && (num(input.homeProperty) || num(input.rentalProperty))) tasks.push("同居親族・家なき子・事業/貸付継続など、小規模宅地等の特例要件を確認");
  if (input.homePlanChild === "unknown" && (input.actionHousingGiftEnabled || num(input.housingGift))) tasks.push("住宅取得予定者、住宅区分、契約日、入居日、所得要件、証明書類を確認");
  if (input.housingType === "unknown" && (input.actionHousingGiftEnabled || num(input.housingGift))) tasks.push("住宅取得等資金贈与は住宅区分が未確認のため、非課税枠を確定");
  if (num(input.lifeInsurance) || input.actionLifeInsuranceEnabled) tasks.push("保険証券で契約者・被保険者・受取人・保険料負担者を確認");
  if (input.priorGiftMode === "auto" || num(input.priorGiftsAddBack)) tasks.push("過去贈与を贈与日・贈与者・受贈者・金額・申告有無で一覧化");
  if (r.cashRisk !== "低") tasks.push("納税資金として使える現預金、換金可能資産、保険金入金時期を確認");
  if (r.splitRisk !== "低") tasks.push("不動産・事業資産の分割方針、代償金、共有回避の希望を確認");
  if (input.actionRentalPropertyEnabled) tasks.push("収益用不動産の取得は物件資料、賃貸条件、空室・修繕リスク、借入条件、承継後の管理者を確認");
  if (num(input.businessAssets) || input.actionStockReductionEnabled) tasks.push("会社株価対策は決算書、勘定科目内訳書、株主構成、役員退職金、含み益、役員借入金、配当方針を確認");
  if (r.secondRisk !== "低") tasks.push("配偶者固有財産、生活費消費見込、二次相続時の相続人を確認");
  if (e.taxableEstate > 0) tasks.push("固定資産税課税明細、路線価図、借入金残高、葬式費用見込を回収");
  return [...new Set(tasks)];
}

function getActionRecommendations(input = state) {
  const e = calcEstate(input);
  const r = diagnoseRisks(input);
  const recommendations = [];
  const add = (enabled, reason, priority) => {
    if (!recommendations.some((item) => item.enabled === enabled)) recommendations.push({ enabled, reason, priority });
  };
  const remainingInsuranceRoom = Math.max(0, 5000000 * e.heirs.heirsForTax - num(input.lifeInsuranceHeirs));
  const cashAfterReserve = num(input.cash) - num(input.cashReserveTarget);
  const hasFutureGrowthAssets = num(input.securities) + num(input.rentalProperty) + num(input.businessAssets) > 0;

  if (r.cashRisk !== "低" || remainingInsuranceRoom > 0) {
    add("actionLifeInsuranceEnabled", `納税資金リスクが${r.cashRisk}、死亡保険金非課税枠の残り目安が ${yen(remainingInsuranceRoom)} あります。`, r.cashRisk === "高" ? 95 : 78);
  }
  if (num(input.businessAssets) > 0) {
    add("actionStockReductionEnabled", "非上場株式・事業用資産があるため、株価評価、退職金、配当、純資産、含み益、役員借入金を分けて確認します。", 94);
  }
  if (r.splitRisk !== "低") {
    add("actionCustomReductionEnabled", `不動産・事業資産など換金しにくい資産の比率が高く、分割困難リスクが${r.splitRisk}です。`, r.splitRisk === "高" ? 90 : 72);
  }
  if (e.taxableEstate > 0 && r.cashRisk === "低" && cashAfterReserve > Math.max(20000000, e.inheritanceTaxTotal * 1.5)) {
    const caution = r.splitRisk === "高" ? "ただし分割困難リスクが高いため、共有回避と承継後の管理者を先に確認します。" : "換金性低下、空室・修繕、借入返済、承継後の管理者を合わせて確認します。";
    add("actionRentalPropertyEnabled", `相続税リスクが${r.taxRisk}で、納税資金には余裕があります。現預金を収益用不動産へ組み替える余地があります。${caution}`, r.splitRisk === "高" ? 70 : 84);
  }
  if (e.taxableEstate > 0 && cashAfterReserve > Math.max(1100000, e.inheritanceTaxTotal * 0.5)) {
    add("actionAnnualGiftEnabled", "課税遺産総額があり、現預金から段階的に移転できる余地があります。加算対象期間に注意して検討します。", 82);
  }
  if (input.homePlanChild === "yes") {
    add("actionHousingGiftEnabled", "住宅取得予定の子・孫がいるため、住宅区分、期限、所得要件を確認したうえで候補になります。", 80);
  }
  if (input.hasSpouse === "yes" && num(input.homeProperty) > 0 && r.secondRisk !== "中") {
    add("actionSpouseHomeGiftEnabled", "配偶者の生活基盤を守る観点で検討できます。二次相続と配偶者固有財産の増加も同時に確認します。", 68);
  }
  if (hasFutureGrowthAssets && e.taxableEstate > 0) {
    add("actionSettlementEnabled", "値上がり資産・収益資産があるため、将来増加分の固定化という観点で確認します。", 64);
  }
  if (!recommendations.length) {
    add("actionAnnualGiftEnabled", "現時点では強いリスクが出ていないため、まずは少額の暦年贈与と資料確認から検討します。", 40);
  }

  return recommendations.sort((a, b) => b.priority - a.priority).slice(0, 3);
}

function makeCard(label, value, note = "", breakdownKey = "") {
  const tpl = document.getElementById("cardTemplate");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".label").textContent = label;
  node.querySelector(".value").innerHTML = calcValueHtml(value, breakdownKey);
  node.querySelector(".note").textContent = note;
  return node;
}

function renderCards(id, cards) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = "";
  cards.forEach((c) => el.appendChild(makeCard(c[0], c[1], c[2], c[3])));
}

function switchTab(tabId) {
  const tab = document.querySelector(`.tab[data-tab="${tabId}"]`);
  const panel = document.getElementById(tabId);
  if (!tab || !panel) return;
  document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
  document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
  tab.classList.add("active");
  panel.classList.add("active");
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderStepNavigation() {
  tabFlow.forEach(([id, label], index) => {
    const panel = document.getElementById(id);
    if (!panel) return;
    let nav = panel.querySelector(":scope > .step-nav");
    if (!nav) {
      nav = document.createElement("div");
      nav.className = "step-nav";
      panel.appendChild(nav);
    }
    const prev = tabFlow[index - 1];
    const next = tabFlow[index + 1];
    nav.innerHTML = `
      <div class="step-hint">現在：${esc(label)}${next ? ` / 次：${esc(next[1])}` : ""}</div>
      <div class="step-nav-actions">
        ${prev ? `<button type="button" class="ghost" data-step-target="${prev[0]}">戻る：${esc(prev[1])}</button>` : ""}
        ${next ? `<button type="button" class="primary" data-step-target="${next[0]}">次へ：${esc(next[1])}</button>` : ""}
      </div>
    `;
  });
}

function svgBar(width, color) {
  const safeWidth = Math.max(0, Math.min(100, num(width)));
  return `
    <svg class="bar-svg" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true" focusable="false">
      <rect x="0" y="0" width="100" height="10" rx="5" fill="#edf3f6"></rect>
      <rect x="0" y="0" width="${safeWidth.toFixed(2)}" height="10" rx="5" fill="${color}"></rect>
    </svg>
  `;
}

function chartBlock(title, subtitle, rows, options = {}) {
  const valueFormatter = options.valueFormatter || yen;
  const visibleRows = rows.filter((row) => num(row.value) > 0 || row.keepZero);
  const max = options.max ?? Math.max(0, ...visibleRows.map((row) => num(row.value)));
  const body = visibleRows.length && max > 0
    ? visibleRows.map((row, i) => {
        const value = Math.max(0, num(row.value));
        const width = Math.max(value > 0 ? 3 : 0, Math.min(100, (value / max) * 100));
        const color = CHART_COLORS[i % 5];
        return `
          <div class="chart-row">
            <div class="chart-row-head">
              <span>${esc(row.label)}</span>
              <b>${calcValueHtml(row.display ?? valueFormatter(value), row.breakdown)}</b>
            </div>
            <div class="chart-track">${svgBar(width, color)}</div>
            ${row.note ? `<small>${esc(row.note)}</small>` : ""}
          </div>
        `;
      }).join("")
    : `<p class="muted-text">表示できる金額がまだありません。</p>`;
  return `
    <div class="chart-head">
      <h3>${esc(title)}</h3>
      ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
    </div>
    <div class="chart-body">${body}</div>
  `;
}

function comparisonChartBlock(title, subtitle, rows) {
  const max = Math.max(0, ...rows.flatMap((row) => [num(row.before), num(row.after)]));
  const body = max > 0
    ? rows.map((row) => {
        const before = Math.max(0, num(row.before));
        const after = Math.max(0, num(row.after));
        return `
          <div class="compare-row">
            <div class="chart-row-head"><span>${esc(row.label)}</span><b>${esc(row.note || "")}</b></div>
            <div class="compare-bars">
              <span class="compare-label">現状</span>
              <div class="chart-track">${svgBar(Math.max(before > 0 ? 3 : 0, (before / max) * 100), "#8ca3ad")}</div>
              <b>${calcValueHtml(yen(before), row.beforeBreakdown)}</b>
              <span class="compare-label">対策後</span>
              <div class="chart-track">${svgBar(Math.max(after > 0 ? 3 : 0, (after / max) * 100), "#578899")}</div>
              <b>${calcValueHtml(yen(after), row.afterBreakdown)}</b>
            </div>
          </div>
        `;
      }).join("")
    : `<p class="muted-text">比較できる金額がまだありません。</p>`;
  return `
    <div class="chart-head">
      <h3>${esc(title)}</h3>
      ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
    </div>
    <div class="chart-body">${body}</div>
  `;
}

function pieChartBlock(title, subtitle, rows, options = {}) {
  const valueFormatter = options.valueFormatter || yen;
  const colors = options.colors || CHART_COLORS;
  const visibleRows = rows.filter((row) => num(row.value) > 0);
  const total = visibleRows.reduce((sum, row) => sum + num(row.value), 0);
  if (!visibleRows.length || total <= 0) {
    return `
      <div class="chart-head">
        <h3>${esc(title)}</h3>
        ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
      </div>
      <p class="muted-text">表示できる構成データがまだありません。</p>
    `;
  }

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  const segments = visibleRows.map((row, i) => {
    const ratio = num(row.value) / total;
    const dash = ratio * circumference;
    const gap = Math.max(0, circumference - dash);
    const segment = `
      <circle cx="50" cy="50" r="${radius}" fill="none" stroke="${colors[i % colors.length]}" stroke-width="24"
        stroke-dasharray="${dash.toFixed(3)} ${gap.toFixed(3)}" stroke-dashoffset="${(-offset).toFixed(3)}"
        transform="rotate(-90 50 50)"></circle>
    `;
    offset += dash;
    return segment;
  }).join("");

  const legend = visibleRows.map((row, i) => {
    const value = num(row.value);
    const ratio = total ? value / total : 0;
    return `
      <div class="pie-legend-row">
        <svg class="pie-dot" viewBox="0 0 10 10" aria-hidden="true" focusable="false"><circle cx="5" cy="5" r="5" fill="${colors[i % colors.length]}"></circle></svg>
        <span>${esc(row.label)}</span>
        <b>${calcValueHtml(valueFormatter(value), row.breakdown)}</b>
        <em>${pct(ratio)}</em>
      </div>
    `;
  }).join("");

  return `
    <div class="chart-head">
      <h3>${esc(title)}</h3>
      ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
    </div>
    <div class="pie-layout">
      <div class="donut">
        <svg class="donut-svg" viewBox="0 0 100 100" aria-hidden="true" focusable="false">
          <circle cx="50" cy="50" r="${radius}" fill="none" stroke="#edf3f6" stroke-width="24"></circle>
          ${segments}
          <circle cx="50" cy="50" r="26" fill="#ffffff" stroke="#dbe4ea" stroke-width="1"></circle>
        </svg>
        <div><strong>${esc(valueFormatter(total))}</strong><span>${esc(options.centerLabel || "合計")}</span></div>
      </div>
      <div class="pie-legend">${legend}</div>
    </div>
    ${options.note ? `<p class="chart-note">${esc(options.note)}</p>` : ""}
  `;
}

function renderChart(id, title, subtitle, rows, options = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = chartBlock(title, subtitle, rows, options);
}

function renderPieChart(id, title, subtitle, rows, options = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = pieChartBlock(title, subtitle, rows, options);
}

function renderComparisonChart(id, title, subtitle, rows) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = comparisonChartBlock(title, subtitle, rows);
}

function renderInputValues() {
  document.querySelectorAll("[data-field]").forEach((el) => {
    if (document.activeElement === el) return;
    const key = el.dataset.field;
    if (el.type === "checkbox") el.checked = Boolean(state[key]);
    else el.value = el.hasAttribute("data-money") ? comma(state[key]) : (state[key] ?? "");
  });
  document.querySelectorAll("[data-action-field]").forEach((el) => {
    if (document.activeElement === el) return;
    const key = el.dataset.actionField;
    if (el.type === "checkbox") el.checked = Boolean(state[key]);
    else el.value = el.hasAttribute("data-money") ? comma(state[key]) : (state[key] ?? "");
  });
}

function render() {
  renderInputValues();
  const e = calcEstate(state);
  const g = calcGift(state);
  const risks = diagnoseRisks(state);
  const giftAddBackLabel = state.priorGiftMode === "manual" ? "手入力" : `${g.giftAddBack.addBackYears}年目安`;

  renderCards("familyResults", [
    ["法定相続人の数（税額計算用）", `${e.heirs.heirsForTax}人`, `養子算入：${e.heirs.adoptedForTax}人 / 相続順位：${e.heirs.rank}`, "heirsForTax"],
    ["基礎控除額", yen(e.heirs.basicDeduction), "3,000万円 + 600万円 × 法定相続人", "basicDeduction"],
    ["法定相続分の概略", e.heirs.shares.map((s) => `${s.label} ${pct(s.share)}`).join(" / "), "詳細な相続関係は別途確認"]
  ]);

  renderCards("assetResults", [
    ["課税対象財産 概算", yen(e.grossAssets), "死亡保険金の非課税控除後・過去贈与加算含む", "grossAssets"],
    ["債務・葬式費用", yen(e.deductions), "第1版では単純控除", "deductions"],
    ["正味財産 概算", yen(e.netEstate), "小規模宅地等の特例は未反映", "netEstate"],
    ["不動産・事業資産比率", pct(e.illiquidRatio), "分割困難・納税資金リスクの目安", "illiquidRatio"],
    ["死亡保険金非課税枠", yen(e.insuranceExemption), "500万円 × 法定相続人の数", "insuranceExemption"],
    ["課税対象保険金", yen(e.taxableInsurance), "受取人・契約者・被保険者の確認が必要", "taxableInsurance"]
  ]);

  renderCards("giftResults", [
    ["暦年贈与税 / 人・年", yen(g.annualGiftTaxPerPerson), `課税価格 ${yen(g.annualTaxable)}`, "annualGiftTaxPerPerson"],
    ["暦年贈与 移転総額", yen(g.totalAnnualGift), `${state.annualGiftRecipients || 0}人 × ${state.annualGiftYears || 0}年`, "totalAnnualGift"],
    ["暦年贈与税 合計概算", yen(g.totalAnnualGiftTax), "生前贈与加算対象期間に注意", "totalAnnualGiftTax"],
    ["相続財産へ加算する贈与額", yen(e.priorGiftAddBack), giftAddBackLabel, "priorGiftAddBack"],
    ["相続時精算課税 贈与税概算", yen(g.settlementTax), `残特別控除 ${yen(g.remainingSpecial)}`, "settlementTax"],
    ["住宅資金贈与 非課税枠", yen(g.housingLimit), "要件・期限・証明書類の確認が必要", "housingLimit"],
    ["住宅資金贈与 課税候補", yen(g.housingTaxable), "暦年または精算課税との関係を確認", "housingTaxable"]
  ]);

  renderCards("diagnosisResults", [
    ["正味財産", yen(e.netEstate), "概算", "netEstate"],
    ["課税遺産総額", yen(e.taxableEstate), "正味財産 − 基礎控除", "taxableEstate"],
    ["相続税総額 概算", yen(e.inheritanceTaxTotal), "税額控除前の概算", "inheritanceTaxTotal"],
    ["現預金総額", yen(num(state.cash)), "生活費・予備資金を含む", "cash"],
    ["納税資金不足目安", yen(Math.max(0, e.inheritanceTaxTotal - (num(state.cash) - num(state.cashReserveTarget)))), "現預金から生活費・予備資金を控除", "cashShortage"],
    ["生前贈与加算額", yen(e.priorGiftAddBack), "相続税の課税価格に加算する概算", "priorGiftAddBack"]
  ]);

  renderAssetChart(e);
  renderGiftChart(g, e);
  renderDiagnosisCharts(e, risks);
  renderGiftTaxLinks(g);
  renderGiftAddBackNotice(g);
  renderRiskBand(risks);
  renderUnreflectedItems();
  renderSpouseScenarios();
  renderDivisionPlan();
  renderActionComparison();
  renderActionRecommendations();
  if (!document.activeElement || !document.activeElement.closest("#actionList") || document.activeElement.type === "checkbox") renderActionCards();
  renderTaskSuggestions();
  renderSources();
  renderReport();
  renderTpsMapping();
  renderSummary();
  renderStepNavigation();
}

function renderAssetChart(e) {
  renderPieChart("assetChart", "資産構成の見える化", "財産全体に占める構成比を確認します。換金性・分割困難性の会話に使います。", [
    { label: "現預金", value: state.cash, breakdown: "cash" },
    { label: "上場株式・投信等", value: state.securities },
    { label: "自宅土地建物", value: state.homeProperty },
    { label: "貸付不動産", value: state.rentalProperty },
    { label: "非上場株式・事業用資産", value: state.businessAssets },
    { label: "その他財産", value: state.otherAssets }
  ], {
    centerLabel: "総財産",
    note: `債務・葬式費用 ${yen(e.deductions)} は構成比から除き、正味財産の計算で控除しています。`
  });
}

function renderGiftChart(g, e) {
  renderChart("giftChart", "贈与・保険の論点比較", "移転額、贈与税コスト、相続財産への加算額、保険非課税枠を同じ尺度で確認します。", [
    { label: "暦年贈与 移転総額", value: g.totalAnnualGift, breakdown: "totalAnnualGift" },
    { label: "暦年贈与税 合計概算", value: g.totalAnnualGiftTax, breakdown: "totalAnnualGiftTax" },
    { label: "相続財産へ加算する贈与額", value: e.priorGiftAddBack, breakdown: "priorGiftAddBack" },
    { label: "相続時精算課税 贈与予定額", value: state.settlementGift },
    { label: "相続時精算課税 贈与税概算", value: g.settlementTax, breakdown: "settlementTax" },
    { label: "死亡保険金非課税枠", value: e.insuranceExemption, breakdown: "insuranceExemption" },
    { label: "住宅資金贈与 非課税枠", value: g.housingLimit, breakdown: "housingLimit" }
  ]);
}

function renderDiagnosisCharts(e, risks) {
  const riskScore = { "低": 1, "中": 2, "高": 3 };
  renderChart("riskChart", "リスク強度", "税額、納税資金、分割困難、二次相続の優先度を並べます。", [
    { label: "相続税", value: riskScore[risks.taxRisk], display: risks.taxRisk, keepZero: true },
    { label: "納税資金", value: riskScore[risks.cashRisk], display: risks.cashRisk, keepZero: true },
    { label: "分割困難", value: riskScore[risks.splitRisk], display: risks.splitRisk, keepZero: true },
    { label: "二次相続", value: riskScore[risks.secondRisk], display: risks.secondRisk, keepZero: true }
  ], { max: 3, valueFormatter: (v) => v });

  const spouseRows = state.hasSpouse === "yes"
    ? [0, 0.25, 0.5, 0.75, 1].map((r) => {
        const s = calcSpouseScenario(r);
        return { label: `配偶者 ${pct(r)}取得`, value: s.totalTax, note: `一次 ${yen(s.firstTax)} / 二次 ${yen(s.secondTax)}`, breakdown: `spouseScenario:${r}` };
      })
    : [{ label: "配偶者取得割合比較", value: 0, note: "配偶者なしのため対象外" }];
  renderChart("spouseScenarioChart", "一次・二次相続の合計", "配偶者取得割合ごとの合計税額を横並びで比較します。", spouseRows);
}

function renderGiftTaxLinks(g) {
  const el = document.getElementById("giftTaxLinks");
  if (!el) return;
  const e = calcEstate(state);
  el.innerHTML = `
    <div>
      <h3>贈与税ツールで詳細試算</h3>
      <p>ここでは面談用の概算に留め、贈与税そのものの単年試算・長期比較は専用ツールへ渡して確認します。</p>
    </div>
    <div class="tool-link-actions">
      ${giftTaxLink("annual", "暦年贈与を単年試算", { amount: state.annualGiftPerPerson })}
      ${giftTaxLink("settlement", "相続時精算課税を単年試算", { amount: state.settlementGift })}
      ${giftTaxLink("long", "暦年 vs 精算課税を長期比較", {
        annualGift: state.annualGiftPerPerson,
        settlementGift: state.settlementGift,
        recipients: state.annualGiftRecipients,
        years: state.annualGiftYears
      })}
    </div>
    <p class="tool-link-note">
      送出値：正味財産 ${yen(e.netEstate)}、法定相続人 ${e.heirs.heirsForTax}人、暦年贈与 ${yen(g.totalAnnualGift)}、精算課税予定 ${yen(state.settlementGift)}
    </p>
  `;
}

function renderGiftAddBackNotice(g) {
  const el = document.getElementById("giftAddBackNotice");
  if (!el) return;
  el.innerHTML = `
    <strong>生前贈与加算チェック</strong>
    <p>
      想定年 ${g.giftAddBack.year}年では、加算対象期間を ${g.giftAddBack.addBackYears}年として扱います。
      自動目安は ${yen(g.giftAddBack.autoAddBack)}、現在の計算反映額は ${yen(g.giftAddBack.effectiveAddBack)} です。
      ${g.giftAddBack.note}
    </p>
  `;
}

function renderList(el, items, emptyText = "現在の入力では自動抽出項目はありません。") {
  if (!el) return;
  el.innerHTML = items.length ? `<ul class="checklist">${items.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>` : `<p class="muted-text">${emptyText}</p>`;
}

function renderUnreflectedItems() {
  renderList(document.getElementById("unreflectedItems"), getUnreflectedItems(state));
}

function renderTaskSuggestions() {
  const tasks = getTaskSuggestions(state);
  renderList(document.getElementById("taskSuggestions"), tasks);
  renderList(document.getElementById("sideTasks"), tasks.slice(0, 4), "未確認事項はまだ抽出されていません。");
}

function renderRiskBand(risks) {
  const riskBand = document.getElementById("riskBand");
  if (!riskBand) return;
  riskBand.innerHTML = "";
  [["相続税リスク", risks.taxRisk], ["納税資金リスク", risks.cashRisk], ["分割困難リスク", risks.splitRisk], ["二次相続リスク", risks.secondRisk]].forEach(([label, level]) => {
    const div = document.createElement("div");
    div.className = `risk ${riskClass(level)}`;
    div.innerHTML = `<span>${label}</span><b>${level}</b>`;
    riskBand.appendChild(div);
  });
}

function renderSpouseScenarios() {
  const tbody = document.querySelector("#spouseScenarioTable tbody");
  if (!tbody) return;
  tbody.innerHTML = "";
  if (state.hasSpouse !== "yes") {
    tbody.innerHTML = `<tr><td colspan="6">配偶者なしのため、配偶者取得割合比較は対象外です。</td></tr>`;
    return;
  }
  [0, 0.25, 0.5, 0.75, 1].forEach((r) => {
    const s = calcSpouseScenario(r);
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${pct(r)}</td>
      <td>${yen(s.firstTax)}</td>
      <td>${yen(s.spouseAcquisition)}</td>
      <td>${yen(s.secondTax)}</td>
      <td><strong>${yen(s.totalTax)}</strong></td>
      <td>${s.comment}</td>`;
    tbody.appendChild(tr);
  });
}

function renderDivisionPlan() {
  const plan = calcDivisionPlan(state);
  renderCards("divisionResults", [
    ["配偶者取得額", yen(plan.spouseAcquisition), `取得割合 ${pct(plan.spouseShare)}`, "divisionPlan:spouseAcquisition"],
    ["配偶者の税額軽減", yen(plan.spouseRelief), `軽減上限 ${yen(plan.spouseReliefLimit)}`, "divisionPlan:spouseRelief"],
    ["分割案の一次相続税", yen(plan.payableTax), "配偶者税額軽減後", "divisionPlan:payableTax"],
    ["分割案上の納税資金不足", yen(plan.cashShortage), "取得現預金で見た不足額", "divisionPlan:cashShortage"]
  ]);

  renderPieChart("divisionShareChart", "分割案の取得割合", state.divisionPlanName || "分割案", [
    { label: "配偶者", value: plan.spouseAcquisition, breakdown: "divisionPlan:spouseAcquisition" },
    { label: "その他相続人", value: plan.othersAcquisition, breakdown: "divisionPlan:othersAcquisition" }
  ], { centerLabel: "正味財産" });

  renderChart("divisionTaxChart", "分割案の税額", "相続税総額を実際の取得割合で按分し、配偶者税額軽減を控除します。", [
    { label: "税額軽減前総額", value: plan.taxBeforeCredit, breakdown: "inheritanceTaxTotal" },
    { label: "配偶者の税額軽減", value: plan.spouseRelief, breakdown: "divisionPlan:spouseRelief" },
    { label: "納付税額合計", value: plan.payableTax, breakdown: "divisionPlan:payableTax" },
    { label: "納税資金不足", value: plan.cashShortage, breakdown: "divisionPlan:cashShortage" }
  ]);

  const assetTbody = document.querySelector("#divisionAssetTable tbody");
  if (assetTbody) {
    assetTbody.innerHTML = plan.rows.map((row) => `
      <tr>
        <td>${esc(row.label)}</td>
        <td>${yen(row.amount)}</td>
        <td>${pct(row.spousePct)}</td>
        <td>${yen(row.spouseAmount)}</td>
        <td>${yen(row.othersAmount)}</td>
      </tr>
    `).join("") + `
      <tr>
        <td><strong>合計</strong></td>
        <td><strong>${yen(plan.visibleAssets)}</strong></td>
        <td>${pct(plan.spouseShare)}</td>
        <td><strong>${yen(plan.spouseVisibleAssets)}</strong></td>
        <td><strong>${yen(Math.max(0, plan.visibleAssets - plan.spouseVisibleAssets))}</strong></td>
      </tr>
    `;
  }

  const taxTbody = document.querySelector("#divisionTaxTable tbody");
  if (taxTbody) {
    taxTbody.innerHTML = `
      <tr>
        <td>配偶者</td>
        <td>${calcValueHtml(yen(plan.spouseAcquisition), "divisionPlan:spouseAcquisition")}</td>
        <td>${yen(plan.spouseTaxBefore)}</td>
        <td>${calcValueHtml(yen(plan.spouseRelief), "divisionPlan:spouseRelief")}</td>
        <td>${calcValueHtml(yen(plan.spouseTaxAfter), "divisionPlan:spouseTaxAfter")}</td>
        <td>${yen(plan.spouseCash)}</td>
        <td>${yen(plan.spouseCashShortage)}</td>
      </tr>
      <tr>
        <td>その他相続人</td>
        <td>${calcValueHtml(yen(plan.othersAcquisition), "divisionPlan:othersAcquisition")}</td>
        <td>${calcValueHtml(yen(plan.othersTax), "divisionPlan:othersTax")}</td>
        <td>--</td>
        <td>${calcValueHtml(yen(plan.othersTax), "divisionPlan:othersTax")}</td>
        <td>${yen(plan.othersCash)}</td>
        <td>${yen(plan.othersCashShortage)}</td>
      </tr>
      <tr>
        <td><strong>合計</strong></td>
        <td><strong>${yen(plan.estate.netEstate)}</strong></td>
        <td>${yen(plan.taxBeforeCredit)}</td>
        <td>${yen(plan.spouseRelief)}</td>
        <td><strong>${calcValueHtml(yen(plan.payableTax), "divisionPlan:payableTax")}</strong></td>
        <td>${yen(num(state.cash))}</td>
        <td><strong>${calcValueHtml(yen(plan.cashShortage), "divisionPlan:cashShortage")}</strong></td>
      </tr>
    `;
  }
}

function diffText(diff) {
  if (diff > 0) return `▲ ${yen(diff)}`;
  if (diff < 0) return `▼ ${yen(Math.abs(diff))}`;
  return "変化なし";
}

function renderActionComparison() {
  const effect = calcActionEffect();
  const beforeCashShortage = Math.max(0, effect.before.inheritanceTaxTotal - (num(state.cash) - num(state.cashReserveTarget)));
  const afterCashShortage = Math.max(0, effect.after.inheritanceTaxTotal - (num(effect.afterInput.cash) - num(effect.afterInput.cashReserveTarget)));
  renderComparisonChart("actionEffectChart", "打ち手によるビフォー・アフター", "正味財産、課税遺産、相続税、納税資金不足の変化を棒で確認します。", [
    { label: "正味財産", before: effect.before.netEstate, after: effect.after.netEstate, beforeBreakdown: "actionEffect:before:netEstate", afterBreakdown: "actionEffect:after:netEstate" },
    { label: "課税遺産総額", before: effect.before.taxableEstate, after: effect.after.taxableEstate, beforeBreakdown: "actionEffect:before:taxableEstate", afterBreakdown: "actionEffect:after:taxableEstate" },
    { label: "相続税総額概算", before: effect.before.inheritanceTaxTotal, after: effect.after.inheritanceTaxTotal, beforeBreakdown: "actionEffect:before:inheritanceTaxTotal", afterBreakdown: "actionEffect:after:inheritanceTaxTotal" },
    { label: "納税資金不足目安", before: beforeCashShortage, after: afterCashShortage, beforeBreakdown: "actionEffect:before:cashShortage", afterBreakdown: "actionEffect:after:cashShortage" }
  ]);
  const beforeAfter = document.getElementById("beforeAfter");
  if (beforeAfter) {
    beforeAfter.innerHTML = `
      <article class="ba-card before"><span>現状の相続税概算</span><strong>${calcValueHtml(yen(effect.before.inheritanceTaxTotal), "actionEffect:before:inheritanceTaxTotal")}</strong><small>課税遺産総額 ${calcValueHtml(yen(effect.before.taxableEstate), "actionEffect:before:taxableEstate")}</small></article>
      <article class="ba-card after"><span>対策後の相続税概算</span><strong>${calcValueHtml(yen(effect.after.inheritanceTaxTotal), "actionEffect:after:inheritanceTaxTotal")}</strong><small>課税遺産総額 ${calcValueHtml(yen(effect.after.taxableEstate), "actionEffect:after:taxableEstate")}</small></article>
      <article class="ba-card impact"><span>相続税の概算効果</span><strong>${calcValueHtml(diffText(effect.taxReduction), "actionDiff:inheritanceTaxTotal")}</strong><small>贈与税等概算コスト ${calcValueHtml(yen(effect.giftTaxCost), "actionEffect:after:giftTaxCost")}</small></article>
    `;
  }

  const tbody = document.querySelector("#effectTable tbody");
  if (!tbody) return;
  const rows = [
    ["正味財産", effect.before.netEstate, effect.after.netEstate, effect.before.netEstate - effect.after.netEstate, "netEstate"],
    ["課税遺産総額", effect.before.taxableEstate, effect.after.taxableEstate, effect.taxableEstateReduction, "taxableEstate"],
    ["相続税総額概算", effect.before.inheritanceTaxTotal, effect.after.inheritanceTaxTotal, effect.taxReduction, "inheritanceTaxTotal"],
    ["納税資金不足目安（生活費等を除く）", beforeCashShortage, afterCashShortage, beforeCashShortage - afterCashShortage, "cashShortage"],
    ["死亡保険金非課税利用額", effect.before.insuranceExemption, effect.after.insuranceExemption, effect.after.insuranceExemption - effect.before.insuranceExemption, "insuranceExemption"],
    ["贈与税等概算コスト", 0, effect.giftTaxCost, -effect.giftTaxCost, "giftTaxCost"]
  ];
  tbody.innerHTML = rows.map(([label, before, after, diff, key]) => `
    <tr>
      <td>${label}</td>
      <td>${calcValueHtml(yen(before), `actionEffect:before:${key}`)}</td>
      <td>${calcValueHtml(yen(after), `actionEffect:after:${key}`)}</td>
      <td class="${diff > 0 ? "positive" : diff < 0 ? "negative" : ""}">${calcValueHtml(diffText(diff), `actionDiff:${key}`)}</td>
    </tr>
  `).join("") + `
    <tr><td colspan="4"><strong>メモ：</strong>${effect.notes.length ? effect.notes.join(" ") : "打ち手が未選択です。候補にチェックを入れると概算効果が表示されます。"}</td></tr>
  `;
}

function actionDefinitions() {
  const e = calcEstate(state);
  const remainingInsuranceRoom = Math.max(0, 5000000 * e.heirs.heirsForTax - num(state.lifeInsuranceHeirs));
  return [
    {
      enabled: "actionAnnualGiftEnabled",
      title: "暦年贈与で少しずつ移す",
      source: "annual_gift",
      giftTax: "annual",
      level: "中",
      body: "加算対象期間に注意しつつ、現預金などを子・孫へ段階的に移す案です。",
      fields: [
        ["actionAnnualGiftPerPerson", "年間贈与額 / 人", "例：1,100,000"],
        ["actionAnnualGiftRecipients", "贈与対象人数", "例：2", "number"],
        ["actionAnnualGiftYears", "年数", "例：5", "number"]
      ]
    },
    {
      enabled: "actionHousingGiftEnabled",
      title: "住宅取得等資金贈与を使う",
      source: "housing_gift",
      level: state.homePlanChild === "yes" ? "中" : "低",
      body: "住宅取得予定の子・孫がいる場合に検討します。住宅区分・期限・所得要件は必ず確認します。",
      fields: [["actionHousingGiftAmount", "贈与予定額", "例：10,000,000"]]
    },
    {
      enabled: "actionLifeInsuranceEnabled",
      title: "生命保険で納税資金を確保する",
      source: "life_insurance",
      level: remainingInsuranceRoom > 0 ? "中" : "低",
      body: `相続人受取の死亡保険金非課税枠の残り目安は ${yen(remainingInsuranceRoom)} です。納税資金確保にも使います。`,
      fields: [["actionLifeInsuranceAmount", "保険への振替額", "例：10,000,000"]]
    },
    {
      enabled: "actionSpouseHomeGiftEnabled",
      title: "夫婦間居住用不動産贈与を検討する",
      source: "spouse_home_gift",
      level: state.hasSpouse === "yes" ? "中" : "低",
      body: "配偶者の生活基盤を守る案です。ただし、配偶者固有財産が増えるため二次相続も同時に見ます。",
      fields: [["actionSpouseHomeGiftAmount", "移転額", "例：20,000,000"]]
    },
    {
      enabled: "actionSettlementEnabled",
      title: "相続時精算課税で将来値上がり分を固定する",
      source: "settlement_tax",
      giftTax: "settlement",
      level: "中",
      body: "相続税を直接減らすというより、値上がり資産・収益資産の将来増加分を固定化する発想です。",
      fields: [["actionSettlementAmount", "移転予定額", "例：25,000,000"]]
    },
    {
      enabled: "actionRentalPropertyEnabled",
      title: "収益用不動産の取得を検討する",
      source: "tool_disclaimer",
      level: num(state.cash) - num(state.cashReserveTarget) > num(e.inheritanceTaxTotal) * 1.5 ? "中" : "低",
      body: "現預金を収益用不動産に組み替え、相続税評価額の圧縮余地を確認する案です。換金性低下、空室・修繕、借入返済、分割困難リスクを必ず同時に確認します。",
      fields: [
        ["actionRentalPurchaseAmount", "取得予定額", "例：30,000,000"],
        ["actionRentalLoanAmount", "借入予定額", "例：20,000,000"],
        ["actionRentalValuationReductionAmount", "評価圧縮見込額", "例：10,000,000"],
        ["actionRentalAnnualNetIncome", "年間手残り見込", "例：600,000"]
      ]
    },
    {
      enabled: "actionStockReductionEnabled",
      title: "会社株価対策を検討する",
      source: "tool_disclaimer",
      level: num(state.businessAssets) > 0 ? "高" : "低",
      body: "非上場株式・事業用資産がある場合の論点です。退職金、配当、利益圧縮、純資産、含み益、役員借入金、株主構成、事業承継税制を分けて確認します。",
      fields: [["actionStockReductionAmount", "株価・事業資産の評価圧縮見込", "例：10,000,000"]]
    },
    {
      enabled: "actionCustomReductionEnabled",
      title: "その他の評価圧縮・資産移転効果を仮置きする",
      source: "tool_disclaimer",
      level: e.illiquidRatio >= 0.45 ? "高" : "低",
      body: "不動産評価、資産組替えなどの個別検討効果を仮置きする欄です。根拠確認なしで提案確定しないでください。",
      fields: [["actionCustomReductionAmount", "概算効果額", "例：10,000,000"]]
    }
  ];
}

function renderActionCards() {
  const wrap = document.getElementById("actionList");
  if (!wrap) return;
  wrap.innerHTML = "";
  actionDefinitions().forEach((def) => {
    const div = document.createElement("article");
    div.className = `action ${state[def.enabled] ? "selected" : ""}`;
    div.innerHTML = `
      <div class="action-head">
        <label class="check-label"><input type="checkbox" data-action-field="${def.enabled}" ${state[def.enabled] ? "checked" : ""}> <span>${def.title}</span></label>
        <span class="tag ${riskClass(def.level)}">${def.level}</span>
      </div>
      <p>${def.body}</p>
      <div class="action-fields">
        ${def.fields.map(([key, label, ph, type]) => `
          <label>${label}
            <input ${type === "number" ? `type="number" min="0" step="1"` : `data-money inputmode="numeric"`} data-action-field="${key}" placeholder="${ph}" value="${type === "number" ? (state[key] ?? "") : comma(state[key])}">
          </label>`).join("")}
      </div>
      <div class="action-links">
        <button type="button" class="source-btn" data-source="${def.source}">根拠を見る</button>
        ${def.giftTax ? giftTaxLink(def.giftTax, "贈与税ツールで試算", def.giftTax === "annual"
          ? { amount: state.actionAnnualGiftPerPerson }
          : { amount: state.actionSettlementAmount }) : ""}
      </div>
    `;
    wrap.appendChild(div);
  });
}

function renderActionRecommendations() {
  const wrap = document.getElementById("actionRecommendations");
  if (!wrap) return;
  const defs = actionDefinitions();
  const recommendations = getActionRecommendations(state)
    .map((item) => ({ ...item, def: defs.find((def) => def.enabled === item.enabled) }))
    .filter((item) => item.def);
  wrap.innerHTML = `
    <div class="recommendation-head">
      <div>
        <h3>おすすめの打ち手</h3>
        <p>現在の入力内容から、優先的に確認したい候補を自動抽出します。実行判断では個別要件を確認してください。</p>
      </div>
      <span>${recommendations.length}件</span>
    </div>
    <div class="recommendation-list">
      ${recommendations.map((item, index) => `
        <article class="recommendation-item ${state[item.enabled] ? "selected" : ""}">
          <div class="recommendation-title">
            <b>${index + 1}. ${esc(item.def.title)}</b>
            <span class="tag ${riskClass(item.def.level)}">${esc(item.def.level)}</span>
          </div>
          <p>${esc(item.reason)}</p>
          <button type="button" class="ghost" data-recommend-action="${esc(item.enabled)}">${state[item.enabled] ? "選択済み" : "この打ち手を選択"}</button>
        </article>
      `).join("")}
    </div>
  `;
}

function renderSources() {
  const usageCount = {};
  Object.values(TaxRules.sources).forEach((s) => {
    (s.usage || ["その他"]).forEach((usage) => {
      usageCount[usage] = (usageCount[usage] || 0) + 1;
    });
  });
  renderPieChart("sourceChart", "根拠マスタの用途分布", "どの画面・論点に根拠が紐づいているかを件数構成で確認します。", Object.entries(usageCount)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, display: `${value}件` })), { valueFormatter: (v) => `${v}件` });

  const wrap = document.getElementById("sourceList");
  if (!wrap) return;
  wrap.innerHTML = "";
  Object.entries(TaxRules.sources).forEach(([key, s]) => {
    const legalLinks = (s.legalRefs || [])
      .map((ref) => `<a href="${esc(ref.url)}" target="_blank" rel="noopener">${esc(ref.title)}</a>`)
      .join(" / ");
    const div = document.createElement("article");
    div.className = "source-item";
    div.innerHTML = `
      <h3>${s.title}</h3>
      <p>${s.summary}</p>
      <p>使用箇所：${(s.usage || []).join("、")}</p>
      ${legalLinks ? `<p>法令根拠：${legalLinks}</p>` : ""}
      ${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">根拠ページを開く</a>` : `<span>運用上の注意</span>`}
      <div><button type="button" class="source-btn" data-source="${key}">詳細</button></div>
    `;
    wrap.appendChild(div);
  });
}

function getReportWarnings(input = state) {
  const e = calcEstate(input);
  const warnings = [];
  if (!String(input.caseName || "").trim()) warnings.push("相談者名・案件名が未入力です。");
  if (!String(input.meetingDate || "").trim()) warnings.push("面談日が未入力です。");
  if (!String(input.staffName || "").trim()) warnings.push("担当者が未入力です。");
  if (e.heirs.heirsForTax <= 0) warnings.push("法定相続人の人数を確認してください。");
  const coreAssets = num(input.cash) + num(input.securities) + num(input.homeProperty) + num(input.rentalProperty) + num(input.businessAssets) + num(input.otherAssets);
  if (coreAssets <= 0) warnings.push("主要資産が未入力です。資産構成タブを確認してください。");
  if (input.priorGiftMode === "auto" && (num(input.giftsWithin3Years) || num(input.giftsYears4to7))) warnings.push("過去贈与は日付・贈与者・受贈者・申告有無を別途確認してください。");
  return warnings;
}

function renderReport() {
  const wrap = document.getElementById("reportView");
  if (!wrap) return;
  const e = calcEstate(state);
  const r = diagnoseRisks(state);
  const effect = calcActionEffect();
  const division = calcDivisionPlan(state);
  const tasks = getTaskSuggestions(state);
  const unreflected = getUnreflectedItems(state);
  const selectedActions = actionDefinitions().filter((def) => state[def.enabled]).map((def) => def.title);
  const reportWarnings = getReportWarnings(state);
  const riskText = `税:${r.taxRisk} / 資金:${r.cashRisk} / 分割:${r.splitRisk} / 二次:${r.secondRisk}`;
  wrap.innerHTML = `
    ${reportWarnings.length ? `
      <section class="report-block report-check warning">
        <h3>印刷前の確認</h3>
        <ul>${reportWarnings.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
      </section>
    ` : `
      <section class="report-block report-check ok">
        <h3>印刷前の確認</h3>
        <p>基本項目は入力済みです。個別評価・資料確認は別途行ってください。</p>
      </section>
    `}
    <section class="report-block">
      <h3>${esc(state.caseName || "資産承継 面談メモ")}</h3>
      <p>${esc(state.meetingDate || "")}　担当：${esc(state.staffName || "")}</p>
      <div class="report-grid">
        <div><span>正味財産</span><b>${yen(e.netEstate)}</b></div>
        <div><span>基礎控除</span><b>${yen(e.heirs.basicDeduction)}</b></div>
        <div><span>相続税総額概算</span><b>${yen(e.inheritanceTaxTotal)}</b></div>
        <div><span>打ち手後概算</span><b>${yen(effect.after.inheritanceTaxTotal)}</b></div>
      </div>
    </section>
    <section class="report-block">
      ${comparisonChartBlock("主要金額の比較", "面談レポート用に、現状と打ち手後の差を要約します。", [
        { label: "正味財産", before: effect.before.netEstate, after: effect.after.netEstate },
        { label: "課税遺産総額", before: effect.before.taxableEstate, after: effect.after.taxableEstate },
        { label: "相続税総額概算", before: effect.before.inheritanceTaxTotal, after: effect.after.inheritanceTaxTotal }
      ])}
    </section>
    <section class="report-block">
      <h3>主な見立て</h3>
      <p>法定相続人 ${e.heirs.heirsForTax}人、相続順位 ${esc(e.heirs.rank)}。リスク判定は ${esc(riskText)} です。</p>
      <p>生前贈与加算は ${yen(e.priorGiftAddBack)} を計算に反映しています。配偶者取得割合は一次相続だけでなく二次相続と生活資金を合わせて確認してください。</p>
    </section>
    <section class="report-block">
      <h3>分割案・一次相続税</h3>
      <p>${esc(state.divisionPlanName || "分割案")}：配偶者取得割合 ${pct(division.spouseShare)}、配偶者取得額 ${yen(division.spouseAcquisition)}、その他相続人取得額 ${yen(division.othersAcquisition)}。</p>
      <div class="report-grid">
        <div><span>税額軽減前</span><b>${yen(division.taxBeforeCredit)}</b></div>
        <div><span>配偶者税額軽減</span><b>${yen(division.spouseRelief)}</b></div>
        <div><span>一次相続税</span><b>${yen(division.payableTax)}</b></div>
        <div><span>納税資金不足</span><b>${yen(division.cashShortage)}</b></div>
      </div>
    </section>
    <section class="report-block">
      <h3>検討した打ち手</h3>
      ${selectedActions.length ? `<ul>${selectedActions.map((a) => `<li>${esc(a)}</li>`).join("")}</ul>` : "<p>打ち手候補は未選択です。</p>"}
    </section>
    <section class="report-block">
      <h3>次回までの確認事項</h3>
      ${tasks.length ? `<ul>${tasks.map((task) => `<li>${esc(task)}</li>`).join("")}</ul>` : "<p>自動抽出された確認事項はありません。</p>"}
      ${state.nextTasks ? `<p><strong>手入力メモ：</strong>${esc(state.nextTasks).replace(/\n/g, "<br>")}</p>` : ""}
    </section>
    <section class="report-block">
      <h3>未反映・注意事項</h3>
      <ul>${unreflected.map((item) => `<li>${esc(item)}</li>`).join("")}</ul>
    </section>
  `;
}

function tpsStatusClass(status) {
  if (status === "転記") return "copy";
  if (status === "要内訳") return "detail";
  if (status === "別途確認") return "confirm";
  if (status === "照合") return "check";
  return "reference";
}

function yesNo(value) {
  return value === "yes" ? "あり" : value === "no" ? "なし" : "未確認";
}

function getTpsMappingRows(input = state) {
  const e = calcEstate(input);
  const g = calcGift(input);
  const effect = calcActionEffect();
  const division = calcDivisionPlan(input);
  const actionTitles = actionDefinitions().filter((def) => input[def.enabled]).map((def) => def.title);
  const spouseText = input.hasSpouse === "yes" ? "あり" : "なし";
  const familyCounts = [
    `配偶者 ${spouseText}`,
    `実子 ${e.heirs.naturalChildren}人`,
    `養子 ${e.heirs.adopted}人`,
    `父母等 ${e.heirs.parents}人`,
    `兄弟姉妹等 ${e.heirs.siblings}人`
  ].join(" / ");
  const taxHeirText = `${e.heirs.heirsForTax}人（養子の税法算入 ${e.heirs.adoptedForTax}人）`;
  const settlementText = [
    `贈与予定 ${yen(input.settlementGift)}`,
    `年110万円控除後 ${yen(g.settlementBase)}`,
    `特別控除残 ${yen(g.remainingSpecial)}`,
    `概算税額 ${yen(g.settlementTax)}`
  ].join(" / ");
  const actionText = actionTitles.length
    ? `${actionTitles.join(" / ")}（相続税概算差額 ${yen(effect.taxReduction)}）`
    : "未選択";
  const divisionText = `${input.divisionPlanName || "分割案"} / 配偶者取得 ${pct(division.spouseShare)} / 一次相続税 ${yen(division.payableTax)} / 納税資金不足 ${yen(division.cashShortage)}`;

  return [
    {
      group: "1. 財産所有者",
      tps: "財産所有者の入力 > 氏名",
      source: "相談者名・案件名",
      value: input.caseName || "未入力",
      status: "要内訳",
      note: "案件名と本人名が混在している場合は、TPS8200では財産所有者本人の氏名へ分解して入力します。"
    },
    {
      group: "1. 財産所有者",
      tps: "財産所有者の入力 > 生年月日",
      source: "本ツールでは未入力",
      value: "別途確認",
      status: "別途確認",
      note: "TPS8200では年齢計算に使うため必須です。面談メモや本人確認資料から補完します。"
    },
    {
      group: "2. 家族構成",
      tps: "家族構成の入力 > 家族一覧",
      source: "家族構成タブ",
      value: familyCounts,
      status: "要内訳",
      note: "本ツールは人数集計です。TPS8200では氏名・続柄・親族区分・相続区分・生年月日・養子区分を1人ずつ入力します。"
    },
    {
      group: "2. 家族構成",
      tps: "家族構成の入力 > 相続税法上の相続人",
      source: "法定相続人の数",
      value: taxHeirText,
      status: "照合",
      note: "本ツールでは実子あり1人、実子なし2人までの養子算入制限を反映しています。TPS8200の自動判定結果と照合します。"
    },
    {
      group: "2. 家族構成",
      tps: "遺産分割案・配偶者税額軽減の確認",
      source: "分割案タブ",
      value: divisionText,
      status: "要内訳",
      note: "TPS8200側で相続人別の取得財産、配偶者税額軽減、納税額が本ツールの面談案と整合するか確認します。"
    },
    {
      group: "3. 所有財産",
      tps: "所有財産 > 現金・預貯金等",
      source: "現預金",
      value: yen(input.cash),
      status: "転記",
      note: "銀行別・口座別の明細がある場合はTPS8200側で行を分けます。"
    },
    {
      group: "3. 所有財産",
      tps: "所有財産 > 有価証券",
      source: "上場株式・投信等",
      value: yen(input.securities),
      status: "要内訳",
      note: "銘柄・数量・評価額の明細へ分解します。非上場株式はTPS8100等の評価結果複写も検討します。"
    },
    {
      group: "3. 所有財産",
      tps: "所有財産 > 土地等 / 家屋・構築物",
      source: "自宅土地建物",
      value: yen(input.homeProperty),
      status: "要内訳",
      note: "土地と家屋に分け、所在地番・地積/床面積・固定資産税評価額・倍率・共有持分を入力します。"
    },
    {
      group: "3. 所有財産",
      tps: "所有財産 > 土地等 / 家屋・構築物",
      source: "貸付不動産",
      value: yen(input.rentalProperty),
      status: "要内訳",
      note: "貸家建付地・貸家などの評価要素、賃貸状況、借入金との対応をTPS8200側で確認します。"
    },
    {
      group: "3. 所有財産",
      tps: "所有財産 > 事業用財産 / 有価証券 / その他の財産",
      source: "非上場株式・事業用資産",
      value: yen(input.businessAssets),
      status: "要内訳",
      note: "会社株価対策の検討対象です。TPS8100等で株価評価を行い、TPS8200へ評価結果を反映します。"
    },
    {
      group: "3. 所有財産",
      tps: "所有財産 > その他の財産",
      source: "その他財産",
      value: yen(input.otherAssets),
      status: "要内訳",
      note: "家庭用財産、未収金、その他財産などTPS8200の細目に合わせて振り分けます。"
    },
    {
      group: "4. 生命保険金等・退職手当金等",
      tps: "生命保険金等 > 受取人・受取金額",
      source: "生命保険",
      value: `総額 ${yen(input.lifeInsurance)} / 相続人受取 ${yen(input.lifeInsuranceHeirs)} / 非課税枠 ${yen(e.insuranceExemption)}`,
      status: "要内訳",
      note: "TPS8200では受取人を家族一覧から選択します。非課税枠は500万円×相続人の数で照合します。"
    },
    {
      group: "4. 生命保険金等・退職手当金等",
      tps: "退職手当金等",
      source: "本ツールでは未入力",
      value: "別途確認",
      status: "別途確認",
      note: "死亡退職金・弔慰金見込がある場合は、支給規程と受取人を確認してTPS8200へ入力します。"
    },
    {
      group: "5. 債務等",
      tps: "債務等 > 銀行借入金・その他",
      source: "債務",
      value: yen(input.debts),
      status: "要内訳",
      note: "借入先・残高・債務の種類ごとにTPS8200の債務等へ入力します。"
    },
    {
      group: "5. 債務等",
      tps: "債務等 > 葬式費用",
      source: "葬式費用",
      value: yen(input.funeralCosts),
      status: "転記",
      note: "見込額の場合は、実際の支払時に再確認します。"
    },
    {
      group: "6. 過去に贈与した相続時精算課税適用財産",
      tps: "相続時精算課税適用財産 > 合計額",
      source: "相続時精算課税 贈与予定額",
      value: settlementText,
      status: "照合",
      note: "令和6年以後の贈与は年110万円基礎控除後の額をTPS8200へ入力します。過去分と予定分は資料で区別します。"
    },
    {
      group: "7. 小規模宅地等の特例",
      tps: "小規模宅地等の特例の適用",
      source: "同居親族・自宅承継予定",
      value: `同居親族 ${yesNo(input.coResident)} / 自宅承継予定 ${yesNo(input.homePlanChild)}`,
      status: "別途確認",
      note: "本ツールでは特例額を自動反映していません。対象宅地・面積・取得者をTPS8200側で判定します。"
    },
    {
      group: "8. 現状の相続税の試算",
      tps: "現状の相続税の試算",
      source: "現状診断",
      value: `正味財産 ${yen(e.netEstate)} / 課税遺産 ${yen(e.taxableEstate)} / 相続税概算 ${yen(e.inheritanceTaxTotal)}`,
      status: "照合",
      note: "TPS8200で明細入力後、概算差が大きい場合は土地評価・保険受取人・債務控除・贈与加算を優先確認します。"
    },
    {
      group: "9. 暦年課税・相続時精算課税の比較表",
      tps: "暦年課税・相続時精算課税の比較表",
      source: "贈与・保険タブ",
      value: `暦年贈与総額 ${yen(g.totalAnnualGift)} / 暦年贈与税 ${yen(g.totalAnnualGiftTax)} / 精算課税予定 ${yen(input.settlementGift)}`,
      status: "参考",
      note: "受贈者別の生年月日・続柄・課税方式はTPS8200またはgift-tax側で詳細確認します。"
    },
    {
      group: "対策案",
      tps: "相続対策アクションプラン",
      source: "打ち手比較",
      value: actionText,
      status: "参考",
      note: "現状入力後、生命保険加入・贈与・財産評価下げ・資産組替え等の対策欄へ必要に応じて手入力します。"
    }
  ];
}

function getTpsStatusCounts(rows) {
  return rows.reduce((acc, row) => {
    acc[row.status] = (acc[row.status] || 0) + 1;
    return acc;
  }, {});
}

function getTpsWorkflowSteps(input = state) {
  const e = calcEstate(input);
  const g = calcGift(input);
  return [
    {
      no: "1",
      title: "財産所有者",
      action: "氏名と生年月日を先に確定",
      basis: input.caseName ? `候補：${input.caseName}` : "氏名未入力",
      note: "生年月日は本ツール外で確認"
    },
    {
      no: "2",
      title: "家族構成",
      action: "人数集計を個人別行へ展開",
      basis: `法定相続人 ${e.heirs.heirsForTax}人 / 養子算入 ${e.heirs.adoptedForTax}人`,
      note: "氏名・続柄・生年月日・養子区分が必要"
    },
    {
      no: "3",
      title: "所有財産",
      action: "資産区分ごとに明細化して入力",
      basis: `正味財産概算 ${yen(e.netEstate)}`,
      note: "土地建物・有価証券・自社株は明細資料へ分解"
    },
    {
      no: "4",
      title: "生命保険金等・退職手当金等",
      action: "受取人別に入力",
      basis: `保険総額 ${yen(input.lifeInsurance)} / 非課税枠 ${yen(e.insuranceExemption)}`,
      note: "退職手当金は別途確認"
    },
    {
      no: "5",
      title: "債務等",
      action: "債務と葬式費用を分けて入力",
      basis: `債務 ${yen(input.debts)} / 葬式費用 ${yen(input.funeralCosts)}`,
      note: "借入先・種類別の内訳が必要"
    },
    {
      no: "6",
      title: "相続時精算課税適用財産",
      action: "年110万円控除後の額を確認",
      basis: `控除後 ${yen(g.settlementBase)} / 特別控除残 ${yen(g.remainingSpecial)}`,
      note: "過去分と予定分を混ぜない"
    },
    {
      no: "7",
      title: "小規模宅地等",
      action: "対象宅地・取得者・面積をTPS側で判定",
      basis: `同居 ${yesNo(input.coResident)} / 自宅承継 ${yesNo(input.homePlanChild)}`,
      note: "本ツールの税額には未反映"
    },
    {
      no: "8",
      title: "現状試算",
      action: "TPS明細入力後の税額と照合",
      basis: `相続税概算 ${yen(e.inheritanceTaxTotal)}`,
      note: "差が出たら評価・保険・債務・贈与加算を確認"
    }
  ];
}

function renderTpsMapping() {
  const wrap = document.getElementById("tpsMappingView");
  if (!wrap) return;
  const rows = getTpsMappingRows(state);
  const counts = getTpsStatusCounts(rows);
  const workflow = getTpsWorkflowSteps(state);
  const directRows = rows.filter((row) => row.status === "転記" || row.status === "照合");
  wrap.innerHTML = `
    <section class="report-block tps-cover">
      <h3>転記対象案件</h3>
      <div class="tps-summary-grid">
        <div><span>案件</span><b>${esc(state.caseName || "未入力")}</b></div>
        <div><span>面談日</span><b>${esc(state.meetingDate || "未入力")}</b></div>
        <div><span>担当</span><b>${esc(state.staffName || "未入力")}</b></div>
        <div><span>作成</span><b>${esc(VERSION)}</b></div>
      </div>
    </section>
    <section class="report-block">
      <h3>TPS8200転記の実務サマリー</h3>
      <div class="tps-readiness-grid">
        <div><span>そのまま転記</span><b>${counts["転記"] || 0}件</b><small>現預金・葬式費用など</small></div>
        <div><span>明細化が必要</span><b>${counts["要内訳"] || 0}件</b><small>家族別・財産別に分解</small></div>
        <div><span>別途確認</span><b>${counts["別途確認"] || 0}件</b><small>生年月日・退職金・特例判定</small></div>
        <div><span>TPS側で照合</span><b>${counts["照合"] || 0}件</b><small>相続人・税額・精算課税</small></div>
      </div>
      <p class="tps-operator-note">この表はインポート用データではなく、TPS8200へ手入力する順番と検算ポイントをそろえるための作業表です。</p>
    </section>
    <section class="report-block">
      <h3>TPS8200入力順チェック</h3>
      <div class="tps-workflow-list">
        ${workflow.map((step) => `
          <div class="tps-workflow-item">
            <b>${esc(step.no)}</b>
            <div>
              <strong>${esc(step.title)}</strong>
              <p>${esc(step.action)}</p>
              <small>${esc(step.basis)} / ${esc(step.note)}</small>
            </div>
          </div>
        `).join("")}
      </div>
    </section>
    <section class="report-block">
      <h3>先に転記・照合できる数字</h3>
      <div class="table-wrap">
        <table class="tps-quick-table">
          <thead>
            <tr><th>TPS8200の入力先</th><th>値</th><th>扱い</th><th>注意</th></tr>
          </thead>
          <tbody>
            ${directRows.map((row) => `
              <tr>
                <td>${esc(row.tps)}</td>
                <td class="tps-value">${esc(row.value)}</td>
                <td><span class="tps-status ${tpsStatusClass(row.status)}">${esc(row.status)}</span></td>
                <td>${esc(row.note)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
    <section class="report-block">
      <h3>TPS8200入力項目マッピング</h3>
      <div class="table-wrap">
        <table class="tps-map-table">
          <thead>
            <tr>
              <th>区分</th>
              <th>TPS8200の入力先</th>
              <th>本ツールの項目</th>
              <th>転記・確認する値</th>
              <th>扱い</th>
              <th>確認メモ</th>
              <th>入力確認</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((row) => `
              <tr>
                <td class="tps-group">${esc(row.group)}</td>
                <td>${esc(row.tps)}</td>
                <td>${esc(row.source)}</td>
                <td class="tps-value">${esc(row.value)}</td>
                <td><span class="tps-status ${tpsStatusClass(row.status)}">${esc(row.status)}</span></td>
                <td>${esc(row.note)}</td>
                <td class="tps-print-check">□</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    </section>
    <section class="report-block tps-checklist">
      <h3>TPS8200入力前に追加で集める資料</h3>
      <ul>
        <li>財産所有者・推定相続人・受取人の氏名、生年月日、続柄、住所、養子区分</li>
        <li>土地建物の固定資産税評価明細、登記情報、地積・床面積、利用状況、賃貸借条件</li>
        <li>保険証券、死亡退職金・弔慰金の規程、借入金残高、葬式費用見込</li>
        <li>過去贈与の契約書・申告書・受贈者別明細、相続時精算課税の既使用控除額</li>
        <li>非上場株式・事業用資産はTPS8100等の評価資料、役員借入金、類似業種比準要素、純資産資料</li>
      </ul>
    </section>
  `;
}

function renderSummary() {
  const e = calcEstate(state);
  const r = diagnoseRisks(state);
  const effect = calcActionEffect();
  const cashAvailable = num(state.cash) - num(state.cashReserveTarget);
  const cashShortage = Math.max(0, e.inheritanceTaxTotal - cashAvailable);
  const cashSurplus = Math.max(0, cashAvailable - e.inheritanceTaxTotal);
  const taxFundingLabel = cashShortage > 0 ? `不足 ${yen(cashShortage)}` : `余裕 ${yen(cashSurplus)}`;
  const taxDiff = effect.before.inheritanceTaxTotal - effect.after.inheritanceTaxTotal;
  const maxTax = Math.max(effect.before.inheritanceTaxTotal, effect.after.inheritanceTaxTotal, 1);
  const beforeTaxWidth = Math.max(effect.before.inheritanceTaxTotal > 0 ? 4 : 0, (effect.before.inheritanceTaxTotal / maxTax) * 100);
  const afterTaxWidth = Math.max(effect.after.inheritanceTaxTotal > 0 ? 4 : 0, (effect.after.inheritanceTaxTotal / maxTax) * 100);
  document.getElementById("liveSummary").innerHTML = `
    <div class="mini"><span>正味財産</span><b>${calcValueHtml(yen(e.netEstate), "netEstate")}</b></div>
    <div class="mini"><span>基礎控除</span><b>${calcValueHtml(yen(e.heirs.basicDeduction), "basicDeduction")}</b></div>
    <div class="summary-action-box">
      <div class="summary-action-head">
        <span>相続税 打ち手比較</span>
        <b class="${taxDiff > 0 ? "positive" : taxDiff < 0 ? "negative" : ""}">${calcValueHtml(diffText(taxDiff), "actionDiff:inheritanceTaxTotal")}</b>
      </div>
      <div class="summary-action-row">
        <span>現状相続税</span>
        <div class="summary-action-track">${svgBar(beforeTaxWidth, "#8ca3ad")}</div>
        <b>${calcValueHtml(yen(effect.before.inheritanceTaxTotal), "actionEffect:before:inheritanceTaxTotal")}</b>
      </div>
      <div class="summary-action-row after">
        <span>対策後相続税</span>
        <div class="summary-action-track">${svgBar(afterTaxWidth, "#578899")}</div>
        <b>${calcValueHtml(yen(effect.after.inheritanceTaxTotal), "actionEffect:after:inheritanceTaxTotal")}</b>
      </div>
    </div>
    <div class="mini"><span>納税資金</span><b>${calcValueHtml(taxFundingLabel, "taxFunding")}</b></div>
    <div class="mini"><span>法定相続人</span><b>${calcValueHtml(`${e.heirs.heirsForTax}人`, "heirsForTax")}</b></div>
    <div class="mini"><span>主なリスク</span><b>税:${r.taxRisk} / 資金:${r.cashRisk} / 分割:${r.splitRisk}</b></div>
  `;
}

function openSource(key) {
  const s = TaxRules.sources[key] || TaxRules.sources.tool_disclaimer;
  const legalLinks = (s.legalRefs || [])
    .map((ref) => `<a href="${esc(ref.url)}" target="_blank" rel="noopener">${esc(ref.title)}</a>`)
    .join(" / ");
  document.getElementById("sourceTitle").textContent = s.title;
  document.getElementById("sourceBody").innerHTML = `
    <p>${s.summary}</p>
    <div class="source-meta">
      ${s.formula ? `<div><strong>計算式：</strong>${s.formula}</div>` : ""}
      <div><strong>根拠：</strong>${s.sourceTitle || "運用上の注意"}</div>
      ${legalLinks ? `<div><strong>法令根拠：</strong>${legalLinks}</div>` : ""}
      <div><strong>確認日：</strong>${s.lastChecked}</div>
      <div><strong>使用箇所：</strong>${(s.usage || []).join("、")}</div>
    </div>
    ${s.url ? `<p><a href="${s.url}" target="_blank" rel="noopener">根拠ページを新しいタブで開く</a></p>` : ""}
    <ul class="checklist">
      <li>この制度の要件・期限・添付書類を最新情報で確認する。</li>
      <li>入力値と家族関係に未確認事項があれば、実行判断を保留する。</li>
      <li>税額だけでなく、納税資金・分割・二次相続・生活資金を同時に見る。</li>
    </ul>
  `;
  document.getElementById("sourceDialog").showModal();
}

function openCalculationBreakdown(key) {
  const item = actionEffectBreakdown(key) || actionDiffBreakdown(key) || spouseScenarioBreakdown(key) || divisionPlanBreakdown(key) || getCalculationBreakdowns(state)[key];
  if (!item) return;
  document.getElementById("calcTitle").textContent = item.title;
  document.getElementById("calcBody").innerHTML = `
    ${item.note ? `<p class="calc-note-box">${esc(item.note)}</p>` : ""}
    <ol class="calc-lines">
      ${item.lines.map((line, index) => `<li><b>${index + 1}</b><code>${esc(line)}</code></li>`).join("")}
    </ol>
  `;
  document.getElementById("calcDialog").showModal();
}

function collectStateFromInputs() {
  document.querySelectorAll("[data-field]").forEach((el) => {
    const key = el.dataset.field;
    if (el.type === "checkbox") state[key] = el.checked;
    else state[key] = el.hasAttribute("data-money") ? toNumber(el.value) : el.value;
  });
  document.querySelectorAll("[data-action-field]").forEach((el) => {
    const key = el.dataset.actionField;
    if (el.type === "checkbox") state[key] = el.checked;
    else state[key] = el.hasAttribute("data-money") ? toNumber(el.value) : el.value;
  });
  state = normalizeState(state);
}

function clearPrintScope() {
  document.body.classList.remove("print-scoped");
  document.querySelectorAll(".tab-panel.print-target").forEach((panel) => panel.classList.remove("print-target"));
}

function setPrintScope(button) {
  clearPrintScope();
  const panel = button.closest(".tab-panel");
  if (!panel) return;
  document.body.classList.add("print-scoped");
  panel.classList.add("print-target");
}

function formatMoneyInput(el) {
  const raw = el.value;
  const n = toNumber(raw);
  el.value = n ? n.toLocaleString("ja-JP") : "";
}

function syncFooterMeta() {
  const yearEl = document.getElementById("cpy-year");
  const dateEl = document.getElementById("last-updated-date");
  const revEl = document.getElementById("build-rev");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
  if (dateEl) {
    const d = new Date(document.lastModified);
    const yyyy = String(d.getFullYear());
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    dateEl.textContent = `${yyyy}-${mm}-${dd}`;
  }
  if (revEl) revEl.textContent = VERSION;
}

if (typeof document !== "undefined") {
  syncFooterMeta();

  document.addEventListener("input", (e) => {
    if (e.target.matches("[data-money]")) formatMoneyInput(e.target);
    if (e.target.matches("[data-field], [data-action-field]")) {
      collectStateFromInputs();
      render();
    }
  });

  document.addEventListener("change", (e) => {
    if (e.target.matches("[data-field], [data-action-field]")) {
      collectStateFromInputs();
      render();
    }
  });

  document.addEventListener("click", (e) => {
    const breakdown = e.target.closest("[data-breakdown]");
    if (breakdown) {
      openCalculationBreakdown(breakdown.dataset.breakdown);
      return;
    }
    const stepTarget = e.target.closest("[data-step-target]");
    if (stepTarget) {
      switchTab(stepTarget.dataset.stepTarget);
      return;
    }
    const recommendedAction = e.target.closest("[data-recommend-action]");
    if (recommendedAction) {
      state[recommendedAction.dataset.recommendAction] = true;
      render();
      return;
    }
    const tab = e.target.closest(".tab");
    if (tab) {
      switchTab(tab.dataset.tab);
    }
    const src = e.target.closest("[data-source]");
    if (src && !src.classList.contains("tab")) openSource(src.dataset.source);
  });

  document.getElementById("closeSource").addEventListener("click", () => document.getElementById("sourceDialog").close());
  document.getElementById("closeCalc").addEventListener("click", () => document.getElementById("calcDialog").close());
  document.getElementById("saveBtn").addEventListener("click", () => {
    collectStateFromInputs();
    localStorage.setItem("shisan-shokei-navi", JSON.stringify(state));
    alert("ブラウザに一時保存しました。");
  });
  document.getElementById("loadBtn").addEventListener("click", () => {
    const saved = localStorage.getItem("shisan-shokei-navi");
    if (!saved) return alert("保存データがありません。");
    state = normalizeState(JSON.parse(saved));
    render();
  });
  document.getElementById("clearSaveBtn").addEventListener("click", () => {
    if (!confirm("このブラウザ内の一時保存データを削除します。よろしいですか？")) return;
    localStorage.removeItem("shisan-shokei-navi");
    alert("一時保存データを削除しました。");
  });
  document.getElementById("exportBtn").addEventListener("click", () => {
    collectStateFromInputs();
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `資産承継面談_${state.caseName || "案件"}_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.querySelectorAll(".print-action").forEach((btn) => {
    btn.addEventListener("click", () => {
      collectStateFromInputs();
      render();
      setPrintScope(btn);
      const warnings = getReportWarnings(state);
      if (warnings.length && !confirm(`印刷前の確認項目があります。\n\n${warnings.join("\n")}\n\nこのまま印刷しますか？`)) {
        clearPrintScope();
        return;
      }
      window.print();
    });
  });
  window.addEventListener("afterprint", clearPrintScope);
  document.getElementById("importFile").addEventListener("change", async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = JSON.parse(text);
    state = normalizeState(parsed.state || parsed);
    render();
  });

  render();
}
