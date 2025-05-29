// Enhanced price service for cryptocurrency market data
import type { 
  CryptoPrice,
  PriceHistoryEntry,
  MarketData,
  Asset,
  ApiResponse
} from '../types/index.js';
import { supabase } from '../supabaseClient.js';
import { createApiResponse, createErrorResponse, SimpleCache } from '../utils/api-helpers.js';
import { validateAssetSymbol } from '../utils/validation';

// CoinGecko API response types
interface CoinGeckoPriceData {
  usd: number;
  usd_24h_change?: number;
  usd_24h_vol?: number;
  usd_market_cap?: number;
}

// Cache for price data (5 minute TTL)
const priceCache = new SimpleCache<CryptoPrice>(5 * 60 * 1000);
const marketDataCache = new SimpleCache<MarketData>(10 * 60 * 1000);

export class PriceService {
  private static instance: PriceService;
  private readonly COINGECKO_API_BASE = 'https://api.coingecko.com/api/v3';
  private readonly COINBASE_API_BASE = 'https://api.coinbase.com/v2';

  static getInstance(): PriceService {
    if (!PriceService.instance) {
      PriceService.instance = new PriceService();
    }
    return PriceService.instance;
  }

  private constructor() {}

  /**
   * Get current price for a single cryptocurrency
   */
  async getPrice(symbol: string, forceRefresh: boolean = false): Promise<ApiResponse<CryptoPrice>> {
    try {
      if (!validateAssetSymbol(symbol)) {
        return createErrorResponse('Invalid asset symbol');
      }

      const normalizedSymbol = symbol.toLowerCase();
      const cacheKey = normalizedSymbol;

      // Check cache first unless force refresh
      if (!forceRefresh) {
        const cachedPrice = priceCache.get(cacheKey);
        if (cachedPrice) {
          return createApiResponse(cachedPrice);
        }
      }

      // Try to get from database first
      const dbPrice = await this.getPriceFromDatabase(normalizedSymbol);
      if (dbPrice.success && this.isRecentPrice(dbPrice.data.last_updated)) {
        priceCache.set(cacheKey, dbPrice.data);
        return dbPrice;
      }

      // Fetch from external API
      const apiPrice = await this.fetchPriceFromAPI(normalizedSymbol);
      if (apiPrice.success) {
        // Store in database
        await this.storePriceInDatabase(apiPrice.data);
        priceCache.set(cacheKey, apiPrice.data);
        return apiPrice;
      }

      return createErrorResponse('Failed to fetch price data');
    } catch (_error) {
      return createErrorResponse(
        _error instanceof Error ? _error.message : 'Failed to get price'
      );
    }
  }

  /**
   * Get prices for multiple cryptocurrencies
   */
  async getPrices(symbols: string[], forceRefresh: boolean = false): Promise<ApiResponse<CryptoPrice[]>> {
    try {
      if (symbols.length === 0) {
        return createApiResponse([]);
      }

      if (symbols.length > 100) {
        return createErrorResponse('Too many symbols requested (max 100)');
      }

      const normalizedSymbols = symbols.map(s => s.toLowerCase());
      const prices: CryptoPrice[] = [];
      const symbolsToFetch: string[] = [];

      // Check cache for each symbol
      if (!forceRefresh) {
        for (const symbol of normalizedSymbols) {
          const cachedPrice = priceCache.get(symbol);
          if (cachedPrice) {
            prices.push(cachedPrice);
          } else {
            symbolsToFetch.push(symbol);
          }
        }
      } else {
        symbolsToFetch.push(...normalizedSymbols);
      }

      // Fetch missing prices
      if (symbolsToFetch.length > 0) {
        const fetchedPrices = await this.fetchMultiplePricesFromAPI(symbolsToFetch);
        if (fetchedPrices.success) {
          prices.push(...fetchedPrices.data);
          
          // Cache the fetched prices
          for (const price of fetchedPrices.data) {
            priceCache.set(price.symbol.toLowerCase(), price);
          }

          // Store in database
          await this.storeMultiplePricesInDatabase(fetchedPrices.data);
        }
      }

      return createApiResponse(prices);
    } catch (_error) {
      return createErrorResponse(
        _error instanceof Error ? _error.message : 'Failed to get prices'
      );
    }
  }

  /**
   * Get price history for a cryptocurrency
   */
  async getPriceHistory(
    symbol: string,
    days: number = 30
  ): Promise<ApiResponse<PriceHistoryEntry[]>> {
    try {
      if (!validateAssetSymbol(symbol)) {
        return createErrorResponse('Invalid asset symbol');
      }

      if (days < 1 || days > 365) {
        return createErrorResponse('Days must be between 1 and 365');
      }

      const normalizedSymbol = symbol.toLowerCase();

      // Get asset ID
      const { data: asset } = await supabase
        .from('assets')
        .select('id')
        .eq('symbol', normalizedSymbol.toUpperCase())
        .single();

      if (!asset) {
        return createErrorResponse('Asset not found');
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - days);

      // Query price history
      const { data: history, error } = await supabase
        .from('price_history')
        .select('price_usd, volume_24h, market_cap, timestamp')
        .eq('asset_id', asset.id)
        .gte('timestamp', startDate.toISOString())
        .lte('timestamp', endDate.toISOString())
        .order('timestamp', { ascending: true });

      if (error) {
        return createErrorResponse(error.message);
      }      const priceHistory: PriceHistoryEntry[] = (history || []).map(entry => ({
        symbol: symbol,
        timestamp: new Date(entry.timestamp).getTime(),
        price_usd: entry.price_usd,
        volume_24h: entry.volume_24h || 0,
        market_cap: entry.market_cap || 0
      }));

      return createApiResponse(priceHistory);
    } catch (_error) {
      return createErrorResponse(
        _error instanceof Error ? _error.message : 'Failed to get price history'
      );
    }
  }

  /**
   * Get market data for a cryptocurrency
   */
  async getMarketData(symbol: string, forceRefresh: boolean = false): Promise<ApiResponse<MarketData>> {
    try {
      if (!validateAssetSymbol(symbol)) {
        return createErrorResponse('Invalid asset symbol');
      }

      const normalizedSymbol = symbol.toLowerCase();
      const cacheKey = `market_${normalizedSymbol}`;

      // Check cache first
      if (!forceRefresh) {
        const cachedData = marketDataCache.get(cacheKey);
        if (cachedData) {
          return createApiResponse(cachedData);
        }
      }

      // Fetch from API
      const marketData = await this.fetchMarketDataFromAPI(normalizedSymbol);
      if (marketData.success) {
        marketDataCache.set(cacheKey, marketData.data);
        return marketData;
      }

      return createErrorResponse('Failed to fetch market data');
    } catch (_error) {
      return createErrorResponse(
        _error instanceof Error ? _error.message : 'Failed to get market data'
      );
    }
  }

  /**
   * Search for cryptocurrencies
   */
  async searchAssets(query: string, limit: number = 10): Promise<ApiResponse<Asset[]>> {
    try {
      if (!query || query.length < 2) {
        return createErrorResponse('Search query must be at least 2 characters');
      }

      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .or(`symbol.ilike.%${query}%,name.ilike.%${query}%`)
        .eq('status', 'active')
        .limit(limit)
        .order('market_cap_rank', { ascending: true, nullsFirst: false });

      if (error) {
        return createErrorResponse(error.message);
      }

      return createApiResponse(assets || []);
    } catch (_error) {
      return createErrorResponse(
        _error instanceof Error ? _error.message : 'Failed to search assets'
      );
    }
  }

  /**
   * Get trending cryptocurrencies
   */
  async getTrendingAssets(limit: number = 10): Promise<ApiResponse<Asset[]>> {
    try {
      const { data: assets, error } = await supabase
        .from('assets')
        .select('*')
        .eq('status', 'active')
        .not('market_cap_rank', 'is', null)
        .order('market_cap_rank', { ascending: true })
        .limit(limit);

      if (error) {
        return createErrorResponse(error.message);
      }

      return createApiResponse(assets || []);
    } catch (_error) {
      return createErrorResponse(
        _error instanceof Error ? _error.message : 'Failed to get trending assets'
      );
    }
  }

  /**
   * Private helper methods
   */
  private async getPriceFromDatabase(symbol: string): Promise<ApiResponse<CryptoPrice>> {
    try {
      const { data: price, error } = await supabase
        .from('price_history')
        .select(`
          price_usd,
          volume_24h,
          timestamp,
          assets!inner(symbol, name)
        `)
        .eq('assets.symbol', symbol.toUpperCase())
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (error || !price) {
        return createErrorResponse('Price not found in database');
      }      const cryptoPrice: CryptoPrice = {
        symbol: symbol.toUpperCase(),
        name: price.assets[0]?.name || symbol,
        price_usd: price.price_usd,
        price_change_24h: 0, // Default value as this might not be available
        last_updated: new Date(price.timestamp).getTime(),
        volume_24h: price.volume_24h || 0
      };      return createApiResponse(cryptoPrice);
    } catch {
      return createErrorResponse('Database query failed');
    }
  }

  private async fetchPriceFromAPI(symbol: string): Promise<ApiResponse<CryptoPrice>> {
    try {
      // Try CoinGecko first
      const coingeckoResult = await this.fetchFromCoinGecko([symbol]);
      if (coingeckoResult.success && coingeckoResult.data.length > 0 && coingeckoResult.data[0] !== undefined) {
        return createApiResponse(coingeckoResult.data[0]);
      } else if (coingeckoResult.success && coingeckoResult.data.length > 0 && coingeckoResult.data[0] === undefined) {
        return createErrorResponse('CoinGecko returned no data for symbol');
      }

      // Fallback to Coinbase
      const coinbaseResult = await this.fetchFromCoinbase(symbol);
      if (coinbaseResult.success) {
        return coinbaseResult;
      }

      return createErrorResponse('Failed to fetch from all API sources');
    } catch {
      return createErrorResponse('API fetch failed');
    }
  }

  private async fetchMultiplePricesFromAPI(symbols: string[]): Promise<ApiResponse<CryptoPrice[]>> {
    try {
      // Try CoinGecko for batch request
      const coingeckoResult = await this.fetchFromCoinGecko(symbols);
      if (coingeckoResult.success) {
        return coingeckoResult;
      }

      // Fallback to individual Coinbase requests
      const prices: CryptoPrice[] = [];
      for (const symbol of symbols) {
        const price = await this.fetchFromCoinbase(symbol);
        if (price.success) {
          prices.push(price.data);
        }
      }

      return createApiResponse(prices);
    } catch {
      return createErrorResponse('Batch API fetch failed');
    }
  }

  private async fetchFromCoinGecko(symbols: string[]): Promise<ApiResponse<CryptoPrice[]>> {
    try {
      const ids = symbols.join(',');
      const response = await fetch(
        `${this.COINGECKO_API_BASE}/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_vol=true`
      );

      if (!response.ok) {
        return createErrorResponse('CoinGecko API request failed');
      }

      const data = await response.json();
      const prices: CryptoPrice[] = [];

      for (const [id, priceData] of Object.entries(data)) {        prices.push({
          symbol: id.toUpperCase(),
          name: id,
          price_usd: (priceData as CoinGeckoPriceData).usd,
          price_change_24h: (priceData as CoinGeckoPriceData).usd_24h_change || 0,
          last_updated: Date.now(),
          volume_24h: (priceData as CoinGeckoPriceData).usd_24h_vol || 0
        });
      }

      return createApiResponse(prices);
    } catch {
      return createErrorResponse('CoinGecko fetch failed');
    }
  }

  private async fetchFromCoinbase(symbol: string): Promise<ApiResponse<CryptoPrice>> {
    try {
      const response = await fetch(
        `${this.COINBASE_API_BASE}/exchange-rates?currency=${symbol.toUpperCase()}`
      );

      if (!response.ok) {
        return createErrorResponse('Coinbase API request failed');
      }

      const data = await response.json();
      const usdRate = data.data?.rates?.USD;

      if (!usdRate) {
        return createErrorResponse('USD rate not found');
      }      const cryptoPrice: CryptoPrice = {
        symbol: symbol.toUpperCase(),
        name: symbol,
        price_usd: parseFloat(usdRate),
        price_change_24h: 0,
        last_updated: Date.now(),
        volume_24h: 0
      };

      return createApiResponse(cryptoPrice);
    } catch {
      return createErrorResponse('Coinbase fetch failed');
    }
  }

  private async fetchMarketDataFromAPI(symbol: string): Promise<ApiResponse<MarketData>> {
    try {
      const response = await fetch(
        `${this.COINGECKO_API_BASE}/coins/${symbol}`
      );

      if (!response.ok) {
        return createErrorResponse('Market data API request failed');
      }

      const data = await response.json();
      const marketData: MarketData = {
        symbol: symbol.toUpperCase(),
        name: data.name,
        current_price: data.market_data?.current_price?.usd || 0,
        market_cap: data.market_data?.market_cap?.usd || 0,
        market_cap_rank: data.market_cap_rank || 0,
        volume_24h: data.market_data?.total_volume?.usd || 0,
        price_change_24h: data.market_data?.price_change_24h || 0,
        price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
        price_change_percentage_7d: data.market_data?.price_change_percentage_7d || 0,
        price_change_percentage_30d: data.market_data?.price_change_percentage_30d || 0,
        circulating_supply: data.market_data?.circulating_supply || 0,
        total_supply: data.market_data?.total_supply,
        max_supply: data.market_data?.max_supply,
        ath: data.market_data?.ath?.usd || 0,
        ath_change_percentage: data.market_data?.ath_change_percentage?.usd || 0,
        ath_date: data.market_data?.ath_date?.usd || new Date().toISOString(),
        atl: data.market_data?.atl?.usd || 0,
        atl_change_percentage: data.market_data?.atl_change_percentage?.usd || 0,
        atl_date: data.market_data?.atl_date?.usd || new Date().toISOString(),
        last_updated: new Date().toISOString()
      };

      return createApiResponse(marketData);
    } catch {
      return createErrorResponse('Market data fetch failed');
    }
  }

  private async storePriceInDatabase(price: CryptoPrice): Promise<void> {
    try {
      // Get or create asset
      const { data: asset } = await supabase
        .from('assets')
        .select('id')
        .eq('symbol', price.symbol.toUpperCase())
        .single();

      if (asset) {
        await supabase.from('price_history').insert({
          asset_id: asset.id,
          price_usd: price.price_usd,
          volume_24h: price.volume_24h,
          timestamp: new Date(price.last_updated).toISOString()
        });
      }
    } catch {
      // console.error removed for production
    }
  }

  private async storeMultiplePricesInDatabase(prices: CryptoPrice[]): Promise<void> {
    try {
      for (const price of prices) {
        await this.storePriceInDatabase(price);
      }
    } catch {
      // console.error removed for production
    }
  }

  private isRecentPrice(timestamp: number, maxAgeMs: number = 5 * 60 * 1000): boolean {
    return Date.now() - timestamp < maxAgeMs;
  }
}

export const priceService = PriceService.getInstance();
