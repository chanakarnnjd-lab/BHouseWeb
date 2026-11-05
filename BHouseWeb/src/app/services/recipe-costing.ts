import { Ingredient } from './ingredient.service';
import { RecipeIngredient } from './recipe.service';
import { Unit } from './unit.service';

export function getUnitFactorToRoot(unitId: number, units: Unit[]): number | null {
  const unitsById = new Map(units.map((unit) => [unit.unitId, unit]));
  const visited = new Set<number>();
  let currentId = unitId;
  let factor = 1;

  while (!visited.has(currentId)) {
    visited.add(currentId);
    const unit = unitsById.get(currentId);
    if (!unit) return null;
    if (unit.parentId === null) return factor;
    if (unit.N === null || unit.N <= 0) return null;
    factor *= unit.N;
    currentId = unit.parentId;
  }

  return null;
}

export function calculateRecipeCost(
  recipeIngredients: Pick<RecipeIngredient, 'itemId' | 'quantity' | 'unitId'>[],
  inventory: Array<Pick<Ingredient, 'id' | 'price'> & {
    quantity: number | null;
    unitId: number | null;
  }>,
  units: Unit[]
): number | null {
  if (recipeIngredients.length === 0) return null;

  const inventoryById = new Map(inventory.map((ingredient) => [ingredient.id, ingredient]));
  let totalCost = 0;

  for (const recipeIngredient of recipeIngredients) {
    const stock = inventoryById.get(recipeIngredient.itemId);
    if (!stock || stock.quantity === null || stock.quantity <= 0 || stock.unitId === null || stock.price < 0) return null;

    const recipeUnitFactor = getUnitFactorToRoot(recipeIngredient.unitId, units);
    const stockUnitFactor = getUnitFactorToRoot(stock.unitId, units);
    if (recipeUnitFactor === null || stockUnitFactor === null || stockUnitFactor === 0) return null;

    const stockUnitsUsed = recipeIngredient.quantity * recipeUnitFactor / stockUnitFactor;
    totalCost += stockUnitsUsed * stock.price / stock.quantity;
  }

  return totalCost;
}

export function calculateSuggestedSellingPrice(cost: number | null, margin: number | null): number | null {
  if (cost === null || margin === null || margin < 0 || margin >= 100) return null;
  return cost / (1 - margin / 100);
}
