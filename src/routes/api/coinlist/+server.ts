import { json } from '@sveltejs/kit';
import type { RequestHandler } from '@sveltejs/kit';
import { supabaseServer } from '$lib/server/supabaseServer';

interface CoinListEntry {
  id: string;
  symbol: string;
  name: string;
  platforms?: Record<string, string>;
}

export const GET: RequestHandler = async ({ url }) => {
  try {
    const forceRefresh = url.searchParams.get('force') === 'true';
    
    // First, try to get from database (unless forcing refresh)
    if (!forceRefresh) {
      const { data: coinListData, error: fetchError } = await supabaseServer
        .from('coinlist')
        .select('*')
        .order('last_updated', { ascending: false })
        .limit(1)
        .single();

      // If we have data and it's less than 24 hours old, return it
      if (coinListData && !fetchError) {
        const lastUpdated = new Date(coinListData.last_updated);
        const now = new Date();
        const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
        
        if (hoursDiff < 24) {
          return json({
            success: true,
            data: coinListData.data
          });
        }
      }
    }

    // Data is stale or doesn't exist, fetch from CoinGecko
    const response = await fetch('https://api.coingecko.com/api/v3/coins/list?include_platform=true');
    
    if (!response.ok) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const freshData: CoinListEntry[] = await response.json();

    // Save to database
    const { error: saveError } = await supabaseServer
      .from('coinlist')
      .upsert({
        id: 'coingecko-list', // Single row identifier
        data: freshData,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'id'
      });    if (saveError) {
      // Still return the fresh data even if save failed
    }    return json({
      success: true,
      data: freshData
    });
  } catch {
    // Fallback: try to return any cached data we have, even if stale
    const { data: fallbackData } = await supabaseServer
      .from('coinlist')
      .select('data')
      .order('last_updated', { ascending: false })
      .limit(1)
      .single();

    if (fallbackData) {
      return json({
        success: true,
        data: fallbackData.data
      });
    }

    return json({
      success: false,
      error: 'Failed to fetch coinlist'
    }, { status: 500 });
  }
};
