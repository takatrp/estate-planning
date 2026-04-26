export const TaxRules = {
  meta: {
    name: "資産承継 面談ナビゲーター 税制マスタ",
    lastChecked: "2026-04-27",
    note: "国税庁タックスアンサー等の公開情報を基にした内部面談用マスタ。実行判断・申告前には必ず最新の法令・通達・個別事実を確認してください。"
  },
  sources: {
    tool_disclaimer: {
      title: "ツールの位置づけ",
      sourceTitle: "内部運用方針",
      url: "",
      lastChecked: "2026-04-27",
      summary: "本ツールは概算把握と論点整理のための内部支援ツールです。土地評価、小規模宅地等の特例、非上場株式評価、遺留分、信託・法人化などは個別検討とします。",
      usage: ["概要", "出力レポート"]
    },
    inheritance_basic: {
      title: "相続税の基礎控除・法定相続人の数",
      sourceTitle: "国税庁 No.4152 相続税の計算",
      url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/sozoku/4152.htm",
      lastChecked: "2026-04-27",
      formula: "3,000万円 + 600万円 × 法定相続人の数",
      summary: "相続税の基礎控除、養子の算入制限、課税遺産総額の基本計算に使用します。",
      usage: ["家族構成", "現状診断", "二次相続"]
    },
    inheritance_tax_rate: {
      title: "相続税の速算表",
      sourceTitle: "国税庁 No.4155 相続税の税率",
      url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/sozoku/4155.htm",
      lastChecked: "2026-04-27",
      summary: "課税遺産総額を法定相続分で按分した取得金額に速算表を適用し、相続税総額を概算します。",
      usage: ["資産構成", "現状診断"]
    },
    spouse_relief: {
      title: "配偶者の税額軽減",
      sourceTitle: "国税庁 No.4158 配偶者の税額の軽減",
      url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/sozoku/4158.htm",
      lastChecked: "2026-04-27",
      summary: "配偶者が実際に取得した正味の遺産額が、1億6千万円または法定相続分相当額のいずれか多い金額まで相続税がかからない制度です。未分割財産の扱いに注意します。",
      usage: ["現状診断", "配偶者取得割合比較"]
    },
    life_insurance: {
      title: "死亡保険金の非課税限度額",
      sourceTitle: "国税庁 No.4114 相続税の課税対象になる死亡保険金",
      url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/sozoku/4114.htm",
      lastChecked: "2026-04-27",
      formula: "500万円 × 法定相続人の数",
      summary: "被相続人が保険料を負担し、相続人が受け取る死亡保険金の非課税枠を確認します。",
      usage: ["贈与・保険", "納税資金"]
    },
    annual_gift: {
      title: "暦年課税の贈与税",
      sourceTitle: "国税庁 No.4408 贈与税の計算と税率（暦年課税）",
      url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/zoyo/4408.htm",
      lastChecked: "2026-04-27",
      formula: "1年間の贈与額 - 基礎控除110万円",
      summary: "一般税率・特例税率を区分し、年間贈与額に対する贈与税を概算します。",
      usage: ["贈与・保険", "打ち手"]
    },
    add_back_gift: {
      title: "生前贈与加算",
      sourceTitle: "国税庁 No.4161 贈与財産の加算と税額控除（暦年課税）",
      url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/sozoku/4161.htm",
      lastChecked: "2026-04-27",
      summary: "令和6年1月1日以後の暦年課税贈与は、相続開始日に応じて加算対象期間が段階的に7年へ延長されます。基礎控除以下の贈与も加算対象期間内なら加算対象になり得ます。",
      usage: ["贈与・保険", "現状診断"]
    },
    settlement_tax: {
      title: "相続時精算課税",
      sourceTitle: "国税庁 No.4103 相続時精算課税の選択",
      url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/sozoku/4103.htm",
      lastChecked: "2026-04-27",
      formula: "各年110万円控除 + 特別控除2,500万円、超過部分20%",
      summary: "令和6年以後は特定贈与者ごとに年間110万円の基礎控除があります。一度選択すると同じ贈与者からの贈与は暦年課税に戻れません。",
      usage: ["贈与・保険", "打ち手"]
    },
    spouse_home_gift: {
      title: "贈与税の配偶者控除",
      sourceTitle: "国税庁 No.4452 夫婦間で居住用不動産を贈与したときの配偶者控除",
      url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/zoyo/4452.htm",
      lastChecked: "2026-04-27",
      formula: "基礎控除110万円 + 最高2,000万円控除",
      summary: "婚姻期間20年以上、居住用不動産または取得資金、居住要件、一生に一度などの要件確認が必要です。",
      usage: ["贈与・保険", "打ち手"]
    },
    housing_gift: {
      title: "住宅取得等資金贈与の非課税",
      sourceTitle: "国税庁 No.4508 直系尊属から住宅取得等資金の贈与を受けた場合の非課税",
      url: "https://www.nta.go.jp/taxes/shiraberu/taxanswer/sozoku/4508.htm",
      lastChecked: "2026-04-27",
      summary: "令和6年1月1日から令和8年12月31日までの贈与で、一定要件を満たす場合、省エネ等住宅は1,000万円、それ以外は500万円まで非課税です。",
      usage: ["贈与・保険", "打ち手"]
    }
  },
  inheritanceTaxRates: [
    { max: 10000000, rate: 0.10, deduction: 0 },
    { max: 30000000, rate: 0.15, deduction: 500000 },
    { max: 50000000, rate: 0.20, deduction: 2000000 },
    { max: 100000000, rate: 0.30, deduction: 7000000 },
    { max: 200000000, rate: 0.40, deduction: 17000000 },
    { max: 300000000, rate: 0.45, deduction: 27000000 },
    { max: 600000000, rate: 0.50, deduction: 42000000 },
    { max: Infinity, rate: 0.55, deduction: 72000000 }
  ],
  giftTaxRates: {
    general: [
      { max: 2000000, rate: 0.10, deduction: 0 },
      { max: 3000000, rate: 0.15, deduction: 100000 },
      { max: 4000000, rate: 0.20, deduction: 250000 },
      { max: 6000000, rate: 0.30, deduction: 650000 },
      { max: 10000000, rate: 0.40, deduction: 1250000 },
      { max: 15000000, rate: 0.45, deduction: 1750000 },
      { max: 30000000, rate: 0.50, deduction: 2500000 },
      { max: Infinity, rate: 0.55, deduction: 4000000 }
    ],
    special: [
      { max: 2000000, rate: 0.10, deduction: 0 },
      { max: 4000000, rate: 0.15, deduction: 100000 },
      { max: 6000000, rate: 0.20, deduction: 300000 },
      { max: 10000000, rate: 0.30, deduction: 900000 },
      { max: 15000000, rate: 0.40, deduction: 1900000 },
      { max: 30000000, rate: 0.45, deduction: 2650000 },
      { max: 45000000, rate: 0.50, deduction: 4150000 },
      { max: Infinity, rate: 0.55, deduction: 6400000 }
    ]
  }
};
