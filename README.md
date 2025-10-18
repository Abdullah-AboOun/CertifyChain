# CertifyChain - Blockchain Certificate Management Platform

A comprehensive platform for secure certificate issuance, verification, and management using blockchain technology.

## 🎯 Features

- **Blockchain Security**: Immutable certificate records stored on Ethereum blockchain
- **Entity Registration**: Organizations can register as certificate issuers
- **Certificate Issuance**: Issue certificates to recipients with blockchain verification
- **Instant Verification**: Public certificate verification by ID
- **Revocation Control**: Issuers can revoke certificates when needed
- **Web3 Integration**: Wallet-based authentication using MetaMask
- **Modern UI**: Beautiful, responsive interface with dark/light mode

## 🏗️ Tech Stack

### Smart Contract (Hardhat)
- Solidity ^0.8.28
- Hardhat for development and deployment
- Local Ethereum network for testing

### Backend (T3 Stack)
- **Next.js 15** - React framework
- **tRPC** - End-to-end typesafe APIs
- **Prisma** - Database ORM with SQLite
- **NextAuth.js** - Wallet-based authentication

### Frontend
- **React 19** - UI library
- **TailwindCSS** - Styling
- **shadcn/ui** - UI components
- **Ethers.js** - Blockchain interaction
- **Lucide React** - Icons
- **next-themes** - Dark/light mode

## 📋 Prerequisites

- Node.js 18+ and pnpm
- MetaMask or another Web3 wallet browser extension

## 🚀 Quick Start

### Option 1: Automated Startup (Recommended)

Simply run the startup script from the project root:

\`\`\`bash
./start.sh
\`\`\`

This script will:
1. Start a local Hardhat blockchain node
2. Deploy the CertificateRegistry smart contract
3. Set up the database
4. Start the Next.js development server

### Option 2: Manual Setup

#### 1. Start Local Blockchain

\`\`\`bash
cd hardhat
pnpm install
npx hardhat node
\`\`\`

Keep this terminal running.

#### 2. Deploy Smart Contract

In a new terminal:

\`\`\`bash
cd hardhat
npx hardhat ignition deploy ./ignition/modules/CertificateRegistry.ts --network localhost
\`\`\`

Copy the deployed contract address.

#### 3. Configure Environment

\`\`\`bash
cd blockchain_project
cp .env.example .env
\`\`\`

Edit \`.env\` and update:
- \`NEXT_PUBLIC_CONTRACT_ADDRESS\` with your deployed contract address
- \`NEXT_PUBLIC_RPC_URL="http://localhost:8545"\`
- Generate \`AUTH_SECRET\` with: \`openssl rand -base64 32\`

#### 4. Setup Database

\`\`\`bash
cd blockchain_project
pnpm install
pnpm prisma generate
pnpm prisma db push
\`\`\`

#### 5. Start the Application

\`\`\`bash
pnpm dev
\`\`\`

Visit http://localhost:3000

## 🔧 Configuration

### MetaMask Setup

1. Open MetaMask and add a new network:
   - **Network Name**: Hardhat Local
   - **RPC URL**: http://localhost:8545
   - **Chain ID**: 31337
   - **Currency Symbol**: ETH

2. Import a test account using one of the private keys from Hardhat:
   - Private Key: \`0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80\`
   - This account will have 10,000 test ETH

### Smart Contract Details

- **Registration Fee**: 0.01 ETH
- **Certificate Issuance Fee**: 0.005 ETH
- These can be updated by the contract owner

## 📱 Usage Guide

### For Issuing Entities

1. **Connect Wallet**
   - Click "Connect Wallet" in the navbar
   - Approve the connection in MetaMask
   - Sign the authentication message

2. **Register as Entity**
   - Go to Dashboard
   - Click "Register Now"
   - Enter your organization name and description
   - Pay the registration fee (0.01 ETH)
   - Confirm the transaction in MetaMask

3. **Issue Certificates**
   - Click "Issue Certificate" in the dashboard
   - Fill in recipient details and certificate hash
   - Add metadata (optional JSON)
   - Pay the issuance fee (0.005 ETH)
   - Confirm the transaction

4. **Manage Certificates**
   - View all issued certificates in the dashboard
   - Revoke certificates if needed
   - Track certificate status

### For Certificate Verification

1. Navigate to the "Verify Certificate" page
2. Enter the certificate ID
3. View full certificate details and verification status
4. Check if the certificate is valid or revoked

## 🗂️ Project Structure

\`\`\`
.
├── hardhat/                    # Smart contract project
│   ├── contracts/
│   │   └── CertificateRegistry.sol
│   ├── ignition/modules/
│   │   └── CertificateRegistry.ts
│   └── hardhat.config.ts
│
├── blockchain_project/         # T3 application
│   ├── prisma/
│   │   └── schema.prisma       # Database schema
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx        # Landing page
│   │   │   ├── verify/         # Certificate verification
│   │   │   ├── dashboard/      # Entity dashboard
│   │   │   └── auth/signin/    # Wallet auth
│   │   ├── components/
│   │   │   ├── navbar.tsx      # Navigation bar
│   │   │   └── theme-provider.tsx
│   │   ├── lib/web3/
│   │   │   ├── contract.ts     # Web3 utilities
│   │   │   └── contract-abi.ts # Contract ABI
│   │   └── server/
│   │       ├── api/routers/
│   │       │   ├── certificate.ts
│   │       │   └── entity.ts
│   │       └── auth/config.ts
│   └── next.config.js
│
└── start.sh                    # Automated startup script
\`\`\`

## 🔐 Security Features

- **Blockchain Immutability**: All certificate records are permanently stored on-chain
- **Wallet Authentication**: Secure signature-based authentication
- **Access Control**: Only issuers can manage their certificates
- **Transparent Verification**: Anyone can verify certificate authenticity
- **Revocation Tracking**: All revocations are recorded on-chain

## 🛠️ Development

### Run Tests

\`\`\`bash
cd hardhat
npx hardhat test
\`\`\`

### Database Management

\`\`\`bash
cd blockchain_project
pnpm prisma studio    # Open Prisma Studio GUI
pnpm db:push         # Push schema changes
pnpm db:generate     # Regenerate Prisma client
\`\`\`

### Code Formatting

\`\`\`bash
cd blockchain_project
pnpm format:write    # Format code
pnpm lint           # Run linter
\`\`\`

## 📄 Smart Contract Functions

### Public Functions
- \`registerEntity(name)\` - Register as an issuing entity
- \`issueCertificate(hash, recipient, metadata)\` - Issue a new certificate
- \`revokeCertificate(id)\` - Revoke a certificate
- \`verifyCertificate(id)\` - Verify certificate details
- \`getEntityInfo(address)\` - Get entity information
- \`getEntityCertificates(address)\` - Get all certificates from an entity

### View Functions
- \`isRegisteredEntity(address)\` - Check if address is registered
- \`registrationFee()\` - Get current registration fee
- \`certificateIssuanceFee()\` - Get current issuance fee

## 🤝 Contributing

This is a demonstration project. Feel free to fork and modify for your needs.

## 📝 License

MIT License - feel free to use this project for learning or as a foundation for your own certificate management system.

## 🙏 Acknowledgments

Built with:
- [T3 Stack](https://create.t3.gg/)
- [Hardhat](https://hardhat.org/)
- [Next.js](https://nextjs.org/)
- [Prisma](https://www.prisma.io/)
- [TailwindCSS](https://tailwindcss.com/)

---

Made with ❤️ for secure certificate management on the blockchain
