import { type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { verifyMessage } from "ethers";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      walletAddress?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }

  interface User {
    id: string;
    walletAddress?: string;
    name?: string | null;
    email?: string | null;
  }
}

export const authOptions: NextAuthConfig = {
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

          // Return user object
          return {
            id: address.toLowerCase(),
            walletAddress: address.toLowerCase(),
            name: address.slice(0, 6) + "..." + address.slice(-4),
          };
        } catch (error) {
          console.error("Error verifying signature:", error);
          return null;
        }
      },
    }),
  ],
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
      if (session.user) {
        session.user.id = token.id as string;
        session.user.walletAddress = token.walletAddress as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/auth/signin",
  },
};
