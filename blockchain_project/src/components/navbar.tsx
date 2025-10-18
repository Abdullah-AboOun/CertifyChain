"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Moon, Sun, Shield, Menu, X } from "lucide-react";
import { useState } from "react";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="border-b bg-background">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">CertifyChain</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <Link
              href="/verify"
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Verify Certificate
            </Link>

            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  Dashboard
                </Link>
                <div className="relative group">
                  <button className="flex items-center gap-2 rounded-lg border bg-card px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      {session.user.walletAddress?.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="max-w-[120px] truncate">
                      {session.user.walletAddress
                        ? `${session.user.walletAddress.slice(0, 6)}...${session.user.walletAddress.slice(-4)}`
                        : "User"}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-2 hidden w-48 rounded-lg border bg-card p-2 shadow-lg group-hover:block">
                    <div className="px-3 py-2 text-xs text-muted-foreground">
                      Connected Wallet
                    </div>
                    <div className="mb-2 px-3 py-1 text-sm font-mono">
                      {session.user.walletAddress
                        ? `${session.user.walletAddress.slice(0, 8)}...${session.user.walletAddress.slice(-6)}`
                        : ""}
                    </div>
                    <hr className="my-2" />
                    <button
                      onClick={() => signOut()}
                      className="w-full rounded px-3 py-2 text-left text-sm hover:bg-accent"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <Link
                href="/auth/signin"
                className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
              >
                Connect Wallet
              </Link>
            )}

            {/* Theme Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg border bg-card p-2 shadow-sm transition-colors hover:bg-accent"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="rounded-lg border bg-card p-2 shadow-sm transition-colors hover:bg-accent"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-lg border bg-card p-2 shadow-sm transition-colors hover:bg-accent"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link
                href="/verify"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                Verify Certificate
              </Link>

              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <div className="flex flex-col gap-2 rounded-lg border bg-card p-4">
                    <div className="text-xs text-muted-foreground">
                      Connected Wallet
                    </div>
                    <div className="font-mono text-sm">
                      {session.user.walletAddress
                        ? `${session.user.walletAddress.slice(0, 8)}...${session.user.walletAddress.slice(-6)}`
                        : ""}
                    </div>
                    <button
                      onClick={() => {
                        signOut();
                        setMobileMenuOpen(false);
                      }}
                      className="mt-2 rounded bg-destructive px-3 py-2 text-sm text-destructive-foreground hover:bg-destructive/90"
                    >
                      Disconnect
                    </button>
                  </div>
                </>
              ) : (
                <Link
                  href="/auth/signin"
                  className="rounded-lg bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Connect Wallet
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
