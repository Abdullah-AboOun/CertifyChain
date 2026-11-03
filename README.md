# 🎓 Blockchain Certificate Registry

A decentralized certificate issuance and verification platform built with Next.js, Ethereum smart contracts, and tRPC. Issue, manage, and verify tamper-proof digital certificates on the blockchain.

## ✨ Features

- 🔐 **Web3 Authentication** - MetaMask wallet-based authentication
- 📜 **Certificate Issuance** - Issue blockchain-verified certificates with metadata
- 🔍 **Public Verification** - Anyone can verify certificate authenticity
- 🏢 **Entity Management** - Organizations register as certificate issuers
- ⚡ **Revocation System** - Revoke certificates with on-chain proof
- 🎨 **Modern UI** - Responsive design with dark/light mode

## 🛠️ Tech Stack

**Frontend:** Next.js 15, React 19, TypeScript, Tailwind CSS, Shadcn/ui  
**Backend:** tRPC, Prisma, NextAuth.js, SQLite  
**Blockchain:** Solidity 0.8.28, Hardhat, Ethers.js v6

## 🚀 Quick Start

### First Time Setup

```bash
# Install dependencies (only needed once)
./setup.sh

# Start the application
./start.sh
```

### Subsequent Runs

```bash
./start.sh
```

This will start the blockchain, deploy contracts, set up the database, and launch the app at http://localhost:3000

### Manual Setup

```bash
# 1. Install dependencies
cd hardhat && pnpm install
cd ../blockchain_project && pnpm install
cd ..

# 2. Start Hardhat node (terminal 1)
cd hardhat && npx hardhat node

# 3. Deploy contract (terminal 2)
cd hardhat && npx hardhat ignition deploy ./ignition/modules/CertificateRegistry.ts --network localhost

# 4. Setup environment
cd blockchain_project
cp .env.example .env
# Edit .env with contract address and generate AUTH_SECRET

# 5. Setup database
pnpm prisma generate && pnpm prisma db push

# 6. Start app
pnpm dev
```

## 📖 Usage

### Setup MetaMask
1. Add Hardhat Local Network
   - RPC: http://localhost:8545
   - Chain ID: 31337
2. Import Hardhat's default test account #0 (a public, well-known key; never use it on a real network): `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

### Issue Certificates
1. Connect wallet and register entity (0.0001 ETH fee)
2. Issue certificates with recipient details (0.00005 ETH fee)
3. View and manage certificates in dashboard

### Verify Certificates
Visit `/verify` and enter certificate ID to verify authenticity

## 📂 Project Structure

```
├── hardhat/                    # Smart contracts
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   └── ignition/modules/
└── blockchain_project/         # Next.js app
    ├── src/
    │   ├── app/               # Pages (dashboard, verify, auth)
    │   ├── lib/web3/          # Blockchain utilities
    │   └── server/api/        # tRPC routers
    └── prisma/                # Database schema
```

## 📝 License

[MIT](LICENSE)

---

Built with ❤️ using Next.js, Solidity, and the T3 Stack
