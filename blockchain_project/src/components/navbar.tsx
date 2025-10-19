"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "next-themes";
import { Moon, Sun, Shield, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "~/components/ui/button";
import { Card, CardContent } from "~/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";

export function Navbar() {
  const { data: session } = useSession();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-background border-b">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <Link href="/" className="flex items-center gap-2">
              <Shield className="text-primary h-8 w-8" />
              <span className="text-xl font-bold">CertifyChain</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex md:items-center md:gap-6">
            <Link
              href="/verify"
              className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
            >
              Verify Certificate
            </Link>

            {session ? (
              <>
                <Link
                  href="/dashboard"
                  className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                >
                  Dashboard
                </Link>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <div className="bg-primary text-primary-foreground flex h-8 w-8 items-center justify-center rounded-full">
                        {session.user.walletAddress?.slice(0, 2).toUpperCase()}
                      </div>
                      <span className="max-w-[120px] truncate">
                        {session.user.walletAddress
                          ? `${session.user.walletAddress.slice(0, 6)}...${session.user.walletAddress.slice(-4)}`
                          : "User"}
                      </span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuLabel>Connected Wallet</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <div className="px-2 py-1.5 font-mono text-sm">
                      {session.user.walletAddress
                        ? `${session.user.walletAddress.slice(0, 8)}...${session.user.walletAddress.slice(-6)}`
                        : ""}
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => signOut()}>
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Button asChild>
                <Link href="/auth/signin">Connect Wallet</Link>
              </Button>
            )}

            {/* Theme Toggle */}
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center gap-2 md:hidden">
            <Button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              variant="outline"
              size="icon"
              aria-label="Toggle theme"
              suppressHydrationWarning
            >
              <Sun className="h-5 w-5 scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
              <Moon className="absolute h-5 w-5 scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
            </Button>
            <Button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              variant="outline"
              size="icon"
            >
              {mobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="border-t py-4 md:hidden">
            <div className="flex flex-col gap-4">
              <Link
                href="/verify"
                className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Verify Certificate
              </Link>

              {session ? (
                <>
                  <Link
                    href="/dashboard"
                    className="text-muted-foreground hover:text-foreground text-sm font-medium transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <Card>
                    <CardContent className="flex flex-col gap-2 pt-4">
                      <div className="text-muted-foreground text-xs">
                        Connected Wallet
                      </div>
                      <div className="font-mono text-sm">
                        {session.user.walletAddress
                          ? `${session.user.walletAddress.slice(0, 8)}...${session.user.walletAddress.slice(-6)}`
                          : ""}
                      </div>
                      <Button
                        onClick={() => {
                          void signOut();
                          setMobileMenuOpen(false);
                        }}
                        variant="destructive"
                        className="mt-2"
                      >
                        Disconnect
                      </Button>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Button asChild className="w-full">
                  <Link
                    href="/auth/signin"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Connect Wallet
                  </Link>
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
