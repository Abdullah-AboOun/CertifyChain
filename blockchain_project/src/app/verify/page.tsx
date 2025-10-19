"use client";

import { useState } from "react";
import {
  Search,
  CheckCircle,
  XCircle,
  AlertCircle,
  Shield,
} from "lucide-react";
import { verifyCertificate } from "~/lib/web3/contract";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import { Card, CardContent } from "~/components/ui/card";
import Image from "next/image";

export default function VerifyPage() {
  const [certificateId, setCertificateId] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    found: boolean;
    blockchainData?: {
      id: bigint;
      certificateHash: string;
      issuer: string;
      issuedAt: bigint;
      isRevoked: boolean;
      metadata: string;
      issuerName: string;
    };
    dbData?: {
      recipientName: string;
      recipientEmail?: string | null;
      description?: string | null;
      documentUrl?: string | null;
    };
    error?: string;
  } | null>(null);

  const handleVerify = async () => {
    if (!certificateId || certificateId.trim() === "") {
      setResult({ found: false, error: "Please enter a valid certificate ID" });
      return;
    }

    // Validate certificate ID format (should be bytes32 - 0x followed by 64 hex chars)
    const bytes32Regex = /^0x[a-fA-F0-9]{64}$/;
    if (!bytes32Regex.test(certificateId.trim())) {
      setResult({ 
        found: false, 
        error: "Invalid certificate ID format. Please enter a valid bytes32 ID (0x followed by 64 hexadecimal characters)" 
      });
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      // Verify on blockchain
      const blockchainData = await verifyCertificate(certificateId.trim());
      
      // Fetch from database for additional info using proper tRPC query format
      const input = { json: { blockchainId: certificateId.trim() } };
      const dbResponse = await fetch(`/api/trpc/certificate.getByBlockchainId?input=${encodeURIComponent(JSON.stringify(input))}`);
      let dbData = undefined;
      
      if (dbResponse.ok) {
        const dbResult = await dbResponse.json();
        dbData = dbResult.result?.data?.json;
      }
      
      setResult({ found: true, blockchainData, dbData });
    } catch (error: any) {
      console.error("Verification error:", error);
      
      let errorMessage = "Certificate not found or invalid certificate ID";
      
      // Handle different error types
      if (error?.code === "CALL_EXCEPTION") {
        // Check if it's a revert error (certificate doesn't exist)
        if (error?.message?.includes("missing revert data") || 
            error?.data === null || 
            error?.reason === null) {
          errorMessage = "Certificate not found. This certificate ID does not exist on the blockchain.";
        } else {
          errorMessage = "Certificate not found on the blockchain. The certificate may not exist or the ID is invalid.";
        }
      } else if (error?.code === "INVALID_ARGUMENT") {
        errorMessage = "Invalid certificate ID format. Please check and try again.";
      } else if (error?.message?.includes("network") || error?.message?.includes("could not connect")) {
        errorMessage = "Network error. Please check your blockchain connection and try again.";
      } else if (error?.message?.includes("timeout")) {
        errorMessage = "Request timeout. Please try again.";
      } else if (error?.code === "NETWORK_ERROR") {
        errorMessage = "Unable to connect to the blockchain network. Please check your connection.";
      } else if (error?.message) {
        // Only show the error message if it's user-friendly
        if (error.message.length < 100) {
          errorMessage = `Verification failed: ${error.message}`;
        }
      }
      
      setResult({
        found: false,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-10 text-center">
          <Shield className="text-primary mx-auto mb-4 h-16 w-16" />
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            Verify Certificate
          </h1>
          <p className="text-muted-foreground mt-4 text-lg">
            Enter the certificate ID to verify its authenticity on the
            blockchain
          </p>
        </div>

        <Card>
          <CardContent className="pt-6">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder="Enter Certificate ID (e.g., 0x1234...)"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerify()}
                className="font-mono"
              />
              <Button onClick={handleVerify} disabled={loading}>
                {loading ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Verifying...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Verify
                  </>
                )}
              </Button>
            </div>
            <p className="text-muted-foreground mt-2 text-xs">
              Enter a 66-character certificate ID starting with "0x" (e.g., 0x1234...abcd)
            </p>
          </CardContent>
        </Card>

        {result && (
          <Card className="mt-6">
            <CardContent className="pt-6">
              {result.found && result.blockchainData ? (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    {result.blockchainData.isRevoked ? (
                      <>
                        <XCircle className="text-destructive h-8 w-8" />
                        <h2 className="text-destructive text-2xl font-bold">
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
                    {/* Certificate Image */}
                    {result.dbData?.documentUrl && (
                      <div className="relative aspect-video w-full overflow-hidden rounded-lg border">
                        <Image
                          src={result.dbData.documentUrl}
                          alt="Certificate"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}

                    <div>
                      <Label className="text-muted-foreground">
                        Certificate ID
                      </Label>
                      <p className="font-mono text-sm break-all">
                        {result.blockchainData.id.toString()}
                      </p>
                    </div>

                    {result.dbData && (
                      <>
                        <div>
                          <Label className="text-muted-foreground">
                            Recipient Name
                          </Label>
                          <p className="text-lg font-medium">{result.dbData.recipientName}</p>
                        </div>

                        {result.dbData.recipientEmail && (
                          <div>
                            <Label className="text-muted-foreground">
                              Recipient Email
                            </Label>
                            <p className="text-sm">{result.dbData.recipientEmail}</p>
                          </div>
                        )}
                      </>
                    )}

                    <div>
                      <Label className="text-muted-foreground">
                        Issuer
                      </Label>
                      <p className="text-lg">{result.blockchainData.issuerName}</p>
                      <p className="text-muted-foreground font-mono text-sm">
                        {result.blockchainData.issuer}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Certificate Hash
                      </Label>
                      <p className="font-mono text-sm break-all">
                        {result.blockchainData.certificateHash}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Issued At
                      </Label>
                      <p className="text-sm">
                        {new Date(
                          Number(result.blockchainData.issuedAt) * 1000,
                        ).toLocaleString()}
                      </p>
                    </div>

                    {result.dbData?.description && (
                      <div>
                        <Label className="text-muted-foreground">
                          Description
                        </Label>
                        <p className="text-sm">{result.dbData.description}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-muted-foreground">
                        Status
                      </Label>
                      <p
                        className={`text-sm font-medium ${
                          result.blockchainData.isRevoked
                            ? "text-destructive"
                            : "text-green-500"
                        }`}
                      >
                        {result.blockchainData.isRevoked ? "REVOKED" : "VALID"}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Verification Failed</strong>
                      <p className="mt-1">{result.error || "No certificate found with this ID"}</p>
                    </AlertDescription>
                  </Alert>
                  
                                    <div className="rounded-lg border border-muted bg-muted/50 p-4">
                    <h3 className="font-medium text-sm mb-2">Troubleshooting Tips:</h3>
                    <ul className="text-muted-foreground space-y-1 text-sm list-disc list-inside">
                      <li>Verify the certificate ID is exactly 66 characters (0x + 64 hex digits)</li>
                      <li>Check if you&apos;re connected to the correct blockchain network</li>
                      <li>Ensure the certificate was issued on this network</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
