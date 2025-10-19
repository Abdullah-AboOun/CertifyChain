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
import { api } from "~/trpc/react";
import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
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

    setLoading(true);
    setResult(null);

    try {
      // Verify on blockchain
      const blockchainData = await verifyCertificate(certificateId);
      
      // Fetch from database for additional info using proper tRPC query format
      const input = { json: { blockchainId: certificateId } };
      const dbResponse = await fetch(`/api/trpc/certificate.getByBlockchainId?input=${encodeURIComponent(JSON.stringify(input))}`);
      let dbData = undefined;
      
      if (dbResponse.ok) {
        const dbResult = await dbResponse.json();
        dbData = dbResult.result?.data?.json;
      }
      
      setResult({ found: true, blockchainData, dbData });
    } catch (error) {
      console.error(error);
      setResult({
        found: false,
        error: "Certificate not found or error occurred",
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
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {result.error || "No certificate found with this ID"}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
