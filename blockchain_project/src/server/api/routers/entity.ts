import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const entityRouter = createTRPCRouter({
  // Register a new entity
  register: protectedProcedure
    .input(
      z.object({
        walletAddress: z.string(),
        name: z.string(),
        description: z.string().optional(),
        organizationType: z.string().optional(),
        country: z.string().optional(),
        website: z
          .string()
          .transform((val) => {
            if (!val) return val;
            // Add https:// if no protocol specified
            return val.match(/^https?:\/\//) ? val : `https://${val}`;
          })
          .pipe(z.string().url())
          .optional()
          .nullable(),
        email: z.string().email().optional().nullable(),
        phone: z.string().optional(),
        address: z.string().optional(),
        registrationNumber: z.string().optional(),
        taxId: z.string().optional(),
        blockchainId: z.string().optional(),
        transactionHash: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Check if entity already exists
      const existing = await ctx.db.issuingEntity.findUnique({
        where: { walletAddress: input.walletAddress },
      });

      if (existing) {
        throw new Error("Entity with this wallet address already exists");
      }

      return ctx.db.issuingEntity.create({
        data: {
          walletAddress: input.walletAddress,
          name: input.name,
          description: input.description,
          organizationType: input.organizationType,
          country: input.country,
          website: input.website ?? undefined,
          email: input.email ?? undefined,
          phone: input.phone,
          address: input.address,
          registrationNumber: input.registrationNumber,
          taxId: input.taxId,
          blockchainId: input.blockchainId,
          transactionHash: input.transactionHash,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Get entity by wallet address
  getByWallet: publicProcedure
    .input(z.object({ walletAddress: z.string() }))
    .query(async ({ ctx, input }) => {
      return ctx.db.issuingEntity.findUnique({
        where: { walletAddress: input.walletAddress },
        include: {
          certificates: {
            orderBy: { issuedAt: "desc" },
          },
        },
      });
    }),

  // Get current user's entity
  getMy: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.issuingEntity.findFirst({
      where: { userId: ctx.session.user.id },
      include: {
        certificates: {
          orderBy: { issuedAt: "desc" },
        },
      },
    });
  }),

  // Update entity
  update: protectedProcedure
    .input(
      z.object({
        id: z.string(),
        name: z.string().optional(),
        description: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Ensure user owns this entity
      const entity = await ctx.db.issuingEntity.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      if (!entity) {
        throw new Error("Entity not found or unauthorized");
      }

      return ctx.db.issuingEntity.update({
        where: { id: input.id },
        data: {
          name: input.name,
          description: input.description,
        },
      });
    }),

  // Get all entities (admin)
  getAll: publicProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        cursor: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const entities = await ctx.db.issuingEntity.findMany({
        take: input.limit + 1,
        cursor: input.cursor ? { id: input.cursor } : undefined,
        orderBy: { registeredAt: "desc" },
        include: {
          _count: {
            select: { certificates: true },
          },
        },
      });

      let nextCursor: string | undefined = undefined;
      if (entities.length > input.limit) {
        const nextItem = entities.pop();
        nextCursor = nextItem?.id;
      }

      return {
        entities,
        nextCursor,
      };
    }),
});
