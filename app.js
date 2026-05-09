import { TaxRules } from "./tax-rules.js";

const defaults = {
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
  actionCustomReductionEnabled: false,
  actionCustomReductionAmount: 0
};

const moneyFields = new Set([
  "spouseOwnAssets", "spouseFutureConsumption", "cash", "securities", "homeProperty", "rentalProperty", "businessAssets", "otherAssets",
  "debts", "funeralCosts", "cashReserveTarget", "lifeInsurance", "lifeInsuranceHeirs", "priorGiftsAddBack", "giftsWithin3Years", "giftsYears4to7",
  "annualGiftPerPerson", "settlementGift", "settlementDeductionUsed", "housingGift",
  "actionAnnualGiftPerPerson", "actionHousingGiftAmount", "actionLifeInsuranceAmount", "actionSpouseHomeGiftAmount",
  "actionSettlementAmount", "actionCustomReductionAmount"
]);

let state = normalizeState({ ...defaults });

function normalizeState(input) {
  const out = { ...defaults, ...input };
  for (const field of moneyFields) out[field] = toNumber(out[field]);
  ["childrenCount", "adoptedCount", "parentsCount", "siblingsCount", "annualGiftRecipients", "annualGiftYears", "actionAnnualGiftRecipients", "actionAnnualGiftYears", "assumedInheritanceYear"].forEach((field) => {
    out[field] = Math.max(0, Math.floor(toNumber(out[field])));
  });
  ["actionAnnualGiftEnabled", "actionHousingGiftEnabled", "actionLifeInsuranceEnabled", "actionSpouseHomeGiftEnabled", "actionSettlementEnabled", "actionCustomReductionEnabled"].forEach((field) => {
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

function getHeirInfo(input = state) {
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

function calcEstate(input = state) {
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
    secondTax: Math.floor(second.inheritanceTaxTotal),
    totalTax: Math.floor(firstTax + second.inheritanceTaxTotal),
    comment: spouseShare === 1 ? "一次は軽く見えやすいが二次相続が重くなりやすい" :
      spouseShare === 0 ? "一次で子へ寄せる案。配偶者生活資金に注意" :
      "一次・二次のバランス確認"
  };
}

function calcGift(input = state) {
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
    "遺産分割、遺留分、名義預金、過去贈与の証拠関係は本ツール外で確認"
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
  if (r.secondRisk !== "低") tasks.push("配偶者固有財産、生活費消費見込、二次相続時の相続人を確認");
  if (e.taxableEstate > 0) tasks.push("固定資産税課税明細、路線価図、借入金残高、葬式費用見込を回収");
  return [...new Set(tasks)];
}

function makeCard(label, value, note = "") {
  const tpl = document.getElementById("cardTemplate");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".label").textContent = label;
  node.querySelector(".value").textContent = value;
  node.querySelector(".note").textContent = note;
  return node;
}

function renderCards(id, cards) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = "";
  cards.forEach((c) => el.appendChild(makeCard(c[0], c[1], c[2])));
}

function chartBlock(title, subtitle, rows, options = {}) {
  const valueFormatter = options.valueFormatter || yen;
  const visibleRows = rows.filter((row) => num(row.value) > 0 || row.keepZero);
  const max = options.max ?? Math.max(0, ...visibleRows.map((row) => num(row.value)));
  const body = visibleRows.length && max > 0
    ? visibleRows.map((row, i) => {
        const value = Math.max(0, num(row.value));
        const width = Math.max(value > 0 ? 3 : 0, Math.min(100, (value / max) * 100));
        return `
          <div class="chart-row">
            <div class="chart-row-head">
              <span>${esc(row.label)}</span>
              <b>${esc(row.display ?? valueFormatter(value))}</b>
            </div>
            <div class="chart-track"><span class="chart-fill tone-${(i % 5) + 1}" style="width:${width}%"></span></div>
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
              <div class="chart-track"><span class="chart-fill compare-before" style="width:${Math.max(before > 0 ? 3 : 0, (before / max) * 100)}%"></span></div>
              <b>${yen(before)}</b>
              <span class="compare-label">対策後</span>
              <div class="chart-track"><span class="chart-fill compare-after" style="width:${Math.max(after > 0 ? 3 : 0, (after / max) * 100)}%"></span></div>
              <b>${yen(after)}</b>
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

function renderChart(id, title, subtitle, rows, options = {}) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = chartBlock(title, subtitle, rows, options);
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
    ["法定相続人の数（税額計算用）", `${e.heirs.heirsForTax}人`, `養子算入：${e.heirs.adoptedForTax}人 / 相続順位：${e.heirs.rank}`],
    ["基礎控除額", yen(e.heirs.basicDeduction), "3,000万円 + 600万円 × 法定相続人"],
    ["法定相続分の概略", e.heirs.shares.map((s) => `${s.label} ${pct(s.share)}`).join(" / "), "詳細な相続関係は別途確認"]
  ]);

  renderCards("assetResults", [
    ["課税対象財産 概算", yen(e.grossAssets), "死亡保険金の非課税控除後・過去贈与加算含む"],
    ["債務・葬式費用", yen(e.deductions), "第1版では単純控除"],
    ["正味財産 概算", yen(e.netEstate), "小規模宅地等の特例は未反映"],
    ["不動産・事業資産比率", pct(e.illiquidRatio), "分割困難・納税資金リスクの目安"],
    ["死亡保険金非課税枠", yen(e.insuranceExemption), "500万円 × 法定相続人の数"],
    ["課税対象保険金", yen(e.taxableInsurance), "受取人・契約者・被保険者の確認が必要"]
  ]);

  renderCards("giftResults", [
    ["暦年贈与税 / 人・年", yen(g.annualGiftTaxPerPerson), `課税価格 ${yen(g.annualTaxable)}`],
    ["暦年贈与 移転総額", yen(g.totalAnnualGift), `${state.annualGiftRecipients || 0}人 × ${state.annualGiftYears || 0}年`],
    ["暦年贈与税 合計概算", yen(g.totalAnnualGiftTax), "生前贈与加算対象期間に注意"],
    ["相続財産へ加算する贈与額", yen(e.priorGiftAddBack), giftAddBackLabel],
    ["相続時精算課税 贈与税概算", yen(g.settlementTax), `残特別控除 ${yen(g.remainingSpecial)}`],
    ["住宅資金贈与 非課税枠", yen(g.housingLimit), "要件・期限・証明書類の確認が必要"],
    ["住宅資金贈与 課税候補", yen(g.housingTaxable), "暦年または精算課税との関係を確認"]
  ]);

  renderCards("diagnosisResults", [
    ["正味財産", yen(e.netEstate), "概算"],
    ["課税遺産総額", yen(e.taxableEstate), "正味財産 − 基礎控除"],
    ["相続税総額 概算", yen(e.inheritanceTaxTotal), "税額控除前の概算"],
    ["現預金総額", yen(num(state.cash)), "生活費・予備資金を含む"],
    ["納税資金不足目安", yen(Math.max(0, e.inheritanceTaxTotal - (num(state.cash) - num(state.cashReserveTarget)))), "現預金から生活費・予備資金を控除"],
    ["生前贈与加算額", yen(e.priorGiftAddBack), "相続税の課税価格に加算する概算"]
  ]);

  renderAssetChart(e);
  renderGiftChart(g, e);
  renderDiagnosisCharts(e, risks);
  renderGiftTaxLinks(g);
  renderGiftAddBackNotice(g);
  renderRiskBand(risks);
  renderUnreflectedItems();
  renderSpouseScenarios();
  renderActionComparison();
  if (!document.activeElement || !document.activeElement.closest("#actionList") || document.activeElement.type === "checkbox") renderActionCards();
  renderTaskSuggestions();
  renderSources();
  renderReport();
  renderSummary();
}

function renderAssetChart(e) {
  renderChart("assetChart", "資産構成の見える化", "換金しやすい資産と、評価・分割確認が必要な資産を分けて確認します。", [
    { label: "現預金", value: state.cash },
    { label: "上場株式・投信等", value: state.securities },
    { label: "自宅土地建物", value: state.homeProperty },
    { label: "貸付不動産", value: state.rentalProperty },
    { label: "非上場株式・事業用資産", value: state.businessAssets },
    { label: "その他財産", value: state.otherAssets },
    { label: "債務・葬式費用", value: e.deductions, note: "控除側の金額" }
  ]);
}

function renderGiftChart(g, e) {
  renderChart("giftChart", "贈与・保険の論点比較", "移転額、贈与税コスト、相続財産への加算額、保険非課税枠を同じ尺度で確認します。", [
    { label: "暦年贈与 移転総額", value: g.totalAnnualGift },
    { label: "暦年贈与税 合計概算", value: g.totalAnnualGiftTax },
    { label: "相続財産へ加算する贈与額", value: e.priorGiftAddBack },
    { label: "相続時精算課税 贈与予定額", value: state.settlementGift },
    { label: "相続時精算課税 贈与税概算", value: g.settlementTax },
    { label: "死亡保険金非課税枠", value: e.insuranceExemption },
    { label: "住宅資金贈与 非課税枠", value: g.housingLimit }
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
        return { label: `配偶者 ${pct(r)}取得`, value: s.totalTax, note: `一次 ${yen(s.firstTax)} / 二次 ${yen(s.secondTax)}` };
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
    { label: "正味財産", before: effect.before.netEstate, after: effect.after.netEstate },
    { label: "課税遺産総額", before: effect.before.taxableEstate, after: effect.after.taxableEstate },
    { label: "相続税総額概算", before: effect.before.inheritanceTaxTotal, after: effect.after.inheritanceTaxTotal },
    { label: "納税資金不足目安", before: beforeCashShortage, after: afterCashShortage }
  ]);
  const beforeAfter = document.getElementById("beforeAfter");
  if (beforeAfter) {
    beforeAfter.innerHTML = `
      <article class="ba-card before"><span>現状の相続税概算</span><strong>${yen(effect.before.inheritanceTaxTotal)}</strong><small>課税遺産総額 ${yen(effect.before.taxableEstate)}</small></article>
      <article class="ba-card after"><span>対策後の相続税概算</span><strong>${yen(effect.after.inheritanceTaxTotal)}</strong><small>課税遺産総額 ${yen(effect.after.taxableEstate)}</small></article>
      <article class="ba-card impact"><span>相続税の概算効果</span><strong>${diffText(effect.taxReduction)}</strong><small>贈与税等概算コスト ${yen(effect.giftTaxCost)}</small></article>
    `;
  }

  const tbody = document.querySelector("#effectTable tbody");
  if (!tbody) return;
  const rows = [
    ["正味財産", effect.before.netEstate, effect.after.netEstate, effect.before.netEstate - effect.after.netEstate],
    ["課税遺産総額", effect.before.taxableEstate, effect.after.taxableEstate, effect.taxableEstateReduction],
    ["相続税総額概算", effect.before.inheritanceTaxTotal, effect.after.inheritanceTaxTotal, effect.taxReduction],
    ["納税資金不足目安（生活費等を除く）", beforeCashShortage, afterCashShortage, beforeCashShortage - afterCashShortage],
    ["死亡保険金非課税利用額", effect.before.insuranceExemption, effect.after.insuranceExemption, effect.after.insuranceExemption - effect.before.insuranceExemption],
    ["贈与税等概算コスト", 0, effect.giftTaxCost, -effect.giftTaxCost]
  ];
  tbody.innerHTML = rows.map(([label, before, after, diff]) => `
    <tr>
      <td>${label}</td>
      <td>${yen(before)}</td>
      <td>${yen(after)}</td>
      <td class="${diff > 0 ? "positive" : diff < 0 ? "negative" : ""}">${diffText(diff)}</td>
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
      enabled: "actionCustomReductionEnabled",
      title: "その他の評価圧縮・資産移転効果を仮置きする",
      source: "tool_disclaimer",
      level: e.illiquidRatio >= 0.45 ? "高" : "低",
      body: "不動産評価、事業承継、資産組替えなどの個別検討効果を仮置きする欄です。根拠確認なしで提案確定しないでください。",
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

function renderSources() {
  const usageCount = {};
  Object.values(TaxRules.sources).forEach((s) => {
    (s.usage || ["その他"]).forEach((usage) => {
      usageCount[usage] = (usageCount[usage] || 0) + 1;
    });
  });
  renderChart("sourceChart", "根拠マスタの用途分布", "どの画面・論点に根拠が紐づいているかを確認します。", Object.entries(usageCount)
    .sort((a, b) => b[1] - a[1])
    .map(([label, value]) => ({ label, value, display: `${value}件` })), { valueFormatter: (v) => `${v}件` });

  const wrap = document.getElementById("sourceList");
  if (!wrap) return;
  wrap.innerHTML = "";
  Object.entries(TaxRules.sources).forEach(([key, s]) => {
    const div = document.createElement("article");
    div.className = "source-item";
    div.innerHTML = `
      <h3>${s.title}</h3>
      <p>${s.summary}</p>
      <p>使用箇所：${(s.usage || []).join("、")}</p>
      ${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">根拠ページを開く</a>` : `<span>運用上の注意</span>`}
      <div><button type="button" class="source-btn" data-source="${key}">詳細</button></div>
    `;
    wrap.appendChild(div);
  });
}

function renderReport() {
  const wrap = document.getElementById("reportView");
  if (!wrap) return;
  const e = calcEstate(state);
  const r = diagnoseRisks(state);
  const effect = calcActionEffect();
  const tasks = getTaskSuggestions(state);
  const unreflected = getUnreflectedItems(state);
  const selectedActions = actionDefinitions().filter((def) => state[def.enabled]).map((def) => def.title);
  const riskText = `税:${r.taxRisk} / 資金:${r.cashRisk} / 分割:${r.splitRisk} / 二次:${r.secondRisk}`;
  wrap.innerHTML = `
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

function renderSummary() {
  const e = calcEstate(state);
  const r = diagnoseRisks(state);
  const effect = calcActionEffect();
  document.getElementById("liveSummary").innerHTML = `
    <div class="mini"><span>正味財産</span><b>${yen(e.netEstate)}</b></div>
    <div class="mini"><span>基礎控除</span><b>${yen(e.heirs.basicDeduction)}</b></div>
    <div class="mini"><span>相続税総額概算</span><b>${yen(e.inheritanceTaxTotal)}</b></div>
    <div class="mini"><span>打ち手後概算</span><b>${yen(effect.after.inheritanceTaxTotal)}</b></div>
    <div class="mini"><span>法定相続人</span><b>${e.heirs.heirsForTax}人</b></div>
    <div class="mini"><span>主なリスク</span><b>税:${r.taxRisk} / 資金:${r.cashRisk} / 分割:${r.splitRisk}</b></div>
  `;
}

function openSource(key) {
  const s = TaxRules.sources[key] || TaxRules.sources.tool_disclaimer;
  document.getElementById("sourceTitle").textContent = s.title;
  document.getElementById("sourceBody").innerHTML = `
    <p>${s.summary}</p>
    <div class="source-meta">
      ${s.formula ? `<div><strong>計算式：</strong>${s.formula}</div>` : ""}
      <div><strong>根拠：</strong>${s.sourceTitle || "運用上の注意"}</div>
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

function formatMoneyInput(el) {
  const raw = el.value;
  const n = toNumber(raw);
  el.value = n ? n.toLocaleString("ja-JP") : "";
}

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
  const tab = e.target.closest(".tab");
  if (tab) {
    document.querySelectorAll(".tab").forEach((t) => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach((p) => p.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(tab.dataset.tab).classList.add("active");
  }
  const src = e.target.closest("[data-source]");
  if (src && !src.classList.contains("tab")) openSource(src.dataset.source);
});

document.getElementById("closeSource").addEventListener("click", () => document.getElementById("sourceDialog").close());
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
document.getElementById("importFile").addEventListener("change", async (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const parsed = JSON.parse(text);
  state = normalizeState(parsed.state || parsed);
  render();
});

render();
