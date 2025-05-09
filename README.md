# Crypto Tracker

A **SvelteKit** web application that fetches and displays cryptocurrency wallet data (balances, transactions) across multiple networks using the QuickNode API.

---

## 🛠️ Features

* **Multi-chain support**: Query wallet balances for Ethereum, Osmosis, Polkadot, Polygon zkEVM, and more.
* **Responsive UI**: Built with Svelte and Tailwind CSS for a snappy experience.
* **Extensible architecture**: Easily add new RPC providers and chains.

---

## 🚀 Prerequisites

* **Node.js** v18 or higher
* **npm** or **yarn**
* **QuickNode** account with an HTTP RPC endpoint URL

---

## 📥 Getting Started

### 1. Clone the Repo

```bash
git clone https://github.com/paleaura01/crypto-tracker.git
cd crypto-tracker
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
```

### 3. Configure Environment Variables

Copy `env.example` to `.env` and set your QuickNode endpoint:

```bash
cp .env.example .env
```

Edit `.env`:

```text
VITE_QUICKNODE_URL=https://your-quicknode-endpoint
```

> **Note:** Variables prefixed with `VITE_` are exposed to the client in SvelteKit.

### 4. Run the Development Server

```bash
npm run dev -- --open
```

Open your browser to `http://localhost:5173`.

---

## 🧩 API Endpoints

* **GET** `/api/wallet-address/quicknode?address=<wallet_address>&chain=<chain_name>`

  * **chain** values: `ethereum`, `osmosis`, `polkadot`, `polygon-zkevm`, etc.
  * **response**: JSON object with balance data and token holdings.

Example:

```bash
curl "http://localhost:5173/api/wallet-address/quicknode?address=0x...&chain=ethereum"
```

---

## 📦 Build & Preview

```bash
npm run build
npm run preview
```

* **Static export**: Deploy the `build` folder to any static host (Netlify, Vercel).
* **SSR**: Use platforms like Vercel or Cloudflare Pages for server-side rendering.

---

## 🤝 Contributing

1. **Fork** the repository.
2. **Branch**: `git checkout -b feature/awesome-feature`.
3. **Commit**: `git commit -m "Add awesome feature"`.
4. **Push**: `git push origin feature/awesome-feature`.
5. **Open** a Pull Request and wait for review.

Please follow our [Code of Conduct](./CODE_OF_CONDUCT.md).

---

## 📜 License

This project is licensed under the **MIT License**. See [LICENSE](./LICENSE) for details.
