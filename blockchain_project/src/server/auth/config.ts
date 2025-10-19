import { PrismaAdapter } from "@auth/prisma-adapter";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyMessage } from "ethers";

import { db } from "~/server/db";

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      walletAddress?: string;
    } & DefaultSession["user"];
  }

  interface User {
    walletAddress?: string;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  providers: [
    CredentialsProvider({
      id: "ethereum",
      name: "Ethereum",
      credentials: {
        message: { label: "Message", type: "text" },
        signature: { label: "Signature", type: "text" },
        address: { label: "Address", type: "text" },
      },
      async authorize(credentials) {
        if (!credentials) {
          return null;
        }

        const { message, signature, address } = credentials as {
          message: string;
          signature: string;
          address: string;
        };

        try {
          // Verify the signature
          const recoveredAddress = verifyMessage(message, signature);

          if (recoveredAddress.toLowerCase() !== address.toLowerCase()) {
            return null;
          }

          // Find or create user in database
          let user = await db.user.findUnique({
            where: { walletAddress: address.toLowerCase() },
          });

          user ??= await db.user.create({
            data: {
              walletAddress: address.toLowerCase(),
              name: address.slice(0, 6) + "..." + address.slice(-4),
            },
          });

          return {
            id: user.id,
            walletAddress: user.walletAddress ?? undefined,
            name: user.name,
            email: user.email,
          };
        } catch (error) {
          console.error("Error verifying signature:", error);
          return null;
        }
      },
    }),
  ],
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.walletAddress = user.walletAddress;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id as string,
          walletAddress: token.walletAddress as string,
        },
      };
    },
  },
} satisfies NextAuthConfig;
