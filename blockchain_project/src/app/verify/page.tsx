"use client";

import { useState } from "react";
import { Search, CheckCircle, XCircle, AlertCircle, Shield } from "lucide-react";
import { verifyCertificate } from "~/lib/web3/contract";

export default function VerifyPage() {
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    data?: {
      id: bigint;
      certificateHash: string;
      issuer: string;
      recipient: string;
      issuedAt: bigint;
      isRevoked: boolean;
      metadata: string;
      issuerName: string;
    };
    error?: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!certificateId || isNaN(Number(certificateId))) {
      setResult({ found: false, error: "Please enter a valid certificate ID" });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const data = await verifyCertificate(Number(certificateId));
      setResult({ found: true, data });
    } catch (error) {
      console.error(error);
      setResult({ found: false, error: "Certificate not found or error occurred" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-10">
          <Shield className="mx-auto h-16 w-16 text-primary mb-4" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Verify Certificate
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Enter the certificate ID to verify its authenticity on the blockchain
          </p>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-sm">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Enter Certificate ID (e.g., 1, 2, 3...)"
              value={certificateId}
              onChange={(e) => setCertificateId(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleVerify()}
              className="flex-1 rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            <button
              onClick={handleVerify}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Verifying...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Verify
                </>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-6 rounded-lg border bg-card p-6 shadow-sm">
            {result.found && result.data ? (
              <div>
                <div className="mb-4 flex items-center gap-2">
                  {result.data.isRevoked ? (
                    <>
                      <XCircle className="h-8 w-8 text-destructive" />
                      <h2 className="text-2xl font-bold text-destructive">
                        Certificate Revoked
                      </h2>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <h2 className="text-2xl font-bold text-green-500">
                        Valid Certificate
                      </h2>
                    </>
                  )}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Certificate ID
                    </label>
                    <p className="text-lg font-mono">{result.data.id.toString()}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Issuer
                    </label>
                    <p className="text-lg">{result.data.issuerName}</p>
                    <p className="text-sm font-mono text-muted-foreground">
                      {result.data.issuer}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Recipient Address
                    </label>
                    <p className="text-sm font-mono">{result.data.recipient}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Certificate Hash
                    </label>
                    <p className="break-all text-sm font-mono">
                      {result.data.certificateHash}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Issued At
                    </label>
                    <p className="text-sm">
                      {new Date(
                        Number(result.data.issuedAt) * 1000
                      ).toLocaleString()}
                    </p>
                  </div>

                  {result.data.metadata && (
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">
                        Metadata
                      </label>
                      <p className="text-sm">{result.data.metadata}</p>
                    </div>
                  )}

                  <div>
                    <label className="text-sm font-medium text-muted-foreground">
                      Status
                    </label>
                    <p
                      className={`text-sm font-medium ${
                        result.data.isRevoked ? "text-destructive" : "text-green-500"
                      }`}
                    >
                      {result.data.isRevoked ? "REVOKED" : "VALID"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <div>
                  <h2 className="text-2xl font-bold text-destructive">Not Found</h2>
                  <p className="text-muted-foreground">
                    {result.error || "No certificate found with this ID"}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
