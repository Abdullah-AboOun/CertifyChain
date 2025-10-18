"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Plus,
  Shield,
  FileCheck,
  XCircle,
  CheckCircle,
  Loader2,
  Eye,
  X,
} from "lucide-react";
import { api } from "~/trpc/react";
import {
  isEntityRegistered,
  getRegistrationFee,
  registerEntity,
  issueCertificate,
  getIssuanceFee,
  revokeCertificate,
  getEntityCertificates,
} from "~/lib/web3/contract";
import { ethers } from "ethers";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription } from "~/components/ui/alert";

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isRegistered, setIsRegistered] = useState(false);
  const [checking, setChecking] = useState(true);
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [showIssueForm, setShowIssueForm] = useState(false);

  // Check if user is authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/signin");
    }
  }, [status, router]);

  // Check if entity is registered
  useEffect(() => {
    const checkRegistration = async () => {
      if (!session?.user?.walletAddress) {
        setChecking(false);
        return;
      }

      try {
        // Check both blockchain and database
        const blockchainRegistered = await isEntityRegistered(session.user.walletAddress);
        setIsRegistered(blockchainRegistered);
      } catch (error) {
        console.error("Error checking registration:", error);
        // If we can't check blockchain, assume not registered
        setIsRegistered(false);
      } finally {
        setChecking(false);
      }
    };

    if (session?.user?.walletAddress) {
      void checkRegistration();
    } else if (status !== "loading") {
      setChecking(false);
    }
  }, [session?.user?.walletAddress, status]);

  const { data: entity, refetch: refetchEntity } = api.entity.getMy.useQuery(undefined, {
    enabled: !!session?.user,
  });

  if (status === "loading" || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="text-primary h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="bg-background min-h-screen px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Manage your certificates and entity profile
          </p>
        </div>

        {!isRegistered ? (
          <NotRegisteredView
            walletAddress={session.user.walletAddress!}
            showForm={showRegisterForm}
            setShowForm={setShowRegisterForm}
            onSuccess={() => {
              setIsRegistered(true);
              void refetchEntity();
            }}
            existingEntity={entity}
          />
        ) : (
          <RegisteredView
            entity={entity}
            showIssueForm={showIssueForm}
            setShowIssueForm={setShowIssueForm}
          />
        )}
      </div>
    </div>
  );
}

function NotRegisteredView({
  walletAddress,
  showForm,
  setShowForm,
  onSuccess,
  existingEntity,
}: {
  walletAddress: string;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  onSuccess: () => void;
  existingEntity?: {
    id: string;
    name: string;
    description: string | null;
  } | null;
}) {
  const [entityName, setEntityName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationFee, setRegistrationFee] = useState<bigint | null>(null);

  const registerMutation = api.entity.register.useMutation();

  // Pre-fill form with existing entity data
  useEffect(() => {
    if (existingEntity) {
      setEntityName(existingEntity.name);
      setDescription(existingEntity.description || "");
    }
  }, [existingEntity]);

  useEffect(() => {
    const fetchFee = async () => {
      const fee = await getRegistrationFee();
      setRegistrationFee(fee);
    };
    void fetchFee();
  }, []);

  const handleRegister = async () => {
    if (!entityName.trim()) {
      setError("Please enter an entity name");
      return;
    }

    if (!registrationFee) {
      setError("Registration fee not loaded");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let txHash: string | undefined = undefined;

      // Check if already registered on blockchain
      const alreadyOnBlockchain = await isEntityRegistered(walletAddress);

      if (!alreadyOnBlockchain) {
        // Register on blockchain only if not already registered
        const receipt = await registerEntity(entityName, registrationFee);
        txHash = receipt?.hash;
      }

      // Register in database only if not already exists
      if (!existingEntity) {
        await registerMutation.mutateAsync({
          walletAddress,
          name: entityName,
          description: description || undefined,
          transactionHash: txHash,
        });
      }

      onSuccess();
      setShowForm(false);
    } catch (err: any) {
      console.error("Registration error:", err);
      
      // Check if the error is from blockchain (already registered)
      if (err?.message?.includes("already registered")) {
        // Try to just sync the database
        try {
          if (!existingEntity) {
            await registerMutation.mutateAsync({
              walletAddress,
              name: entityName,
              description: description || undefined,
            });
          }
          onSuccess();
          setShowForm(false);
        } catch (dbErr) {
          setError("Entity already registered. Please refresh the page.");
        }
      } else if (err?.code === "CALL_EXCEPTION") {
        setError("Failed to connect to blockchain. Please check your connection and try again.");
      } else {
        setError("Failed to register entity. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="text-center">
      <CardHeader>
        <Shield className="text-muted-foreground mx-auto h-16 w-16" />
        <CardTitle className="mt-4">
          {existingEntity ? "Complete Blockchain Registration" : "Register as Issuing Entity"}
        </CardTitle>
        <CardDescription>
          {existingEntity 
            ? "Your entity exists in our database. Complete the blockchain registration to start issuing certificates."
            : "You need to register as an issuing entity before you can issue certificates"
          }
        </CardDescription>
      </CardHeader>
      <CardContent>
        {existingEntity && (
          <Alert className="mb-4 text-left">
            <AlertDescription>
              <strong>Note:</strong> Your entity "{existingEntity.name}" is already in our database. 
              If you're having trouble accessing the dashboard, try clicking the button below to verify 
              your blockchain registration status.
            </AlertDescription>
          </Alert>
        )}
        {!showForm ? (
          <Button onClick={() => setShowForm(true)} size="lg" className="gap-2">
            <Plus className="h-5 w-5" />
            {existingEntity ? "Complete Registration" : "Register Now"}
          </Button>
        ) : (
          <div className="space-y-4 text-left">
            <div className="space-y-2">
              <Label htmlFor="entityName">Entity Name *</Label>
              <Input
                id="entityName"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="e.g., University of Example"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your organization"
                rows={3}
              />
            </div>

            {registrationFee && (
              <Card>
                <CardContent className="pt-4">
                  <p className="font-medium text-sm">Registration Fee</p>
                  <p className="text-muted-foreground text-sm">
                    {ethers.formatEther(registrationFee)} ETH
                  </p>
                </CardContent>
              </Card>
            )}

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="flex gap-2">
              <Button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1"
              >
                {loading ? "Registering..." : "Register Entity"}
              </Button>
              <Button
                onClick={() => setShowForm(false)}
                disabled={loading}
                variant="outline"
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function RegisteredView({
  entity,
  showIssueForm,
  setShowIssueForm,
}: {
  entity: any;
  showIssueForm: boolean;
  setShowIssueForm: (show: boolean) => void;
}) {
  const { data: certificates, refetch } = api.certificate.getMy.useQuery();

  return (
    <div className="space-y-6">
      {/* Entity Info */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold">{entity?.name || "Entity"}</h2>
              {entity?.description && (
                <p className="text-muted-foreground mt-1">{entity.description}</p>
              )}
              <p className="text-muted-foreground mt-2 font-mono text-sm">
                {entity?.walletAddress}
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500">
              <CheckCircle className="h-4 w-4" />
              Active
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Issue Certificate Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Certificates</h2>
        <Button
          onClick={() => setShowIssueForm(!showIssueForm)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Issue Certificate
        </Button>
      </div>

      {/* Issue Form */}
      {showIssueForm && (
        <IssueCertificateForm
          entityId={entity?.id}
          onSuccess={() => {
            setShowIssueForm(false);
            void refetch();
          }}
          onCancel={() => setShowIssueForm(false)}
        />
      )}

      {/* Certificates List */}
      <CertificatesList
        certificates={certificates || []}
        onRevoke={() => void refetch()}
      />
    </div>
  );
}

function IssueCertificateForm({
  entityId,
  onSuccess,
  onCancel,
}: {
  entityId: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const [recipientName, setRecipientName] = useState("");
  const [recipientEmail, setRecipientEmail] = useState("");
  const [description, setDescription] = useState("");
  const [certificateImage, setCertificateImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [issuanceFee, setIssuanceFee] = useState<bigint | null>(null);

  const issueMutation = api.certificate.create.useMutation();

  useEffect(() => {
    const fetchFee = async () => {
      const fee = await getIssuanceFee();
      setIssuanceFee(fee);
    };
    void fetchFee();
  }, []);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError("Image size must be less than 5MB");
        return;
      }
      
      setCertificateImage(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleIssue = async () => {
    if (!recipientName.trim()) {
      setError("Please enter recipient name");
      return;
    }

    if (!issuanceFee) {
      setError("Issuance fee not loaded");
      return;
    }

    setLoading(true);
    setError("");

    try {
      let documentUrl: string | undefined = undefined;

      // Upload image if provided
      if (certificateImage) {
        const formData = new FormData();
        formData.append("file", certificateImage);

        const uploadResponse = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!uploadResponse.ok) {
          throw new Error("Failed to upload certificate image");
        }

        const uploadData = await uploadResponse.json();
        documentUrl = uploadData.url;
      }

      // Save to database with image URL to generate hash
      const certificate = await issueMutation.mutateAsync({
        recipientName,
        recipientEmail: recipientEmail.trim() ? recipientEmail.trim() : undefined,
        description: description.trim() ? description.trim() : undefined,
        documentUrl,
        issuerId: entityId,
      });

      // Issue on blockchain using the server-generated hash
      // No recipient address needed - certificate data stored in database
      const receipt = await issueCertificate(
        certificate.certificateHash,
        description || "",
        issuanceFee,
      );

      // Get the certificate ID from the event logs
      const certId = receipt?.logs?.[0]?.topics?.[1];
      const blockchainId = certId ? Number(certId) : undefined;

      // Update certificate with blockchain data
      // Note: You'll need to add an update mutation for this
      // For now, we'll just complete the flow

      onSuccess();
    } catch (err) {
      console.error("Issue error:", err);
      setError("Failed to issue certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Issue New Certificate</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipientName">Recipient Name *</Label>
            <Input
              id="recipientName"
              type="text"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              placeholder="John Doe"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="recipientEmail">Recipient Email (optional)</Label>
            <Input
              id="recipientEmail"
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="john@example.com (optional)"
            />
            <p className="text-xs text-muted-foreground">
              Leave empty or provide a valid email address
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="certificateImage">Certificate Image</Label>
            <Input
              id="certificateImage"
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground">
              Upload an image of the certificate (Max 5MB)
            </p>
            {imagePreview && (
              <div className="mt-2 relative w-full max-w-md mx-auto">
                <img
                  src={imagePreview}
                  alt="Certificate preview"
                  className="w-full h-auto rounded-lg border"
                />
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Bachelor of Science in Computer Science, Graduated with Honors"
              rows={3}
            />
          </div>

          {issuanceFee && (
            <Card>
              <CardContent className="pt-4">
                <p className="font-medium text-sm">Issuance Fee</p>
                <p className="text-muted-foreground text-sm">
                  {ethers.formatEther(issuanceFee)} ETH
                </p>
              </CardContent>
            </Card>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleIssue}
              disabled={loading}
              className="flex-1"
            >
              {loading ? "Issuing..." : "Issue Certificate"}
            </Button>
            <Button
              onClick={onCancel}
              disabled={loading}
              variant="outline"
            >
              Cancel
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CertificatesList({
  certificates,
  onRevoke,
}: {
  certificates: any[];
  onRevoke: () => void;
}) {
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [previewCert, setPreviewCert] = useState<any | null>(null);
  const revokeMutation = api.certificate.revoke.useMutation();

  const handleRevoke = async (certId: number, blockchainId?: number) => {
    if (!confirm("Are you sure you want to revoke this certificate?")) return;

    setRevokingId(certId);

    try {
      if (blockchainId) {
        const receipt = await revokeCertificate(blockchainId);
        await revokeMutation.mutateAsync({
          id: certId,
          revokeTxHash: receipt?.hash,
        });
      }
      onRevoke();
    } catch (error) {
      console.error("Revoke error:", error);
      alert("Failed to revoke certificate");
    } finally {
      setRevokingId(null);
    }
  };

  if (certificates.length === 0) {
    return (
      <Card className="text-center">
        <CardContent className="py-12">
          <FileCheck className="text-muted-foreground mx-auto h-12 w-12" />
          <h3 className="mt-4 text-lg font-semibold">No certificates yet</h3>
          <p className="text-muted-foreground mt-2 text-sm">
            Issue your first certificate to get started
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {certificates.map((cert) => (
        <Card key={cert.id}>
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold">
                    {cert.recipientName || "Certificate"}
                  </h3>
                  {cert.blockchainId && (
                    <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-medium">
                      #{cert.blockchainId}
                    </span>
                  )}
                </div>
                {cert.recipientEmail && (
                  <p className="text-muted-foreground mt-1 text-sm">
                    {cert.recipientEmail}
                  </p>
                )}
                <p className="text-muted-foreground mt-1 text-xs">
                  Issued: {new Date(cert.issuedAt).toLocaleDateString()}
                </p>
                {cert.description && (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {cert.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2">
                {cert.isRevoked ? (
                  <div className="text-destructive flex items-center gap-1">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Revoked</span>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-1 text-green-500">
                      <CheckCircle className="h-4 w-4" />
                      <span className="text-sm font-medium">Valid</span>
                    </div>
                    <Button
                      onClick={() => setPreviewCert(cert)}
                      variant="outline"
                      size="sm"
                      className="gap-1"
                    >
                      <Eye className="h-4 w-4" />
                      Preview
                    </Button>
                    <Button
                      onClick={() => handleRevoke(cert.id, cert.blockchainId)}
                      disabled={revokingId === cert.id}
                      variant="destructive"
                      size="sm"
                    >
                      {revokingId === cert.id ? "Revoking..." : "Revoke"}
                    </Button>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Certificate Preview Modal */}
      {previewCert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
          <Card className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <Button
              onClick={() => setPreviewCert(null)}
              variant="ghost"
              size="sm"
              className="absolute right-2 top-2"
            >
              <X className="h-4 w-4" />
            </Button>
            <CardHeader>
              <CardTitle>Certificate Preview</CardTitle>
              <CardDescription>
                Certificate #{previewCert.blockchainId || previewCert.id}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Certificate Image */}
              {previewCert.documentUrl && (
                <div className="rounded-lg border bg-muted p-4">
                  <img
                    src={previewCert.documentUrl}
                    alt="Certificate"
                    className="w-full rounded-md"
                  />
                </div>
              )}

              {/* Certificate Details */}
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Recipient Name</Label>
                  <p className="font-medium">{previewCert.recipientName}</p>
                </div>

                {previewCert.recipientEmail && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Recipient Email</Label>
                    <p className="font-medium">{previewCert.recipientEmail}</p>
                  </div>
                )}

                {previewCert.description && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Description</Label>
                    <p className="text-sm">{previewCert.description}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground text-xs">Issuer</Label>
                  <p className="font-medium">{previewCert.issuer?.name || "Unknown"}</p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Issue Date</Label>
                  <p className="text-sm">
                    {new Date(previewCert.issuedAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>

                <div>
                  <Label className="text-muted-foreground text-xs">Certificate Hash</Label>
                  <p className="font-mono break-all text-xs">{previewCert.certificateHash}</p>
                </div>

                {previewCert.blockchainId && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Blockchain ID</Label>
                    <p className="font-medium">#{previewCert.blockchainId}</p>
                  </div>
                )}

                {previewCert.transactionHash && (
                  <div>
                    <Label className="text-muted-foreground text-xs">Transaction Hash</Label>
                    <p className="font-mono break-all text-xs">{previewCert.transactionHash}</p>
                  </div>
                )}

                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <div className="flex items-center gap-2">
                    {previewCert.isRevoked ? (
                      <>
                        <XCircle className="text-destructive h-4 w-4" />
                        <span className="text-destructive font-medium">Revoked</span>
                        {previewCert.revokedAt && (
                          <span className="text-muted-foreground text-xs">
                            on {new Date(previewCert.revokedAt).toLocaleDateString()}
                          </span>
                        )}
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        <span className="font-medium text-green-500">Valid</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
