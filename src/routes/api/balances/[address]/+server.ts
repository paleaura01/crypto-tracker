import { json } from '@sveltejs/kit';
import {
	fetchExchangeV2,
	fetchExchangeV3,
	fetchWalletBalances
} from '$lib/services/coinbaseClient';

export const GET = async () => {
	const [v2, v3, wallet] = await Promise.all([
		fetchExchangeV2(),
		fetchExchangeV3(),
		fetchWalletBalances()
	]);
	return json({ v2, v3, wallet });
};
