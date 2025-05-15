import type { PageServerLoad } from './$types';
import {
	fetchExchangeV2,
	fetchExchangeV3,
	fetchWalletBalances,
	fetchLoanData
} from '$lib/services/coinbaseClient';

export const load: PageServerLoad = async () => {
	const [exchangeV2, exchangeV3, wallet, loans] = await Promise.all([
		fetchExchangeV2(),
		fetchExchangeV3(),
		fetchWalletBalances(),
		fetchLoanData()
	]);

	return {
		exchangeV2,
		exchangeV3,
		wallet,
		loans
	};
};
