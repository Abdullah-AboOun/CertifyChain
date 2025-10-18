"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Plus, Shield, FileCheck, XCircle, CheckCircle, Loader2 } from "lucide-react";
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
      if (!session?.user?.walletAddress) return;

      try {
        const registered = await isEntityRegistered(session.user.walletAddress);
        setIsRegistered(registered);
      } catch (error) {
        console.error("Error checking registration:", error);
      } finally {
        setChecking(false);
      }
    };

    if (session?.user?.walletAddress) {
      void checkRegistration();
    }
  }, [session?.user?.walletAddress]);

  const { data: entity } = api.entity.getMy.useQuery(undefined, {
    enabled: !!session?.user,
  });

  if (status === "loading" || checking) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session?.user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background px-4 py-12 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="mt-2 text-muted-foreground">
            Manage your certificates and entity profile
          </p>
        </div>

        {!isRegistered ? (
          <NotRegisteredView
            walletAddress={session.user.walletAddress!}
            showForm={showRegisterForm}
            setShowForm={setShowRegisterForm}
            onSuccess={() => setIsRegistered(true)}
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
}: {
  walletAddress: string;
  showForm: boolean;
  setShowForm: (show: boolean) => void;
  onSuccess: () => void;
}) {
  const [entityName, setEntityName] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationFee, setRegistrationFee] = useState<bigint | null>(null);

  const registerMutation = api.entity.register.useMutation();

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
      // Register on blockchain
      const receipt = await registerEntity(entityName, registrationFee);

      // Register in database
      await registerMutation.mutateAsync({
        walletAddress,
        name: entityName,
        description: description || undefined,
        transactionHash: receipt?.hash,
      });

      onSuccess();
      setShowForm(false);
    } catch (err) {
      console.error("Registration error:", err);
      setError("Failed to register entity. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-8 text-center shadow-sm">
      <Shield className="mx-auto h-16 w-16 text-muted-foreground" />
      <h2 className="mt-4 text-2xl font-bold">Register as Issuing Entity</h2>
      <p className="mt-2 text-muted-foreground">
        You need to register as an issuing entity before you can issue certificates
      </p>

      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-base font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="h-5 w-5" />
          Register Now
        </button>
      ) : (
        <div className="mt-6 text-left">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium">Entity Name *</label>
              <input
                type="text"
                value={entityName}
                onChange={(e) => setEntityName(e.target.value)}
                placeholder="e.g., University of Example"
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of your organization"
                rows={3}
                className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            {registrationFee && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="font-medium">Registration Fee</p>
                <p className="text-muted-foreground">
                  {ethers.formatEther(registrationFee)} ETH
                </p>
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleRegister}
                disabled={loading}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
              >
                {loading ? "Registering..." : "Register Entity"}
              </button>
              <button
                onClick={() => setShowForm(false)}
                disabled={loading}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
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
      <div className="rounded-lg border bg-card p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold">{entity?.name || "Entity"}</h2>
            {entity?.description && (
              <p className="mt-1 text-muted-foreground">{entity.description}</p>
            )}
            <p className="mt-2 text-sm font-mono text-muted-foreground">
              {entity?.walletAddress}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-green-500/10 px-3 py-1 text-sm font-medium text-green-500">
            <CheckCircle className="h-4 w-4" />
            Active
          </div>
        </div>
      </div>

      {/* Issue Certificate Button */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Certificates</h2>
        <button
          onClick={() => setShowIssueForm(!showIssueForm)}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          Issue Certificate
        </button>
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
  const [recipientAddress, setRecipientAddress] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [certificateHash, setCertificateHash] = useState("");
  const [metadata, setMetadata] = useState("");
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

  const handleIssue = async () => {
    if (!recipientAddress || !certificateHash) {
      setError("Please fill in all required fields");
      return;
    }

    if (!issuanceFee) {
      setError("Issuance fee not loaded");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Issue on blockchain
      const receipt = await issueCertificate(
        certificateHash,
        recipientAddress,
        metadata || "",
        issuanceFee
      );

      // Get the certificate ID from the event logs
      const certId = receipt?.logs?.[0]?.topics?.[1];
      const blockchainId = certId ? Number(certId) : undefined;

      // Save to database
      await issueMutation.mutateAsync({
        blockchainId,
        certificateHash,
        recipientAddress,
        recipientName: recipientName || undefined,
        metadata: metadata || undefined,
        transactionHash: receipt?.hash,
        issuerId: entityId,
      });

      onSuccess();
    } catch (err) {
      console.error("Issue error:", err);
      setError("Failed to issue certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="mb-4 text-xl font-bold">Issue New Certificate</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Recipient Address *</label>
          <input
            type="text"
            value={recipientAddress}
            onChange={(e) => setRecipientAddress(e.target.value)}
            placeholder="0x..."
            className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Recipient Name</label>
          <input
            type="text"
            value={recipientName}
            onChange={(e) => setRecipientName(e.target.value)}
            placeholder="John Doe"
            className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Certificate Hash *</label>
          <input
            type="text"
            value={certificateHash}
            onChange={(e) => setCertificateHash(e.target.value)}
            placeholder="Document hash or IPFS CID"
            className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Metadata (JSON)</label>
          <textarea
            value={metadata}
            onChange={(e) => setMetadata(e.target.value)}
            placeholder='{"degree": "Bachelor of Science", "field": "Computer Science"}'
            rows={3}
            className="mt-1 w-full rounded-lg border bg-background px-4 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        {issuanceFee && (
          <div className="rounded-lg bg-muted p-3 text-sm">
            <p className="font-medium">Issuance Fee</p>
            <p className="text-muted-foreground">
              {ethers.formatEther(issuanceFee)} ETH
            </p>
          </div>
        )}

        {error && (
          <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex gap-2">
          <button
            onClick={handleIssue}
            disabled={loading}
            className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 disabled:opacity-50"
          >
            {loading ? "Issuing..." : "Issue Certificate"}
          </button>
          <button
            onClick={onCancel}
            disabled={loading}
            className="rounded-lg border px-4 py-2 text-sm font-medium transition-colors hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
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
      <div className="rounded-lg border bg-card p-12 text-center shadow-sm">
        <FileCheck className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No certificates yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Issue your first certificate to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {certificates.map((cert) => (
        <div key={cert.id} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold">
                  {cert.recipientName || "Certificate"}
                </h3>
                {cert.blockchainId && (
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                    #{cert.blockchainId}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-mono text-muted-foreground">
                {cert.recipientAddress}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Issued: {new Date(cert.issuedAt).toLocaleDateString()}
              </p>
              {cert.metadata && (
                <p className="mt-1 text-xs text-muted-foreground">
                  {cert.metadata}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              {cert.isRevoked ? (
                <div className="flex items-center gap-1 text-destructive">
                  <XCircle className="h-4 w-4" />
                  <span className="text-sm font-medium">Revoked</span>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-1 text-green-500">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Valid</span>
                  </div>
                  <button
                    onClick={() => handleRevoke(cert.id, cert.blockchainId)}
                    disabled={revokingId === cert.id}
                    className="rounded bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                  >
                    {revokingId === cert.id ? "Revoking..." : "Revoke"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
