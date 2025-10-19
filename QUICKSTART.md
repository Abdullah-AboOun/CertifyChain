# 🚀 CertifyChain - Quick Start Guide

## 🎯 How to Run

### Automated Setup (Recommended)

```bash
./start.sh
```

This will start the blockchain, deploy contracts, setup database, and launch the app at http://localhost:3000

### Manual Setup

```bash
# Terminal 1 - Start blockchain
cd hardhat && pnpm hardhat node

# Terminal 2 - Deploy contract
cd hardhat && pnpm hardhat ignition deploy ./ignition/modules/CertificateRegistry.ts --network localhost

# Terminal 3 - Start app
cd blockchain_project
# Update .env with contract address
pnpm prisma generate && pnpm prisma db push
pnpm dev
```

## 🦊 MetaMask Setup

### Add Hardhat Network
- **Network Name:** Hardhat Local
- **RPC URL:** http://localhost:8545
- **Chain ID:** 31337
- **Currency:** ETH

### Import Test Account
Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`

✅ This gives you 10,000 test ETH

## 🎮 Usage

1. Open http://localhost:3000
2. Connect wallet and sign message
3. Register as entity (0.01 ETH)
4. Issue certificates (0.005 ETH each)
5. Verify certificates at `/verify`

## 🔑 Test Accounts

**Account #0:**
```
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
Private: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
```

**Account #1:**
```
Address: 0x70997970C51812dc3A010C7d01b50e0d17dc79C8
Private: 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d
```

##  Troubleshooting

**Reset MetaMask:** Settings → Advanced → Reset Account

**Reset Database:**
```bash
cd blockchain_project && rm -f prisma/db.sqlite* && pnpm prisma db push
```

**Kill Ports:**
```bash
lsof -ti:3000 | xargs kill -9  # App
lsof -ti:8545 | xargs kill -9  # Blockchain
```

## 📚 Tech Stack

Next.js 15 • React 19 • TypeScript • Tailwind CSS • Solidity • Hardhat • Ethers.js • Prisma • tRPC

---

See README.md for detailed documentation
