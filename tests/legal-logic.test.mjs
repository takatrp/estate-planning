import test from "node:test";
import assert from "node:assert/strict";

import { defaults, normalizeState, getHeirInfo, calcEstate, calcGift } from "../app.js";

function input(overrides = {}) {
  return normalizeState({ ...defaults, ...overrides });
}

function zeroAssetOverrides() {
  return {
    cash: 0,
    securities: 0,
    homeProperty: 0,
    rentalProperty: 0,
    businessAssets: 0,
    otherAssets: 0,
    debts: 0,
    funeralCosts: 0,
    priorGiftsAddBack: 0,
    giftsWithin3Years: 0,
    giftsYears4to7: 0
  };
}

test("basic deduction counts only one adopted child when natural children exist", () => {
  const heirs = getHeirInfo(input({
    hasSpouse: "yes",
    childrenCount: 2,
    adoptedCount: 4,
    parentsCount: 0,
    siblingsCount: 0
  }));

  assert.equal(heirs.adoptedForTax, 1);
  assert.equal(heirs.childHeirsForTax, 3);
  assert.equal(heirs.heirsForTax, 4);
  assert.equal(heirs.basicDeduction, 54_000_000);
});

test("basic deduction counts up to two adopted children when no natural children exist", () => {
  const heirs = getHeirInfo(input({
    hasSpouse: "no",
    childrenCount: 0,
    adoptedCount: 4,
    parentsCount: 0,
    siblingsCount: 0
  }));

  assert.equal(heirs.adoptedForTax, 2);
  assert.equal(heirs.childHeirsForTax, 2);
  assert.equal(heirs.heirsForTax, 2);
  assert.equal(heirs.basicDeduction, 42_000_000);
});

test("life insurance exemption uses the adopted-child-capped statutory heir count", () => {
  const estate = calcEstate(input({
    ...zeroAssetOverrides(),
    hasSpouse: "no",
    childrenCount: 1,
    adoptedCount: 5,
    parentsCount: 0,
    siblingsCount: 0,
    lifeInsurance: 40_000_000,
    lifeInsuranceHeirs: 40_000_000
  }));

  assert.equal(estate.heirs.adoptedForTax, 1);
  assert.equal(estate.heirs.heirsForTax, 2);
  assert.equal(estate.insuranceExemption, 10_000_000);
  assert.equal(estate.taxableInsurance, 30_000_000);
});

test("life insurance exemption is limited by the heir-recipient amount", () => {
  const estate = calcEstate(input({
    ...zeroAssetOverrides(),
    hasSpouse: "yes",
    childrenCount: 2,
    adoptedCount: 0,
    parentsCount: 0,
    siblingsCount: 0,
    lifeInsurance: 20_000_000,
    lifeInsuranceHeirs: 8_000_000
  }));

  assert.equal(estate.heirs.heirsForTax, 3);
  assert.equal(estate.insuranceExemption, 8_000_000);
  assert.equal(estate.taxableInsurance, 12_000_000);
});

test("settlement taxation subtracts the annual 1.1m basic deduction before the special deduction", () => {
  const gift = calcGift(input({
    settlementGift: 30_000_000,
    settlementDeductionUsed: 0
  }));

  assert.equal(gift.settlementBase, 28_900_000);
  assert.equal(gift.remainingSpecial, 25_000_000);
  assert.equal(gift.settlementTaxable, 3_900_000);
  assert.equal(gift.settlementTax, 780_000);
});

test("settlement taxation applies only the remaining special deduction after the annual basic deduction", () => {
  const gift = calcGift(input({
    settlementGift: 2_000_000,
    settlementDeductionUsed: 24_500_000
  }));

  assert.equal(gift.settlementBase, 900_000);
  assert.equal(gift.remainingSpecial, 500_000);
  assert.equal(gift.settlementTaxable, 400_000);
  assert.equal(gift.settlementTax, 80_000);
});
