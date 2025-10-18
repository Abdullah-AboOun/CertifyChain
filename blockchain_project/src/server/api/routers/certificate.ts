import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const certificateRouter = createTRPCRouter({
  // Issue a new certificate
  create: protectedProcedure
    .input(
      z.object({
        blockchainId: z.number().optional(),
        certificateHash: z.string(),
        recipientAddress: z.string(),
        recipientName: z.string().optional(),
        metadata: z.string().optional(),
        documentUrl: z.string().optional(),
        transactionHash: z.string().optional(),
        issuerId: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the issuer belongs to the current user
      const entity = await ctx.db.issuingEntity.findFirst({
        where: {
          id: input.issuerId,
          userId: ctx.session.user.id,
        },
      });

      if (!entity) {
        throw new Error("Entity not found or unauthorized");
      }

      return ctx.db.certificate.create({
        data: {
          blockchainId: input.blockchainId,
          certificateHash: input.certificateHash,
          recipientAddress: input.recipientAddress,
          recipientName: input.recipientName,
          metadata: input.metadata,
          documentUrl: input.documentUrl,
          transactionHash: input.transactionHash,
          issuerId: input.issuerId,
        },
      });
    }),

  // Get certificate by ID
  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.certificate.findUnique({
        where: { id: input.id },
        include: {
          issuer: true,
        },
      });
    }),

  // Get certificate by blockchain ID
  getByBlockchainId: publicProcedure
    .input(z.object({ blockchainId: z.number() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.certificate.findUnique({
        where: { blockchainId: input.blockchainId },
        include: {
          issuer: true,
        },
      });
    }),

  // Get all certificates for an entity
  getByEntity: publicProcedure
    .input(z.object({ issuerId: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.certificate.findMany({
        where: { issuerId: input.issuerId },
        orderBy: { issuedAt: "desc" },
        include: {
          issuer: true,
        },
      });
    }),

  // Get certificates for current user's entity
  getMy: protectedProcedure.query(async ({ ctx }) => {
    const entity = await ctx.db.issuingEntity.findFirst({
      where: { userId: ctx.session.user.id },
    });

    if (!entity) {
      return [];
    }

    return ctx.db.certificate.findMany({
      where: { issuerId: entity.id },
      orderBy: { issuedAt: "desc" },
      include: {
        issuer: true,
      },
    });
  }),

  // Revoke a certificate
  revoke: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        revokeTxHash: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Get the certificate
      const certificate = await ctx.db.certificate.findUnique({
        where: { id: input.id },
        include: { issuer: true },
      });

      if (!certificate) {
        throw new Error("Certificate not found");
      }

      // Verify the issuer belongs to the current user
      if (certificate.issuer.userId !== ctx.session.user.id) {
        throw new Error("Unauthorized");
      }

      return ctx.db.certificate.update({
        where: { id: input.id },
        data: {
          isRevoked: true,
          revokedAt: new Date(),
          revokeTxHash: input.revokeTxHash,
        },
      });
    }),

  // Search certificates
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        recipientAddress: z.string().optional(),
        isRevoked: z.boolean().optional(),
        limit: z.number().min(1).max(100).default(10),
        cursor: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const certificates = await ctx.db.certificate.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        where: {
          AND: [
            input.recipientAddress
              ? { recipientAddress: input.recipientAddress }
              : {},
            input.isRevoked !== undefined ? { isRevoked: input.isRevoked } : {},
            input.query
              ? {
                  OR: [
                    { recipientName: { contains: input.query } },
                    { certificateHash: { contains: input.query } },
                  ],
                }
              : {},
          ],
        },
        orderBy: { issuedAt: "desc" },
        include: {
          issuer: true,
        },
      });

      let nextCursor: number | undefined = undefined;
      if (certificates.length > input.limit) {
        const nextItem = certificates.pop();
        nextCursor = nextItem?.id;
      }

      return {
        certificates,
        nextCursor,
      };
    }),

  // Verify certificate hash
  verifyHash: publicProcedure
    .input(
      z.object({
        certificateHash: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      return ctx.db.certificate.findFirst({
        where: { certificateHash: input.certificateHash },
        include: {
          issuer: true,
        },
      });
    }),
});
