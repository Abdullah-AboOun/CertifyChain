# 🚀 CertifyChain - Quick Start Guide

## ✅ Project Complete!

Your blockchain certificate management platform is ready to run. Here's what has been built:

### 📦 What's Included

1. **Smart Contract** (`hardhat/contracts/CertificateRegistry.sol`)
   - Entity registration with fees
   - Certificate issuance and revocation
   - On-chain verification
   - Fee management

2. **T3 Application** (`blockchain_project/`)
   - Landing page with features overview
   - Wallet-based authentication
   - Entity registration flow
   - Certificate issuance dashboard
   - Public verification page
   - Dark/light mode theme
   - Responsive design

3. **Database** (SQLite with Prisma)
   - User management
   - Entity profiles
   - Certificate records

## 🎯 How to Run

### Option 1: One-Command Start (Recommended)

```bash
cd /home/abdullah/dev/t3app
./start.sh
```

This will:
- Start local blockchain (port 8545)
- Deploy smart contract
- Setup database
- Start Next.js app (port 3000)

### Option 2: Manual Start

**Terminal 1 - Blockchain:**
```bash
cd hardhat
pnpm hardhat node
```

**Terminal 2 - Deploy Contract:**
```bash
cd hardhat
pnpm hardhat ignition deploy ./ignition/modules/CertificateRegistry.ts --network localhost
# Copy the contract address from output
```

**Terminal 3 - Web App:**
```bash
cd blockchain_project
# Add contract address to .env
echo 'NEXT_PUBLIC_CONTRACT_ADDRESS="0x..."' >> .env
echo 'NEXT_PUBLIC_RPC_URL="http://localhost:8545"' >> .env

# Setup database
pnpm prisma generate
pnpm prisma db push

# Start app
pnpm dev
```

## 🦊 MetaMask Setup

1. **Add Local Network:**
   - Network Name: `Hardhat Local`
   - RPC URL: `http://localhost:8545`
   - Chain ID: `31337`
   - Currency: `ETH`

2. **Import Test Account:**
   - Private Key: `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`
   - This gives you 10,000 test ETH

## 📱 Application URLs

- **Web App:** http://localhost:3000
- **Blockchain RPC:** http://localhost:8545
- **Prisma Studio:** `cd blockchain_project && pnpm db:studio`

## 🎮 Testing the App

1. **Open** http://localhost:3000
2. **Click** "Connect Wallet" and sign the message
3. **Register** as an issuing entity (costs 0.01 ETH)
4. **Issue** a certificate (costs 0.005 ETH):
   - Recipient: Any Ethereum address
   - Hash: Any string (e.g., "QmX..." for IPFS)
   - Metadata: JSON string (optional)
5. **Verify** certificate by ID on the verify page
6. **Revoke** certificate from dashboard

## 📋 Pages

- `/` - Landing page
- `/auth/signin` - Wallet connection
- `/dashboard` - Entity dashboard (protected)
- `/verify` - Public certificate verification

## 🛠️ Development Commands

```bash
# In blockchain_project/

pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm lint             # Run linter
pnpm typecheck        # Check types
pnpm db:studio        # Open database GUI
pnpm db:push          # Update database schema

# In hardhat/

pnpm hardhat node     # Start local blockchain
pnpm hardhat compile  # Compile contracts
pnpm hardhat test     # Run tests
```

## 🔑 Test Accounts

Hardhat provides 20 test accounts. Here are the first two:

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

## 💰 Fees

- **Registration Fee:** 0.01 ETH
- **Issuance Fee:** 0.005 ETH

(These can be changed by the contract owner)

## 🔧 Troubleshooting

**Port already in use:**
```bash
# Kill processes
lsof -ti:3000 | xargs kill -9
lsof -ti:8545 | xargs kill -9
```

**Reset MetaMask:**
Settings → Advanced → Reset Account

**Reset Database:**
```bash
cd blockchain_project
rm -f prisma/db.sqlite*
pnpm prisma db push
```

**Contract not deploying:**
- Make sure Hardhat node is running
- Check hardhat.log for errors

## 📚 Tech Stack

- **Smart Contract:** Solidity, Hardhat
- **Frontend:** Next.js 15, React 19
- **Styling:** Tailwind CSS, Lucide Icons
- **Database:** SQLite, Prisma ORM
- **API:** tRPC
- **Auth:** NextAuth.js with Web3
- **Web3:** ethers.js

## 🎉 You're All Set!

Run `./start.sh` and enjoy your blockchain certificate platform!

For detailed documentation, see README.md
