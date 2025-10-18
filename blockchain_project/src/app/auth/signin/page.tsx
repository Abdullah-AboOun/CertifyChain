"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Shield, Wallet } from "lucide-react";
import { getBrowserProvider, requestAccounts } from "~/lib/web3/contract";

export default function SignInPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleWalletConnect = async () => {
    setLoading(true);
    setError("");

    try {
      // Request wallet connection
      const accounts = (await requestAccounts()) as string[];
      
      if (!accounts || accounts.length === 0) {
        setError("No wallet accounts found. Please install MetaMask or another Web3 wallet.");
        setLoading(false);
        return;
      }

      const address = accounts[0]!;
      
      // Create message to sign
      const message = `Sign this message to authenticate with CertifyChain.\n\nWallet: ${address}\nTimestamp: ${Date.now()}`;

      // Get provider and sign message
      const provider = getBrowserProvider();
      const signer = await provider.getSigner();
      const signature = await signer.signMessage(message);

      // Authenticate with NextAuth
      const result = await signIn("ethereum", {
        message,
        signature,
        address,
        redirect: false,
      });

      if (result?.error) {
        setError("Authentication failed. Please try again.");
      } else {
        // Redirect to dashboard
        router.push("/dashboard");
      }
    } catch (err) {
      console.error("Error connecting wallet:", err);
      setError("Failed to connect wallet. Please make sure MetaMask is installed and unlocked.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Shield className="mx-auto h-16 w-16 text-primary" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            Welcome to CertifyChain
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Connect your wallet to access the platform
          </p>
        </div>

        <div className="mt-8 rounded-lg border bg-card p-6 shadow-sm">
          <button
            onClick={handleWalletConnect}
            disabled={loading}
            className="flex w-full items-center justify-center gap-3 rounded-lg bg-primary px-4 py-3 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? (
              <>
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-5 w-5" />
                Connect Wallet
              </>
            )}
          </button>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="mt-6 space-y-3 text-sm text-muted-foreground">
            <p className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                1
              </span>
              Make sure you have MetaMask or another Web3 wallet installed
            </p>
            <p className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                2
              </span>
              Click "Connect Wallet" and approve the connection request
            </p>
            <p className="flex items-start gap-2">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                3
              </span>
              Sign the message to prove ownership of your wallet
            </p>
          </div>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          By connecting your wallet, you agree to our Terms of Service and Privacy
          Policy
        </p>
      </div>
    </div>
  );
}
