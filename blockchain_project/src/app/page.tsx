import Link from "next/link";
import { Shield, CheckCircle, Lock, Globe, Award, Users } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { auth } from "~/server/auth";

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="from-primary/10 to-background relative overflow-hidden bg-gradient-to-b px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl text-center">
          <div className="mb-6 flex justify-center">
            <Shield className="text-primary h-20 w-20" />
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Welcome to <span className="text-primary">CertifyChain</span>
          </h1>
          <p className="text-muted-foreground mx-auto mb-8 max-w-2xl text-lg sm:text-xl">
            The blockchain-powered platform for secure certificate issuance,
            verification, and management. Authenticate credentials with
            immutable blockchain technology.
          </p>
          {!session && (
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <Button asChild size="lg">
                <Link href="/auth/signin">Get Started</Link>
              </Button>
              <Button asChild variant="outline" size="lg">
                <Link href="/verify">Verify Certificate</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Features Section */}
      <section className="px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Why Choose CertifyChain?
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Built on blockchain technology for ultimate security and
              transparency
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {/* Feature 1 */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Lock className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Blockchain Security</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  All certificates are stored on an immutable blockchain ledger,
                  ensuring tamper-proof records and complete transparency.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 2 */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <CheckCircle className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Instant Verification</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Verify any certificate in seconds with just the certificate
                  ID. No middleman required for authentication.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 3 */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Users className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Entity Registration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Educational institutions, organizations, and authorities can
                  register as issuing entities and manage their certificates.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 4 */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Award className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Digital Certificates</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Store electronic copies of certificates securely with
                  cryptographic hashing for data integrity.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 5 */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Globe className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Web3 Integration</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Connect your wallet to register, issue, and manage
                  certificates on the decentralized web.
                </CardDescription>
              </CardContent>
            </Card>

            {/* Feature 6 */}
            <Card className="transition-shadow hover:shadow-md">
              <CardHeader>
                <div className="bg-primary/10 mb-4 flex h-12 w-12 items-center justify-center rounded-lg">
                  <Shield className="text-primary h-6 w-6" />
                </div>
                <CardTitle>Revocation Control</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Issuing entities have full control to revoke certificates when
                  needed, with all actions recorded on-chain.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-muted/50 px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              How It Works
            </h2>
            <p className="text-muted-foreground mt-4 text-lg">
              Simple steps to get started with CertifyChain
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            <div className="text-center">
              <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                1
              </div>
              <h3 className="mb-2 text-xl font-semibold">
                Connect Your Wallet
              </h3>
              <p className="text-muted-foreground">
                Use MetaMask or any Web3 wallet to connect and register as an
                issuing entity.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                2
              </div>
              <h3 className="mb-2 text-xl font-semibold">Issue Certificates</h3>
              <p className="text-muted-foreground">
                Create and issue certificates to recipients with
                blockchain-backed verification.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary text-primary-foreground mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full text-2xl font-bold">
                3
              </div>
              <h3 className="mb-2 text-xl font-semibold">Verify Anytime</h3>
              <p className="text-muted-foreground">
                Anyone can verify certificate authenticity instantly using the
                certificate ID.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!session && (
        <section className="px-4 py-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
              Ready to Get Started?
            </h2>
            <p className="text-muted-foreground mb-8 text-lg">
              Join CertifyChain today and experience the future of certificate
              management.
            </p>
            <Button asChild size="lg">
              <Link href="/auth/signin">Connect Wallet & Start</Link>
            </Button>
          </div>
        </section>
      )}
    </div>
  );
}
