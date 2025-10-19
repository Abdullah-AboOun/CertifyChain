#!/bin/bash

# CertifyChain Startup Script
# This script starts the local blockchain, deploys the smart contract, and runs the T3 app

echo "🚀 Starting CertifyChain..."
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
HARDHAT_DIR="$SCRIPT_DIR/hardhat"
T3_DIR="$SCRIPT_DIR/blockchain_project"

# Step 1: Start Hardhat local blockchain in the background
echo -e "${BLUE}📡 Step 1: Starting local Hardhat blockchain...${NC}"
cd "$HARDHAT_DIR"

# Kill any existing Hardhat node
pkill -f "hardhat node" 2>/dev/null

# Start Hardhat node in the background
npx hardhat node > /tmp/hardhat-node.log 2>&1 &
HARDHAT_PID=$!

echo "Waiting for Hardhat node to start..."
sleep 5

if ps -p $HARDHAT_PID > /dev/null; then
   echo -e "${GREEN}✅ Hardhat node started (PID: $HARDHAT_PID)${NC}"
else
   echo -e "${RED}❌ Failed to start Hardhat node${NC}"
   exit 1
fi

echo ""

# Step 2: Deploy the smart contract
echo -e "${BLUE}📝 Step 2: Deploying CertificateRegistry contract...${NC}"
cd "$HARDHAT_DIR"

# Deploy using Hardhat Ignition
DEPLOY_OUTPUT=$(npx hardhat ignition deploy ./ignition/modules/CertificateRegistry.ts --network localhost 2>&1)

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Contract deployed successfully${NC}"
    
    # Extract contract address from deployment output
    CONTRACT_ADDRESS=$(echo "$DEPLOY_OUTPUT" | grep -o '0x[a-fA-F0-9]\{40\}' | head -1)
    
    if [ -n "$CONTRACT_ADDRESS" ]; then
        echo -e "${GREEN}📍 Contract Address: $CONTRACT_ADDRESS${NC}"
        
        # Update .env file in T3 project
        cd "$T3_DIR"
        
        # Check if .env exists, if not copy from .env.example
        if [ ! -f ".env" ]; then
            cp .env.example .env
        fi
        
        # Update contract address in .env
        if grep -q "NEXT_PUBLIC_CONTRACT_ADDRESS" .env; then
            sed -i.bak "s|NEXT_PUBLIC_CONTRACT_ADDRESS=.*|NEXT_PUBLIC_CONTRACT_ADDRESS=\"$CONTRACT_ADDRESS\"|" .env
        else
            echo "NEXT_PUBLIC_CONTRACT_ADDRESS=\"$CONTRACT_ADDRESS\"" >> .env
        fi
        
        # Ensure RPC URL is set
        if ! grep -q "NEXT_PUBLIC_RPC_URL" .env; then
            echo 'NEXT_PUBLIC_RPC_URL="http://localhost:8545"' >> .env
        fi
        
        echo -e "${GREEN}✅ Updated .env with contract address${NC}"
    fi
else
    echo -e "${RED}❌ Contract deployment failed${NC}"
    echo "$DEPLOY_OUTPUT"
    kill $HARDHAT_PID
    exit 1
fi

echo ""

# Step 3: Setup T3 database
echo -e "${BLUE}💾 Step 3: Setting up database...${NC}"
cd "$T3_DIR"

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from example...${NC}"
    if [ -f ".env.example" ]; then
        cp .env.example .env
    else
        echo -e "${RED}❌ No .env.example found. Please run ./setup.sh first${NC}"
        kill $HARDHAT_PID
        exit 1
    fi
fi

# Check if database exists
DB_PATH="./prisma/db.sqlite"
if [ ! -f "$DB_PATH" ]; then
    echo -e "${YELLOW}Database not found. Creating new database...${NC}"
    
    # Generate Prisma client
    echo "  → Generating Prisma client..."
    pnpm prisma generate > /dev/null 2>&1
    
    # Create database with schema
    echo "  → Creating database with schema..."
    pnpm prisma db push --accept-data-loss > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database created successfully${NC}"
    else
        echo -e "${RED}❌ Failed to create database${NC}"
        kill $HARDHAT_PID
        exit 1
    fi
else
    echo -e "${GREEN}Database found. Checking schema...${NC}"
    
    # Ensure Prisma client is generated
    pnpm prisma generate > /dev/null 2>&1
    
    # Sync schema (non-destructive)
    pnpm prisma db push > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Database schema is up to date${NC}"
    else
        echo -e "${YELLOW}⚠️  Database schema sync had warnings${NC}"
    fi
fi

echo ""

# Step 4: Start the T3 application
echo -e "${BLUE}🌐 Step 4: Starting T3 application...${NC}"
cd "$T3_DIR"

echo ""
echo -e "${GREEN}╔════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║     CertifyChain is now running! 🎉       ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}📍 Application:${NC}     http://localhost:3000"
echo -e "${BLUE}📍 Blockchain RPC:${NC}  http://localhost:8545"
echo -e "${BLUE}📍 Contract:${NC}        $CONTRACT_ADDRESS"
echo ""
echo -e "${YELLOW}💡 Test Accounts:${NC}"
echo -e "   Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266"
echo -e "   Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80"
echo ""
echo -e "${YELLOW}📚 Next Steps:${NC}"
echo "   1. Open http://localhost:3000 in your browser"
echo "   2. Connect your MetaMask wallet"
echo "   3. Add localhost network (Chain ID: 31337, RPC: http://localhost:8545)"
echo "   4. Import a test account using the private key above"
echo ""
echo -e "${RED}Press Ctrl+C to stop all services${NC}"
echo ""

# Start the development server
pnpm dev

# Cleanup on exit
trap "echo ''; echo '🛑 Shutting down...'; kill $HARDHAT_PID 2>/dev/null; exit" INT TERM

wait
