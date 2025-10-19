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
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { api } from "~/trpc/react";
import {
  isEntityRegistered,
  getRegistrationFee,
  registerEntity,
  issueCertificate,
  getIssuanceFee,
  revokeCertificate,
} from "~/lib/web3/contract";
import { ethers } from "ethers";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Textarea } from "~/components/ui/textarea";
import { Alert, AlertDescription } from "~/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

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
    organizationType: string | null;
    country: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    registrationNumber: string | null;
    taxId: string | null;
  } | null;
}) {
  const [entityName, setEntityName] = useState("");
  const [description, setDescription] = useState("");
  const [organizationType, setOrganizationType] = useState("");
  const [otherOrgType, setOtherOrgType] = useState("");
  const [country, setCountry] = useState("");
  const [website, setWebsite] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxId, setTaxId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [registrationFee, setRegistrationFee] = useState<bigint | null>(null);

  const registerMutation = api.entity.register.useMutation();

  // Pre-fill form with existing entity data
  useEffect(() => {
    if (existingEntity) {
      setEntityName(existingEntity.name);
      setDescription(existingEntity.description ?? "");
      setOrganizationType(existingEntity.organizationType ?? "");
      setCountry(existingEntity.country ?? "");
      setWebsite(existingEntity.website ?? "");
      setEmail(existingEntity.email ?? "");
      setPhone(existingEntity.phone ?? "");
      setAddress(existingEntity.address ?? "");
      setRegistrationNumber(existingEntity.registrationNumber ?? "");
      setTaxId(existingEntity.taxId ?? "");
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
    // Validate all fields BEFORE prompting for payment
    if (!entityName.trim()) {
      setError("Please enter an entity name");
      return;
    }

    if (organizationType === "other" && !otherOrgType.trim()) {
      setError("Please specify your organization type");
      return;
    }

    // Validate email format if provided
    if (email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email.trim())) {
        setError("Please enter a valid email address or leave it empty");
        return;
      }
    }

    // Validate website URL format if provided
    if (website.trim()) {
      try {
        // Add https:// if no protocol specified
        const urlToValidate = website.trim().match(/^https?:\/\//) 
          ? website.trim() 
          : `https://${website.trim()}`;
        new URL(urlToValidate);
      } catch {
        setError("Please enter a valid website URL (e.g., example.com or https://example.com) or leave it empty");
        return;
      }
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
        // Use "Other" text if organization type is "other"
        const finalOrgType = organizationType === "other" ? otherOrgType : organizationType;
        
        await registerMutation.mutateAsync({
          walletAddress,
          name: entityName,
          description: description.trim() || undefined,
          organizationType: finalOrgType?.trim() || undefined,
          country: country.trim() || undefined,
          website: website.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          address: address.trim() || undefined,
          registrationNumber: registrationNumber.trim() || undefined,
          taxId: taxId.trim() || undefined,
          transactionHash: txHash,
        });
      }

      onSuccess();
      setShowForm(false);
    } catch (err: unknown) {
      console.error("Registration error:", err);
      
      // Handle validation errors from tRPC
      if (err && typeof err === 'object' && 'data' in err) {
        const errorData = err.data as any;
        const zodError = errorData?.zodError;
        const fieldErrors = zodError?.fieldErrors ?? {};
        
        // Extract first error message
        if (fieldErrors.website) {
          setError("Please enter a valid website URL (e.g., example.com or https://example.com) or leave it empty.");
        } else if (fieldErrors.email) {
          setError("Please enter a valid email address or leave it empty.");
        } else {
          // Generic validation error
          const firstErrorField = Object.keys(fieldErrors)[0];
          const firstErrorMessages = fieldErrors[firstErrorField as keyof typeof fieldErrors];
          const errorMessage = Array.isArray(firstErrorMessages) ? firstErrorMessages[0] : "Please check your input.";
          setError(`Validation error: ${errorMessage}`);
        }
      }
      // Check if the error is from blockchain (already registered)
      else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string' && err.message.includes("already registered")) {
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
        } catch {
          setError("Entity already registered. Please refresh the page.");
        }
      } else if (err && typeof err === 'object' && 'code' in err && err.code === "CALL_EXCEPTION") {
        setError("Failed to connect to blockchain. Please check your connection and try again.");
      } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        setError(`Registration failed: ${err.message}`);
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
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="font-semibold text-sm">Basic Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="entityName">Organization Name *</Label>
                <Input
                  id="entityName"
                  value={entityName}
                  onChange={(e) => setEntityName(e.target.value)}
                  placeholder="e.g., University of Example"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="organizationType">Organization Type</Label>
                <Select value={organizationType} onValueChange={setOrganizationType}>
                  <SelectTrigger id="organizationType">
                    <SelectValue placeholder="Select organization type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="university">University</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="company">Company</SelectItem>
                    <SelectItem value="corporation">Corporation</SelectItem>
                    <SelectItem value="government">Government Agency</SelectItem>
                    <SelectItem value="non-profit">Non-Profit Organization</SelectItem>
                    <SelectItem value="ngo">NGO</SelectItem>
                    <SelectItem value="healthcare">Healthcare Institution</SelectItem>
                    <SelectItem value="training">Training Institute</SelectItem>
                    <SelectItem value="certification">Certification Body</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {organizationType === "other" && (
                <div className="space-y-2">
                  <Label htmlFor="otherOrgType">Specify Organization Type *</Label>
                  <Input
                    id="otherOrgType"
                    value={otherOrgType}
                    onChange={(e) => setOtherOrgType(e.target.value)}
                    placeholder="Please specify your organization type"
                  />
                </div>
              )}

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
            </div>

            {/* Contact Information */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Contact Information</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="contact@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="website">Website</Label>
                <Input
                  id="website"
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="example.com or https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Physical Address</Label>
                <Textarea
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street address, City, State/Province, Postal Code"
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input
                  id="country"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  placeholder="e.g., United States"
                />
              </div>
            </div>

            {/* Legal Information */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="font-semibold text-sm">Legal Information (Optional)</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="registrationNumber">Registration Number</Label>
                  <Input
                    id="registrationNumber"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="Business registration number"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / VAT Number</Label>
                  <Input
                    id="taxId"
                    value={taxId}
                    onChange={(e) => setTaxId(e.target.value)}
                    placeholder="Tax identification number"
                  />
                </div>
              </div>
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
  entity: {
    id: string;
    name: string;
    description: string | null;
    organizationType: string | null;
    country: string | null;
    website: string | null;
    email: string | null;
    phone: string | null;
    address: string | null;
    registrationNumber: string | null;
    taxId: string | null;
    walletAddress: string;
  } | null | undefined;
  showIssueForm: boolean;
  setShowIssueForm: (show: boolean) => void;
}) {
  const { data: certificates, refetch } = api.certificate.getMy.useQuery();

  const [showEntityDetails, setShowEntityDetails] = useState(false);

  return (
    <div className="space-y-6">
      {/* Entity Info */}
      <Card className="cursor-pointer transition-all hover:shadow-md" onClick={() => setShowEntityDetails(!showEntityDetails)}>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h2 className="text-2xl font-bold">{entity?.name ?? "Entity"}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowEntityDetails(!showEntityDetails);
                  }}
                >
                  {showEntityDetails ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {entity?.description && (
                <p className="text-muted-foreground mt-1">{entity.description}</p>
              )}
              
              {showEntityDetails && (
                <div className="mt-4 space-y-2 border-t pt-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Wallet Address</Label>
                    <p className="font-mono text-sm break-all">{entity?.walletAddress}</p>
                  </div>
                  {entity?.organizationType && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Organization Type</Label>
                      <p className="text-sm">{entity.organizationType}</p>
                    </div>
                  )}
                  {entity?.email && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Email</Label>
                      <p className="text-sm">{entity.email}</p>
                    </div>
                  )}
                  {entity?.phone && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Phone</Label>
                      <p className="text-sm">{entity.phone}</p>
                    </div>
                  )}
                  {entity?.website && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Website</Label>
                      <a 
                        href={entity.website.startsWith('http') ? entity.website : `https://${entity.website}`} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-sm text-primary hover:underline"
                      >
                        {entity.website}
                      </a>
                    </div>
                  )}
                  {entity?.country && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Country</Label>
                      <p className="text-sm">{entity.country}</p>
                    </div>
                  )}
                  {entity?.address && (
                    <div>
                      <Label className="text-muted-foreground text-xs">Address</Label>
                      <p className="text-sm whitespace-pre-line">{entity.address}</p>
                    </div>
                  )}
                </div>
              )}
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
      {showIssueForm && entity?.id && (
        <IssueCertificateForm
          entityId={entity.id}
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
  const updateBlockchainIdMutation = api.certificate.updateBlockchainId.useMutation();

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
    // Validate required fields
    if (!recipientName.trim()) {
      setError("Please enter recipient name");
      return;
    }

    // Validate email format if provided
    if (recipientEmail.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail.trim())) {
        setError("Please enter a valid email address or leave it empty");
        return;
      }
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

        const uploadData = (await uploadResponse.json()) as { url: string };
        documentUrl = uploadData.url;
      }

      // Save to database with image URL to generate hash
      const certificate = await issueMutation.mutateAsync({
        recipientName: recipientName.trim(),
        recipientEmail: recipientEmail.trim() || undefined,
        description: description.trim() || undefined,
        documentUrl,
        issuerId: entityId,
      });

      // Issue on blockchain using the server-generated hash
      // No recipient address needed - certificate data stored in database
      const receipt = await issueCertificate(
        certificate.certificateHash,
        description ?? "",
        issuanceFee,
      );

      // Get the bytes32 certificate ID from the event logs (first indexed parameter)
      const certIdBytes32 = receipt?.logs?.[0]?.topics?.[1];

      if (certIdBytes32) {
        // Update certificate with blockchain data
        await updateBlockchainIdMutation.mutateAsync({
          id: certificate.id,
          blockchainId: certIdBytes32,
          transactionHash: receipt.hash,
        });
      }

      onSuccess();
    } catch (err: unknown) {
      console.error("Issue error:", err);
      
      // Handle validation errors from tRPC
      if (err && typeof err === 'object' && 'data' in err) {
        const errorData = err.data as any;
        const zodError = errorData?.zodError;
        const fieldErrors = zodError?.fieldErrors ?? {};
        
        if (fieldErrors.recipientEmail) {
          setError("Please enter a valid email address or leave it empty.");
        } else {
          const firstErrorField = Object.keys(fieldErrors)[0];
          const firstErrorMessages = fieldErrors[firstErrorField as keyof typeof fieldErrors];
          const errorMessage = Array.isArray(firstErrorMessages) ? firstErrorMessages[0] : "Please check your input.";
          setError(`Validation error: ${errorMessage}`);
        }
      } else if (err && typeof err === 'object' && 'code' in err && err.code === "CALL_EXCEPTION") {
        setError("Failed to connect to blockchain. Please check your connection and try again.");
      } else if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
        setError(`Failed to issue certificate: ${err.message}`);
      } else {
        setError("Failed to issue certificate. Please try again.");
      }
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

  const handleRevoke = async (certId: number, blockchainId?: string) => {
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
                    <span className="bg-primary/10 text-primary rounded px-2 py-0.5 text-xs font-mono">
                      {cert.blockchainId.slice(0, 6)}...{cert.blockchainId.slice(-4)}
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
                {/* Certificate ID */}
                {previewCert.blockchainId && (
                  <div className="rounded-lg border bg-muted/50 p-3">
                    <Label className="text-muted-foreground text-xs">Certificate ID</Label>
                    <p className="font-mono text-sm break-all font-medium">{previewCert.blockchainId}</p>
                  </div>
                )}

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
