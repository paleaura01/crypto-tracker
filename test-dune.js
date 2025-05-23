import fetch from 'node-fetch';

async function fetchMarginLoans(apiKey, apiSecret) {
  const res = await fetch('https://api.coinbase.com/v2/margin/loans', {
    headers: {
      'CB-ACCESS-KEY': apiKey,
      'CB-ACCESS-TIMESTAMP': `${Date.now()}`,
      'CB-ACCESS-SIGN': signRequest(apiSecret, /*…*/),
      'Content-Type': 'application/json'
    }
  });
  if (!res.ok) throw new Error(await res.text());
  const { data } = await res.json();
  return data.map(loan => ({
    currency: loan.currency,
    amount: loan.amount,
    loanToValue: loan.loan_to_value
  }));
}
