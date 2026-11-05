import { calculateRecipeCost, calculateSuggestedSellingPrice } from './recipe-costing';
import { Unit } from './unit.service';

describe('recipe costing', () => {
  const units: Unit[] = [
    { unitId: 1, parentId: null, unitName: 'g', N: null },
    { unitId: 2, parentId: 1, unitName: 'kg', N: 1000 }
  ];

  it('converts recipe quantities and calculates ingredient cost', () => {
    const cost = calculateRecipeCost(
      [{ itemId: 10, quantity: 1, unitId: 2 }],
      [{ id: 10, quantity: 2000, unitId: 1, price: 100 }],
      units
    );

    expect(cost).toBe(50);
  });

  it('calculates the suggested price using gross margin', () => {
    expect(calculateSuggestedSellingPrice(100, 20)).toBe(125);
  });

  it('returns no estimate when a conversion factor is missing', () => {
    const cost = calculateRecipeCost(
      [{ itemId: 10, quantity: 1, unitId: 2 }],
      [{ id: 10, quantity: 2000, unitId: 1, price: 100 }],
      [{ unitId: 1, parentId: null, unitName: 'g', N: null }, { unitId: 2, parentId: 1, unitName: 'kg', N: null }]
    );

    expect(cost).toBeNull();
  });
});
