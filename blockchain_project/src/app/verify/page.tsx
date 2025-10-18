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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";

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
                placeholder="Enter Certificate ID (e.g., 1, 2, 3...)"
                value={certificateId}
                onChange={(e) => setCertificateId(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleVerify()}
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
              {result.found && result.data ? (
                <div>
                  <div className="mb-4 flex items-center gap-2">
                    {result.data.isRevoked ? (
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
                    <div>
                      <Label className="text-muted-foreground">
                        Certificate ID
                      </Label>
                      <p className="font-mono text-lg">
                        {result.data.id.toString()}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Issuer
                      </Label>
                      <p className="text-lg">{result.data.issuerName}</p>
                      <p className="text-muted-foreground font-mono text-sm">
                        {result.data.issuer}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Recipient Address
                      </Label>
                      <p className="font-mono text-sm">
                        {result.data.recipient}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Certificate Hash
                      </Label>
                      <p className="font-mono text-sm break-all">
                        {result.data.certificateHash}
                      </p>
                    </div>

                    <div>
                      <Label className="text-muted-foreground">
                        Issued At
                      </Label>
                      <p className="text-sm">
                        {new Date(
                          Number(result.data.issuedAt) * 1000,
                        ).toLocaleString()}
                      </p>
                    </div>

                    {result.data.metadata && (
                      <div>
                        <Label className="text-muted-foreground">
                          Metadata
                        </Label>
                        <p className="text-sm">{result.data.metadata}</p>
                      </div>
                    )}

                    <div>
                      <Label className="text-muted-foreground">
                        Status
                      </Label>
                      <p
                        className={`text-sm font-medium ${
                          result.data.isRevoked
                            ? "text-destructive"
                            : "text-green-500"
                        }`}
                      >
                        {result.data.isRevoked ? "REVOKED" : "VALID"}
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
