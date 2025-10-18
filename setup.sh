#!/bin/bash

# Complete setup script - run this once before starting the application

echo "🔧 CertifyChain - Complete Setup"
echo "================================="
echo ""

cd "$(dirname "$0")"

# Step 1: Install dependencies
echo "📦 Installing dependencies..."
echo ""

echo "  → Installing Hardhat dependencies..."
cd hardhat
pnpm install --silent
cd ..

echo "  → Installing T3 app dependencies..."
cd blockchain_project
pnpm install --silent
cd ..

echo ""
echo "✅ Dependencies installed"
echo ""

# Step 2: Setup database
echo "🗄️  Setting up database..."
cd blockchain_project

# Generate Prisma client
pnpm prisma generate > /dev/null 2>&1

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "  → Creating .env file..."
    cat > .env << 'EOF'
DATABASE_URL="file:./db.sqlite"
NEXT_PUBLIC_CONTRACT_ADDRESS=""
NEXT_PUBLIC_RPC_URL="http://localhost:8545"
AUTH_SECRET="generated-secret-$(openssl rand -hex 32)"
EOF
fi

# Push database schema
pnpm prisma db push --accept-data-loss > /dev/null 2>&1

cd ..

echo "✅ Database setup complete"
echo ""

# Step 3: Instructions
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Setup Complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "🚀 To start the application, run:"
echo "   ./start.sh"
echo ""
echo "📖 For detailed instructions, see:"
echo "   • QUICKSTART.md - Quick start guide"
echo "   • README.md - Full documentation"
echo ""
echo "🦊 For MetaMask setup:"
echo "   ./setup-metamask.sh"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
