import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { publicProcedure, protectedProcedure, router } from "./trpc";
import * as db from "./db";
import * as auth from "./auth";

const COOKIE_NAME = "auth_token";

function getCookieOptions(isProduction: boolean) {
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  };
}

export const appRouter = router({
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
          const user = await auth.registerUser(input.email, input.password, input.name);
          const token = await auth.generateToken(user);
          
          // Set cookie
          const cookieOptions = getCookieOptions(process.env.NODE_ENV === 'production');
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
        const user = await auth.loginUser(input.email, input.password);
        if (!user) {
          throw new TRPCError({
            code: "UNAUTHORIZED",
            message: "Invalid email or password",
          });
        }
        
        const token = await auth.generateToken(user);
        
        // Set cookie
        const cookieOptions = getCookieOptions(process.env.NODE_ENV === 'production');
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);
        
        return { success: true, user };
      }),
    
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getCookieOptions(process.env.NODE_ENV === 'production');
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
        return { 
          totalSubscribers: 0, 
          totalEditions: 0, 
          totalOpens: 0,
          totalEmailsSent: 0,
          recentEditions: []
        };
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

  // Article Library - newsletter-scoped articles that can be reused
  articles: router({
    // Get all articles for a newsletter
    list: protectedProcedure
      .input(z.object({ newsletterId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getArticlesByNewsletterId } = await import("./articleLibraryDb");
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return getArticlesByNewsletterId(input.newsletterId);
      }),

    // Get single article
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getArticleById } = await import("./articleLibraryDb");
        const article = await getArticleById(input.id);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        const newsletter = await db.getNewsletterById(article.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return article;
      }),

    // Create new article in library
    create: protectedProcedure
      .input(z.object({
        newsletterId: z.number(),
        category: z.string().optional(),
        title: z.string().min(1),
        slug: z.string().optional(),
        content: z.string().min(1),
        excerpt: z.string().optional(),
        imageUrl: z.string().optional(),
        imageCaption: z.string().optional(),
        status: z.enum(["draft", "published", "archived"]).optional(),
        authorId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createArticle } = await import("./articleLibraryDb");
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        // Generate slug from title if not provided
        const slug = input.slug || input.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return createArticle({ ...input, slug, status: input.status || "draft" });
      }),

    // Update article
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
        status: z.enum(["draft", "published", "archived"]).optional(),
        authorId: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getArticleById, updateArticle } = await import("./articleLibraryDb");
        const { id, ...updates } = input;
        const article = await getArticleById(id);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        const newsletter = await db.getNewsletterById(article.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await updateArticle(id, updates);
        return { success: true };
      }),

    // Delete article
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getArticleById, deleteArticle } = await import("./articleLibraryDb");
        const article = await getArticleById(input.id);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        const newsletter = await db.getNewsletterById(article.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await deleteArticle(input.id);
        return { success: true };
      }),

    // Generate article with AI
    generateWithAI: protectedProcedure
      .input(z.object({
        newsletterId: z.number(),
        topic: z.string().min(1),
        category: z.string().optional(),
        tone: z.enum(["professional", "casual", "humorous", "serious"]).optional(),
        authorId: z.number().optional(),
        allowEmojis: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createArticle } = await import("./articleLibraryDb");
        const { generateSingleArticle } = await import("./aiContent");
        const { getAuthorById } = await import("./authorsDb");
        
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }

        // Get author style if authorId is provided
        let authorStyle: { name: string; writingStyle: string; tone: string; personality?: string } | undefined;
        if (input.authorId) {
          const author = await getAuthorById(input.authorId);
          if (author && author.newsletterId === input.newsletterId) {
            authorStyle = {
              name: author.name,
              writingStyle: author.writingStyle,
              tone: author.tone,
              personality: author.personality || undefined,
            };
          }
        }

        // Generate article with AI
        const generated = await generateSingleArticle({
          topic: input.topic,
          category: input.category,
          tone: input.tone || "professional",
          allowEmojis: input.allowEmojis || false,
          authorStyle,
        });

        // Save to library
        const slug = generated.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        return createArticle({
          newsletterId: input.newsletterId,
          title: generated.title,
          content: generated.content,
          excerpt: generated.excerpt,
          category: input.category,
          slug,
          status: "draft",
          authorId: input.authorId,
        });
      }),
  }),

  // Edition-Article linking
  editionArticles: router({
    // Get articles for an edition
    list: protectedProcedure
      .input(z.object({ editionId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getArticlesForEdition } = await import("./articleLibraryDb");
        const edition = await db.getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return getArticlesForEdition(input.editionId);
      }),

    // Add article to edition
    add: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        articleId: z.number(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { addArticleToEdition, getArticleById } = await import("./articleLibraryDb");
        const edition = await db.getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const article = await getArticleById(input.articleId);
        if (!article) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Article not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await addArticleToEdition(input.editionId, input.articleId, input.displayOrder);
        return { success: true };
      }),

    // Remove article from edition
    remove: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        articleId: z.number(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { removeArticleFromEdition } = await import("./articleLibraryDb");
        const edition = await db.getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await removeArticleFromEdition(input.editionId, input.articleId);
        return { success: true };
      }),

    // Reorder articles in edition
    reorder: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        articleIds: z.array(z.number()),
      }))
      .mutation(async ({ input, ctx }) => {
        const { reorderEditionArticles } = await import("./articleLibraryDb");
        const edition = await db.getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await db.getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await reorderEditionArticles(input.editionId, input.articleIds);
        return { success: true };
      }),
  }),

  sections: router({
    list: protectedProcedure
      .input(z.object({ editionId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getSectionsByEdition } = await import("./sectionsDb");
        const { getEditionById } = await import("./db");
        const edition = await getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const { getNewsletterById } = await import("./db");
        const newsletter = await getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return getSectionsByEdition(input.editionId);
      }),

    create: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        sectionType: z.enum(["header", "text", "article", "quote", "image", "cta", "divider", "list", "code", "video"]),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        imageCaption: z.string().optional(),
        buttonText: z.string().optional(),
        buttonUrl: z.string().optional(),
        displayOrder: z.number().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createSection } = await import("./sectionsDb");
        const { getEditionById, getNewsletterById } = await import("./db");
        const edition = await getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return createSection(input);
      }),

    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        subtitle: z.string().optional(),
        content: z.string().optional(),
        imageUrl: z.string().optional(),
        imageCaption: z.string().optional(),
        buttonText: z.string().optional(),
        buttonUrl: z.string().optional(),
        isVisible: z.boolean().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { updateSection, getSectionById } = await import("./sectionsDb");
        const { getEditionById, getNewsletterById } = await import("./db");
        const section = await getSectionById(input.id);
        if (!section) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Section not found" });
        }
        const edition = await getEditionById(section.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        const { id, ...updateData } = input;
        return updateSection(id, updateData);
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { deleteSection, getSectionById } = await import("./sectionsDb");
        const { getEditionById, getNewsletterById } = await import("./db");
        const section = await getSectionById(input.id);
        if (!section) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Section not found" });
        }
        const edition = await getEditionById(section.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        await deleteSection(input.id);
        return { success: true };
      }),

    reorder: protectedProcedure
      .input(z.object({
        updates: z.array(z.object({
          id: z.number(),
          displayOrder: z.number(),
        })),
      }))
      .mutation(async ({ input, ctx }) => {
        const { reorderSections, getSectionById } = await import("./sectionsDb");
        const { getEditionById, getNewsletterById } = await import("./db");
        // Verify ownership of first section (assumes all sections belong to same edition)
        if (input.updates.length > 0) {
          const section = await getSectionById(input.updates[0].id);
          if (!section) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Section not found" });
          }
          const edition = await getEditionById(section.editionId);
          if (!edition) {
            throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
          }
          const newsletter = await getNewsletterById(edition.newsletterId);
          if (!newsletter || newsletter.userId !== ctx.user.id) {
            throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
          }
        }
        await reorderSections(input.updates);
        return { success: true };
      }),

    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { duplicateSection, getSectionById } = await import("./sectionsDb");
        const { getEditionById, getNewsletterById } = await import("./db");
        const section = await getSectionById(input.id);
        if (!section) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Section not found" });
        }
        const edition = await getEditionById(section.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return duplicateSection(input.id);
      }),

    generateWithAI: protectedProcedure
      .input(z.object({
        editionId: z.number(),
        sectionType: z.enum(["header", "text", "article", "quote", "cta", "list"]),
        prompt: z.string(),
        tone: z.enum(["professional", "casual", "friendly", "formal"]).optional(),
        length: z.enum(["short", "medium", "long"]).optional(),
        context: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { generateSectionContent } = await import("./sectionAI");
        const { createSection } = await import("./sectionsDb");
        const { getEditionById, getNewsletterById } = await import("./db");
        const edition = await getEditionById(input.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        
        // Generate content with AI
        const generated = await generateSectionContent({
          sectionType: input.sectionType,
          prompt: input.prompt,
          tone: input.tone,
          length: input.length,
          context: input.context,
        });
        
        // Create section with generated content
        const section = await createSection({
          editionId: input.editionId,
          sectionType: input.sectionType,
          ...generated,
          aiGenerated: true,
          aiPrompt: input.prompt,
          displayOrder: 999, // Will be reordered by user
        });
        
        return section;
      }),

    improveWithAI: protectedProcedure
      .input(z.object({
        id: z.number(),
        instructions: z.string(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { improveSectionContent } = await import("./sectionAI");
        const { updateSection, getSectionById } = await import("./sectionsDb");
        const { getEditionById, getNewsletterById } = await import("./db");
        const section = await getSectionById(input.id);
        if (!section) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Section not found" });
        }
        const edition = await getEditionById(section.editionId);
        if (!edition) {
          throw new TRPCError({ code: "NOT_FOUND", message: "Edition not found" });
        }
        const newsletter = await getNewsletterById(edition.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        
        const improvedContent = await improveSectionContent(
          section.content || "",
          input.instructions
        );
        
        return updateSection(input.id, { content: improvedContent });
      }),
  }),

  authors: router({
    // List all authors for a newsletter
    list: protectedProcedure
      .input(z.object({ newsletterId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAuthorsByNewsletter } = await import("./authorsDb");
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new Error("Newsletter not found");
        }
        return getAuthorsByNewsletter(input.newsletterId);
      }),

    // Get single author
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getAuthorById } = await import("./authorsDb");
        const author = await getAuthorById(input.id);
        if (!author) {
          return null;
        }
        const newsletter = await db.getNewsletterById(author.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
        }
        return author;
      }),

    // Create new author
    create: protectedProcedure
      .input(z.object({
        newsletterId: z.number(),
        name: z.string().min(1),
        bio: z.string().optional(),
        writingStyle: z.string().min(1),
        tone: z.string().min(1),
        personality: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { createAuthor } = await import("./authorsDb");
        const newsletter = await db.getNewsletterById(input.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new Error("Newsletter not found");
        }
        return createAuthor(input);
      }),

    // Update author
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        bio: z.string().optional(),
        writingStyle: z.string().min(1).optional(),
        tone: z.string().min(1).optional(),
        personality: z.string().optional(),
      }))
      .mutation(async ({ input, ctx }) => {
        const { getAuthorById, updateAuthor } = await import("./authorsDb");
        const author = await getAuthorById(input.id);
        if (!author) {
          throw new Error("Author not found");
        }
        const newsletter = await db.getNewsletterById(author.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        const { id, ...updates } = input;
        return updateAuthor(id, updates);
      }),

    // Delete author
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const { getAuthorById, deleteAuthor } = await import("./authorsDb");
        const author = await getAuthorById(input.id);
        if (!author) {
          throw new Error("Author not found");
        }
        const newsletter = await db.getNewsletterById(author.newsletterId);
        if (!newsletter || newsletter.userId !== ctx.user.id) {
          throw new Error("Unauthorized");
        }
        await deleteAuthor(input.id);
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
