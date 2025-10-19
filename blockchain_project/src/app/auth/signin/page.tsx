"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Shield, Wallet } from "lucide-react";
import { getBrowserProvider, requestAccounts } from "~/lib/web3/contract";
import { Button } from "~/components/ui/button";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Card, CardContent } from "~/components/ui/card";

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

      if (!accounts?.length) {
        setError(
          "No wallet accounts found. Please install MetaMask or another Web3 wallet.",
        );
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
      setError(
        "Failed to connect wallet. Please make sure MetaMask is installed and unlocked.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <div className="text-center">
          <Shield className="text-primary mx-auto h-16 w-16" />
          <h1 className="mt-6 text-3xl font-bold tracking-tight">
            Welcome to CertifyChain
          </h1>
          <p className="text-muted-foreground mt-2 text-sm">
            Connect your wallet to access the platform
          </p>
        </div>

        <Card className="mt-8">
          <CardContent className="pt-6">
            <Button
              onClick={handleWalletConnect}
              disabled={loading}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <div className="mr-2 h-5 w-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Connecting...
                </>
              ) : (
                <>
                  <Wallet className="mr-2 h-5 w-5" />
                  Connect Wallet
                </>
              )}
            </Button>

            {error && (
              <Alert variant="destructive" className="mt-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="text-muted-foreground mt-6 space-y-3 text-sm">
              <p className="flex items-start gap-2">
                <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  1
                </span>
                Make sure you have MetaMask or another Web3 wallet installed
              </p>
              <p className="flex items-start gap-2">
                <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  2
                </span>
                Click "Connect Wallet" and approve the connection request
              </p>
              <p className="flex items-start gap-2">
                <span className="bg-primary/10 text-primary mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold">
                  3
                </span>
                Sign the message to prove ownership of your wallet
              </p>
            </div>
          </CardContent>
        </Card>

        <p className="text-muted-foreground mt-4 text-center text-xs">
          By connecting your wallet, you agree to our Terms of Service and
          Privacy Policy
        </p>
      </div>
    </div>
  );
}
