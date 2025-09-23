import { getCurrentExchange } from './index';

export interface BinanceFilters {
  symbol: string;
  lotSize: {
    minQty: number;
    maxQty: number;
    stepSize: number;
  };
  priceFilter: {
    minPrice: number;
    maxPrice: number;
    tickSize: number;
  };
  minNotional: number;
}

const filterCache = new Map<string, BinanceFilters>();

export async function getBinanceFilters(symbol: string): Promise<BinanceFilters> {
  if (filterCache.has(symbol)) {
    return filterCache.get(symbol)!;
  }

  try {
    const exchange = getCurrentExchange();
    const exchangeInfo = await exchange.getExchangeInfo();
    
    const symbolInfo = exchangeInfo.symbols.find((s: any) => s.symbol === symbol);
    if (!symbolInfo) {
      throw new Error(`Symbol ${symbol} not found`);
    }

    const lotSizeFilter = symbolInfo.filters.find((f: any) => f.filterType === 'LOT_SIZE');
    const priceFilter = symbolInfo.filters.find((f: any) => f.filterType === 'PRICE_FILTER');
    const minNotionalFilter = symbolInfo.filters.find((f: any) => f.filterType === 'MIN_NOTIONAL');

    const filters: BinanceFilters = {
      symbol,
      lotSize: {
        minQty: parseFloat(lotSizeFilter.minQty),
        maxQty: parseFloat(lotSizeFilter.maxQty),
        stepSize: parseFloat(lotSizeFilter.stepSize)
      },
      priceFilter: {
        minPrice: parseFloat(priceFilter.minPrice),
        maxPrice: parseFloat(priceFilter.maxPrice),
        tickSize: parseFloat(priceFilter.tickSize)
      },
      minNotional: parseFloat(minNotionalFilter.minNotional)
    };

    filterCache.set(symbol, filters);
    return filters;
  } catch (error) {
    console.error(`Error fetching filters for ${symbol}:`, error);
    throw error;
  }
}

export function roundToStepSize(value: number, stepSize: number): number {
  return Math.round(value / stepSize) * stepSize;
}

export function roundToTickSize(value: number, tickSize: number): number {
  return Math.round(value / tickSize) * tickSize;
}

export function validateOrder(filters: BinanceFilters, qty: number, price: number): {
  valid: boolean;
  adjustedQty?: number;
  adjustedPrice?: number;
  errors: string[];
} {
  const errors: string[] = [];
  let adjustedQty = qty;
  let adjustedPrice = price;

  // Validate and adjust quantity
  if (qty < filters.lotSize.minQty) {
    errors.push(`Quantity ${qty} below minimum ${filters.lotSize.minQty}`);
    adjustedQty = filters.lotSize.minQty;
  }
  if (qty > filters.lotSize.maxQty) {
    errors.push(`Quantity ${qty} above maximum ${filters.lotSize.maxQty}`);
    adjustedQty = filters.lotSize.maxQty;
  }

  // Round quantity to step size
  adjustedQty = roundToStepSize(adjustedQty, filters.lotSize.stepSize);

  // Validate and adjust price
  if (price < filters.priceFilter.minPrice) {
    errors.push(`Price ${price} below minimum ${filters.priceFilter.minPrice}`);
    adjustedPrice = filters.priceFilter.minPrice;
  }
  if (price > filters.priceFilter.maxPrice) {
    errors.push(`Price ${price} above maximum ${filters.priceFilter.maxPrice}`);
    adjustedPrice = filters.priceFilter.maxPrice;
  }

  // Round price to tick size
  adjustedPrice = roundToTickSize(adjustedPrice, filters.priceFilter.tickSize);

  // Validate notional value
  const notional = adjustedQty * adjustedPrice;
  if (notional < filters.minNotional) {
    errors.push(`Notional value ${notional} below minimum ${filters.minNotional}`);
  }

  return {
    valid: errors.length === 0,
    adjustedQty,
    adjustedPrice,
    errors
  };
}

export function clearFilterCache(): void {
  filterCache.clear();
}
