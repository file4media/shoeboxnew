import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import * as db from "./db";
import * as standaloneAuth from "./standaloneAuth";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    
    register: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string().min(8),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        try {
          const user = await standaloneAuth.registerUser(input.email, input.password, input.name);
          const token = await standaloneAuth.generateToken(user);
          
          // Set cookie
          const cookieOptions = getSessionCookieOptions(ctx.req);
          ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
          
          return { success: true, user };
        } catch (error) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error instanceof Error ? error.message : "Registration failed",
          });
        }
      }),
    
    login: publicProcedure
      .input(z.object({
        email: z.string().email(),
        password: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const user = await standaloneAuth.loginUser(input.email, input.password);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }
        
        const token = await standaloneAuth.generateToken(user);
        
        // Set cookie
        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        
        return { success: true, user };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  newsletters: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getNewslettersByUserId(ctx.user.id);
    }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const newsletter = await db.getNewsletterById(input.id);
        if (!newsletter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
        }
        if (newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return newsletter;
      }),

    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1, "Name is required"),
        description: z.string().optional(),
        fromName: z.string().min(1, "From name is required"),
        fromEmail: z.string().email("Valid email is required"),
        replyToEmail: z.string().email().optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        welcomeEmailSubject: z.string().optional(),
        welcomeEmailContent: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        return db.createNewsletter({
          ...input,
          userId: ctx.user.id,
        });
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        fromName: z.string().min(1).optional(),
        fromEmail: z.string().email().optional(),
        replyToEmail: z.string().email().optional(),
        logoUrl: z.string().optional(),
        primaryColor: z.string().optional(),
        welcomeEmailSubject: z.string().optional(),
        welcomeEmailContent: z.string().optional(),
        sendWelcomeEmail: z.boolean().optional(),
        isActive: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        const newsletter = await db.getNewsletterById(id);
        if (!newsletter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
        }
        if (newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await db.updateNewsletter(id, updates);
        return { success: true };
      }),

    getAnalytics: protectedProcedure
      .input(z.object({ newsletterId: z.number() }))
      .query(async ({ input, ctx }) => {
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        // TODO: Implement newsletter-level analytics
        return { totalSubscribers: 0, totalEditions: 0, totalOpens: 0 };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const newsletter = await db.getNewsletterById(input.id);
        if (!newsletter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
        }
        if (newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await db.deleteNewsletter(input.id);
        return { success: true };
      }),
  }),

  subscribers: router({
    getByNewsletter: protectedProcedure
      .input(z.object({ newsletterId: z.number() }))
      .query(async ({ input, ctx }) => {
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
        }
        if (newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return db.getNewsletterSubscribers(input.newsletterId);
      }),

    add: protectedProcedure
      .input(z.object({
        newsletterId: z.number(),
        email: z.string().email("Valid email is required"),
        name: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
        }
        if (newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        let subscriber = await db.getSubscriberByEmail(input.email);
        if (!subscriber) {
          const subscriberId = await db.createSubscriber({
            email: input.email,
            name: input.name,
          });
          subscriber = await db.getSubscriberByEmail(input.email);
          if (!subscriber) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create subscriber" });
        }

        await db.subscribeToNewsletter(input.newsletterId, subscriber.id);
        
        // Send welcome email
        const { sendWelcomeEmail } = await import("./welcomeEmail");
        const host = typeof ctx.req.get === 'function' ? ctx.req.get("host") : "localhost:3000";
        const baseUrl = `${ctx.req.protocol}://${host}`;
        await sendWelcomeEmail(newsletter, subscriber.email, subscriber.name || undefined, baseUrl);
        
        return { success: true, subscriber };
      }),

    remove: protectedProcedure
      .input(z.object({
        newsletterId: z.number(),
        subscriberId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
        }
        if (newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        await db.unsubscribeFromNewsletter(input.newsletterId, input.subscriberId);
        return { success: true };
      }),

    import: protectedProcedure
      .input(z.object({
        newsletterId: z.number(),
        subscribers: z.array(z.object({
          email: z.string().email(),
          name: z.string().optional(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
        }
        if (newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        const results = {
          added: 0,
          skipped: 0,
          errors: [] as string[],
        };

        for (const sub of input.subscribers) {
          try {
            let subscriber = await db.getSubscriberByEmail(sub.email);
            if (!subscriber) {
              const subscriberId = await db.createSubscriber(sub);
              subscriber = await db.getSubscriberByEmail(sub.email);
              if (!subscriber) throw new Error('Failed to create subscriber');
            }
            await db.subscribeToNewsletter(input.newsletterId, subscriber.id);
            results.added++;
          } catch (error) {
            results.errors.push(`Failed to add ${sub.email}: ${error}`);
            results.skipped++;
          }
        }

        return results;
      }),
  }),

  editions: router({
    list: protectedProcedure
      .input(z.object({ newsletterId: z.number() }))
      .query(async ({ input, ctx }) => {
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
        }
        if (newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return db.getEditionsByNewsletterId(input.newsletterId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const edition = await db.getEditionById(input.id);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return edition;
      }),

    create: protectedProcedure
      .input(z.object({
        newsletterId: z.number(),
        subject: z.string().min(1, "Subject is required"),
        previewText: z.string().optional(),
        contentMarkdown: z.string().optional(),
        contentHtml: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Newsletter not found" });
        }
        if (newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return db.createEdition(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        subject: z.string().optional(),
        previewText: z.string().optional(),
        introText: z.string().optional(),
        contentMarkdown: z.string().optional(),
        contentHtml: z.string().optional(),
        templateStyle: z.enum(["morning-brew", "minimalist", "bold", "magazine"]).optional(),
        status: z.enum(["draft", "scheduled", "sending", "sent", "failed"]).optional(),
        scheduledAt: z.date().optional(),
        scheduledFor: z.date().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        const edition = await db.getEditionById(id);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await db.updateEdition(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const edition = await db.getEditionById(input.id);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await db.deleteEdition(input.id);
        return { success: true };
      }),

    getAnalytics: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const edition = await db.getEditionById(input.id);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        const stats = await db.getEmailTrackingStats(input.id);
        return stats;
      }),
  }),

  ai: router({
    generateContent: protectedProcedure
      .input(z.object({
        topic: z.string().min(1),
        tone: z.enum(["professional", "casual", "friendly", "formal"]).optional(),
        length: z.enum(["short", "medium", "long"]).optional(),
        includeIntro: z.boolean().optional(),
        includeConclusion: z.boolean().optional(),
        additionalContext: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        const { generateNewsletterContent } = await import("./aiContent");
        return generateNewsletterContent(input);
      }),

    improveContent: protectedProcedure
      .input(z.object({
        content: z.string().min(1),
        instructions: z.string().min(1),
      }))
      .mutation(async ({ input }) => {
        const { improveContent } = await import("./aiContent");
        return improveContent(input.content, input.instructions);
      }),

    generateSubjectLines: protectedProcedure
      .input(z.object({ content: z.string().min(1) }))
      .mutation(async ({ input }) => {
        const { generateSubjectLine } = await import("./aiContent");
        return generateSubjectLine(input.content);
      }),
  }),

  images: router({
    search: protectedProcedure
      .input(z.object({
        query: z.string().min(1),
        page: z.number().optional(),
        perPage: z.number().optional(),
      }))
      .query(async ({ input }) => {
        const { searchImages } = await import("./unsplashService");
        return searchImages(input.query, input.page, input.perPage);
      }),

    random: protectedProcedure
      .input(z.object({ query: z.string().optional() }))
      .query(async ({ input }) => {
        const { getRandomImage } = await import("./unsplashService");
        return getRandomImage(input.query);
      }),

    trackDownload: protectedProcedure
      .input(z.object({ imageId: z.string() }))
      .mutation(async ({ input }) => {
        const { trackImageDownload } = await import("./unsplashService");
        await trackImageDownload(input.imageId);
        return { success: true };
      }),
  }),

  email: router({
    send: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        baseUrl: z.string().url(),
      }))
      .mutation(async ({ input, ctx }) => {
        const edition = await db.getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        const { sendNewsletterEdition } = await import("./email");
        return sendNewsletterEdition(input.editionId, input.baseUrl);
      }),

    sendTest: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        testEmail: z.string().email(),
        baseUrl: z.string().url(),
      }))
      .mutation(async ({ input, ctx }) => {
        const edition = await db.getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        const { sendTestEmail } = await import("./email");
        return sendTestEmail(input.editionId, input.testEmail, input.baseUrl);
      }),
  }),

  articles: router({
    create: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        category: z.string().optional(),
        title: z.string().min(1),
        slug: z.string().optional(),
        content: z.string().min(1),
        excerpt: z.string().optional(),
        imageUrl: z.string().optional(),
        imageCaption: z.string().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const edition = await db.getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        // Generate slug from title if not provided
        const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return db.createArticle({ ...input, slug });
      }),

    list: protectedProcedure
      .input(z.object({ editionId: z.number() }))
      .query(async ({ input, ctx }) => {
        const edition = await db.getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return db.getArticlesByEditionId(input.editionId);
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const article = await db.getArticleById(input.id);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        const edition = await db.getEditionById(article.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return article;
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.string().optional(),
        title: z.string().optional(),
        slug: z.string().optional(),
        content: z.string().optional(),
        excerpt: z.string().optional(),
        imageUrl: z.string().optional(),
        imageCaption: z.string().optional(),
        displayOrder: z.number().optional(),
        isPublished: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { id, ...updates } = input;
        const article = await db.getArticleById(id);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        const edition = await db.getEditionById(article.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await db.updateArticle(id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const article = await db.getArticleById(input.id);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        const edition = await db.getEditionById(article.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await db.deleteArticle(input.id);
        return { success: true };
      }),

    reorder: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        articleIds: z.array(z.number()),
      }))
      .mutation(async ({ input, ctx }) => {
        const edition = await db.getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await db.reorderArticles(input.editionId, input.articleIds);
        return { success: true };
      }),
  }),

  tracking: router({
    recordOpen: publicProcedure
      .input(z.object({
        token: z.string(),
        ipAddress: z.string().optional(),
        userAgent: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        await db.recordEmailOpen(input.token);
        return { success: true };
      }),
  }),
});

export type AppRouter = typeof appRouter;

// Export tracking pixel handler for Express route
export async function handleTrackingPixel(token: string, ipAddress?: string, userAgent?: string) {
  await db.recordEmailOpen(token);
}
