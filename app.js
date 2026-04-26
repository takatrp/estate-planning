import { TaxRules } from "./tax-rules.js";

const defaults = {
  caseName: "",
  meetingDate: new Date().toISOString().slice(0,10),
  staffName: "",
  mainPurpose: "overall",
  meetingMemo: "",
  hasSpouse: "yes",
  spouseAge: "",
  spouseOwnAssets: 0,
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
  annualGiftPerPerson: 1100000,
  annualGiftRecipients: 2,
  annualGiftYears: 5,
  giftRateType: "special",
  settlementGift: 0,
  settlementDeductionUsed: 0,
  housingGift: 0,
  housingType: "unknown",
  spouseHomeGift: "unknown",
  nextTasks: ""
};

let state = { ...defaults };

const yen = (v) => {
  const n = Number(v || 0);
  return n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });
};
const num = (v) => Number(v || 0);
const pct = (v) => `${Math.round(v * 100)}%`;

function applyRate(amount, rates) {
  const taxable = Math.max(0, Math.floor(amount));
  const row = rates.find(r => taxable <= r.max);
  return Math.max(0, Math.floor(taxable * row.rate - row.deduction));
}

function getHeirInfo(input = state) {
  const spouse = input.hasSpouse === "yes" ? 1 : 0;
  const naturalChildren = Math.max(0, Math.floor(num(input.childrenCount)));
  const adopted = Math.max(0, Math.floor(num(input.adoptedCount)));
  const adoptedForTax = adopted ? Math.min(adopted, naturalChildren > 0 ? 1 : 2) : 0;
  const childHeirsForTax = naturalChildren + adoptedForTax;
  const childHeirsCivil = naturalChildren + adopted;
  const parents = Math.max(0, Math.floor(num(input.parentsCount)));
  const siblings = Math.max(0, Math.floor(num(input.siblingsCount)));

  let rank = "";
  let heirsForTax = spouse;
  let shares = [];

  if (childHeirsForTax > 0) {
    rank = "子";
    heirsForTax += childHeirsForTax;
    if (spouse) {
      shares.push({ label: "配偶者", share: 1/2 });
      shares.push({ label: `子等 ${childHeirsForTax}人合計`, share: 1/2 });
    } else {
      shares.push({ label: `子等 ${childHeirsForTax}人合計`, share: 1 });
    }
  } else if (parents > 0) {
    rank = "直系尊属";
    heirsForTax += parents;
    if (spouse) {
      shares.push({ label: "配偶者", share: 2/3 });
      shares.push({ label: `直系尊属 ${parents}人合計`, share: 1/3 });
    } else {
      shares.push({ label: `直系尊属 ${parents}人合計`, share: 1 });
    }
  } else if (siblings > 0) {
    rank = "兄弟姉妹";
    heirsForTax += siblings;
    if (spouse) {
      shares.push({ label: "配偶者", share: 3/4 });
      shares.push({ label: `兄弟姉妹等 ${siblings}人合計`, share: 1/4 });
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
    childHeirsCivil,
    childHeirsForTax,
    parents,
    siblings,
    rank,
    heirsForTax,
    basicDeduction: 30000000 + 6000000 * heirsForTax,
    shares
  };
}

function calcEstate(input = state) {
  const heirs = getHeirInfo(input);
  const insuranceExemption = Math.min(num(input.lifeInsuranceHeirs), 5000000 * heirs.heirsForTax);
  const taxableInsurance = Math.max(0, num(input.lifeInsurance) - insuranceExemption);
  const grossAssets =
    num(input.cash) + num(input.securities) + num(input.homeProperty) +
    num(input.rentalProperty) + num(input.businessAssets) + num(input.otherAssets) +
    taxableInsurance + num(input.priorGiftsAddBack);
  const deductions = num(input.debts) + num(input.funeralCosts);
  const netEstate = Math.max(0, grossAssets - deductions);
  const taxableEstate = Math.max(0, netEstate - heirs.basicDeduction);
  const inheritanceTaxTotal = calcInheritanceTaxTotal(taxableEstate, heirs);
  const illiquid = num(input.homeProperty) + num(input.rentalProperty) + num(input.businessAssets);
  const illiquidRatio = grossAssets ? illiquid / grossAssets : 0;
  return { heirs, insuranceExemption, taxableInsurance, grossAssets, deductions, netEstate, taxableEstate, inheritanceTaxTotal, illiquid, illiquidRatio };
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
  const spouseStatutoryShare = e.heirs.shares.find(s => s.label === "配偶者")?.share || 0;
  const spouseReliefLimit = Math.max(160000000, e.netEstate * spouseStatutoryShare);
  const spouseAcquisition = e.netEstate * spouseShare;
  const spouseRelief = spouseAcquisition <= spouseReliefLimit ? spouseTaxBefore : spouseTaxBefore * (spouseReliefLimit / Math.max(spouseAcquisition, 1));
  const firstTax = Math.max(0, totalTaxBeforeCredit - spouseRelief);

  const secondEstate = num(state.spouseOwnAssets) + spouseAcquisition;
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

function calcGift() {
  const annualTaxable = Math.max(0, num(state.annualGiftPerPerson) - 1100000);
  const annualGiftTaxPerPerson = applyRate(annualTaxable, TaxRules.giftTaxRates[state.giftRateType] || TaxRules.giftTaxRates.special);
  const totalAnnualGift = num(state.annualGiftPerPerson) * num(state.annualGiftRecipients) * num(state.annualGiftYears);
  const totalAnnualGiftTax = annualGiftTaxPerPerson * num(state.annualGiftRecipients) * num(state.annualGiftYears);

  const settlementBase = Math.max(0, num(state.settlementGift) - 1100000);
  const remainingSpecial = Math.max(0, 25000000 - num(state.settlementDeductionUsed));
  const settlementTaxable = Math.max(0, settlementBase - remainingSpecial);
  const settlementTax = Math.floor(settlementTaxable * 0.2);

  const housingLimit = state.housingType === "eco" ? 10000000 : state.housingType === "other" ? 5000000 : 0;
  const housingTaxable = Math.max(0, num(state.housingGift) - housingLimit);

  return { annualTaxable, annualGiftTaxPerPerson, totalAnnualGift, totalAnnualGiftTax, settlementBase, remainingSpecial, settlementTaxable, settlementTax, housingLimit, housingTaxable };
}

function riskClass(level) {
  return level === "高" ? "high" : level === "中" ? "mid" : "low";
}

function diagnoseRisks() {
  const e = calcEstate(state);
  const cashAfterReserve = num(state.cash) - num(state.cashReserveTarget);
  const taxRisk = e.taxableEstate > 0 ? (e.inheritanceTaxTotal > 10000000 ? "高" : "中") : "低";
  const cashRisk = e.inheritanceTaxTotal > cashAfterReserve ? "高" : e.inheritanceTaxTotal > cashAfterReserve * 0.5 ? "中" : "低";
  const splitRisk = e.illiquidRatio >= 0.7 ? "高" : e.illiquidRatio >= 0.45 ? "中" : "低";
  const secondRisk = state.hasSpouse === "yes" && num(state.spouseOwnAssets) + e.netEstate * 0.5 > e.heirs.basicDeduction ? "中" : "低";
  return { taxRisk, cashRisk, splitRisk, secondRisk };
}

function makeCard(label, value, note="") {
  const tpl = document.getElementById("cardTemplate");
  const node = tpl.content.firstElementChild.cloneNode(true);
  node.querySelector(".label").textContent = label;
  node.querySelector(".value").textContent = value;
  node.querySelector(".note").textContent = note;
  return node;
}

function renderCards(id, cards) {
  const el = document.getElementById(id);
  el.innerHTML = "";
  cards.forEach(c => el.appendChild(makeCard(c[0], c[1], c[2])));
}

function render() {
  document.querySelectorAll("[data-field]").forEach(el => {
    if (document.activeElement !== el) el.value = state[el.dataset.field] ?? "";
  });

  const e = calcEstate(state);
  const g = calcGift();
  const risks = diagnoseRisks();

  renderCards("familyResults", [
    ["法定相続人の数（税額計算用）", `${e.heirs.heirsForTax}人`, `養子算入：${e.heirs.adoptedForTax}人 / 相続順位：${e.heirs.rank}`],
    ["基礎控除額", yen(e.heirs.basicDeduction), "3,000万円 + 600万円 × 法定相続人"],
    ["法定相続分の概略", e.heirs.shares.map(s => `${s.label} ${pct(s.share)}`).join(" / "), "詳細な相続関係は別途確認"]
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
    ["相続時精算課税 贈与税概算", yen(g.settlementTax), `残特別控除 ${yen(g.remainingSpecial)}`],
    ["住宅資金贈与 非課税枠", yen(g.housingLimit), "要件・期限・証明書類の確認が必要"],
    ["住宅資金贈与 課税候補", yen(g.housingTaxable), "暦年または精算課税との関係を確認"]
  ]);

  renderCards("diagnosisResults", [
    ["正味財産", yen(e.netEstate), "概算"],
    ["課税遺産総額", yen(e.taxableEstate), "正味財産 − 基礎控除"],
    ["相続税総額 概算", yen(e.inheritanceTaxTotal), "税額控除前の概算"],
    ["現預金", yen(num(state.cash)), "納税資金候補"],
    ["納税資金不足目安", yen(Math.max(0, e.inheritanceTaxTotal - (num(state.cash) - num(state.cashReserveTarget)))), "現預金から留保目標を控除"],
    ["過去贈与加算入力額", yen(num(state.priorGiftsAddBack)), "加算対象期間・相手方を確認"]
  ]);

  const riskBand = document.getElementById("riskBand");
  riskBand.innerHTML = "";
  [
    ["相続税リスク", risks.taxRisk],
    ["納税資金リスク", risks.cashRisk],
    ["分割困難リスク", risks.splitRisk],
    ["二次相続リスク", risks.secondRisk]
  ].forEach(([label, level]) => {
    const div = document.createElement("div");
    div.className = `risk ${riskClass(level)}`;
    div.innerHTML = `<span>${label}</span><b>${level}</b>`;
    riskBand.appendChild(div);
  });

  renderSpouseScenarios();
  renderActions();
  renderSources();
  renderSummary();
}

function renderSpouseScenarios() {
  const tbody = document.querySelector("#spouseScenarioTable tbody");
  tbody.innerHTML = "";
  if (state.hasSpouse !== "yes") {
    tbody.innerHTML = `<tr><td colspan="6">配偶者なしのため、配偶者取得割合比較は対象外です。</td></tr>`;
    return;
  }
  [0, .25, .5, .75, 1].forEach(r => {
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

function renderActions() {
  const e = calcEstate(state);
  const g = calcGift();
  const risks = diagnoseRisks();
  const actions = [];

  if (risks.cashRisk !== "低") {
    actions.push(["高", "納税資金の確認", "現預金・生命保険・売却候補資産を確認してください。相続税額を下げる前に、誰が納税資金を持つかを確認する必要があります。", "life_insurance"]);
  }
  if (e.insuranceExemption > num(state.lifeInsuranceHeirs)) {
    actions.push(["中", "死亡保険金の非課税枠活用余地", `非課税枠は ${yen(e.insuranceExemption)}、相続人受取保険金は ${yen(num(state.lifeInsuranceHeirs))} です。保険証券と受取人を確認してください。`, "life_insurance"]);
  }
  if (num(state.annualGiftPerPerson) > 0 && num(state.annualGiftRecipients) > 0) {
    actions.push(["中", "暦年贈与プランの確認", `予定移転額は ${yen(g.totalAnnualGift)}、贈与税概算は ${yen(g.totalAnnualGiftTax)} です。加算対象期間と贈与契約書・資金移動の実態を確認してください。`, "annual_gift"]);
  }
  if (num(state.settlementGift) > 0) {
    actions.push(["中", "相続時精算課税の適否確認", "値上がり資産・収益資産の移転には有効な場合がありますが、一度選択すると同一贈与者からの贈与は暦年課税に戻れません。", "settlement_tax"]);
  }
  if (state.homePlanChild === "yes" || num(state.housingGift) > 0) {
    actions.push(["中", "住宅取得等資金贈与の要件確認", "取得期限、居住期限、省エネ等住宅の証明書類、受贈者の所得要件などを確認してください。", "housing_gift"]);
  }
  if (state.spouseHomeGift === "possible") {
    actions.push(["中", "夫婦間居住用不動産贈与の検討", "婚姻期間20年以上、居住要件、一生に一度の制限、登記費用・不動産取得税も確認してください。", "spouse_home_gift"]);
  }
  if (e.illiquidRatio >= .45) {
    actions.push(["高", "分割困難資産の整理", "不動産・非上場株式比率が高いです。遺言、代償金、保険、売却候補、共有回避を検討してください。", "tool_disclaimer"]);
  }
  if (state.hasSpouse === "yes") {
    actions.push(["中", "一次・二次相続のバランス検討", "配偶者税額軽減だけで一次相続税を抑えると、二次相続で税額・分割・納税資金の問題が残る可能性があります。", "spouse_relief"]);
  }
  if (!actions.length) {
    actions.push(["低", "追加ヒアリング", "現時点の入力では大きな警戒フラグは出ていません。過去贈与、不動産評価、保険証券、家族の意向を確認してください。", "tool_disclaimer"]);
  }

  const wrap = document.getElementById("actionList");
  wrap.innerHTML = "";
  actions.forEach(([level, title, body, source]) => {
    const div = document.createElement("article");
    div.className = "action";
    div.innerHTML = `
      <span class="tag ${riskClass(level)}">${level}</span>
      <strong>${title}</strong>
      <p>${body}</p>
      <button type="button" class="source-btn" data-source="${source}">根拠を見る</button>
    `;
    wrap.appendChild(div);
  });
}

function renderSources() {
  const wrap = document.getElementById("sourceList");
  wrap.innerHTML = "";
  Object.entries(TaxRules.sources).forEach(([key, s]) => {
    const div = document.createElement("article");
    div.className = "source-item";
    div.innerHTML = `
      <h3>${s.title}</h3>
      <p>${s.summary}</p>
      <p>使用箇所：${(s.usage || []).join("、")}</p>
      ${s.url ? `<a href="${s.url}" target="_blank" rel="noopener">根拠ページを開く</a>` : `<span>内部注意事項</span>`}
      <div><button type="button" class="source-btn" data-source="${key}">詳細</button></div>
    `;
    wrap.appendChild(div);
  });
}

function renderSummary() {
  const e = calcEstate(state);
  const r = diagnoseRisks();
  document.getElementById("liveSummary").innerHTML = `
    <div class="mini"><span>正味財産</span><b>${yen(e.netEstate)}</b></div>
    <div class="mini"><span>基礎控除</span><b>${yen(e.heirs.basicDeduction)}</b></div>
    <div class="mini"><span>相続税総額概算</span><b>${yen(e.inheritanceTaxTotal)}</b></div>
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
      <div><strong>根拠：</strong>${s.sourceTitle || "内部運用方針"}</div>
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
  document.querySelectorAll("[data-field]").forEach(el => {
    state[el.dataset.field] = el.value;
  });
}

document.addEventListener("input", e => {
  if (e.target.matches("[data-field]")) {
    collectStateFromInputs();
    render();
  }
});
document.addEventListener("change", e => {
  if (e.target.matches("[data-field]")) {
    collectStateFromInputs();
    render();
  }
});
document.addEventListener("click", e => {
  const tab = e.target.closest(".tab");
  if (tab) {
    document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
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
  state = { ...defaults, ...JSON.parse(saved) };
  render();
});
document.getElementById("exportBtn").addEventListener("click", () => {
  collectStateFromInputs();
  const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), state }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `資産承継面談_${state.caseName || "案件"}_${new Date().toISOString().slice(0,10)}.json`;
  a.click();
  URL.revokeObjectURL(a.href);
});
document.getElementById("importFile").addEventListener("change", async e => {
  const file = e.target.files?.[0];
  if (!file) return;
  const text = await file.text();
  const parsed = JSON.parse(text);
  state = { ...defaults, ...(parsed.state || parsed) };
  render();
});

render();
