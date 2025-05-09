import { getSolanaPrice } from '$lib/server/coingecko-server';
import { json } from '@sveltejs/kit';

export async function GET() {
    try {
        const price = await getSolanaPrice();
        return json({ price });
    } catch (error) {
        return json({ error: 'Failed to fetch Solana price' }, { status: 500 });
    }
}