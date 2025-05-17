# CryptoTracker 🚀

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](#license) [![SvelteKit](https://img.shields.io/badge/Built%20with-SvelteKit-blueviolet.svg)](https://kit.svelte.dev/) [![Supabase](https://img.shields.io/badge/Auth-Supabase-3ECF8E.svg)](https://supabase.com/) [![Solana](https://img.shields.io/badge/Blockchain-Solana-00D1B2.svg)](https://solana.com/)

> A real-time dashboard and portfolio tracker for your crypto and on-chain assets.  
> Secure authentication, admin panel, and multi-API wallet balances—all in one SvelteKit app.

---

## 🌟 Features

- **User Authentication** via Supabase (Sign up / Log in / Sign out)  
- **Admin Panel** for user management and elevated privileges  
- **Real-time Portfolio Dashboard** with price feeds and historical charts  
- **On-chain Wallet Integration**  
  - Solana (Solflare connect & airdrop)  
  - Ethereum & ERC-20 tokens via Alchemy, Infura, The Graph, Bitquery, BlockCypher  
- **Subscription Plans** (Monthly / Lifetime) paid in SOL on Solana  
- **Server-side APIs** for secure key signing (Coinbase Prime) and data fetching  
- **Dark / Light Theme** with OS-prefers-color-scheme & manual toggle  
- **Fully Typed** with TypeScript, strict settings, and SvelteKit best practices

---

## 📦 Tech Stack

| Layer            | Technology                                   |
| ---------------- | -------------------------------------------- |
| Frontend         | SvelteKit, Tailwind CSS, TypeScript          |
| Auth & Database  | Supabase (Auth Helpers + Postgres)           |
| Blockchain APIs  | Alchemy SDK, Infura, The Graph, Bitquery, BlockCypher |
| Crypto Payments  | @solana/web3.js, Solflare Wallet             |
| Coinbase Prime   | JOSE, TweetNaCl for JWT signing              |
| HTTP Clients     | Fetch API, Axios                             |
| Bundler & Tooling| Vite, ESLint, Prettier                       |

---

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 18  
- npm or Yarn  
- A Supabase project with:
  - Auth enabled (Email/Password)
  - `profiles` table with an `is_admin` boolean column  
- Solana CLI / Solflare Wallet for local airdrop testing  

### Clone & Install

```bash
git clone https://github.com/paleaura01/crypto-tracker.git
cd crypto-tracker
npm install
# or yarn
