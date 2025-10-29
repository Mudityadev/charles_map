import type { NextAuthConfig } from "next-auth";

// NOTE: EmailProvider (next-auth/providers/email) depends on nodemailer.
// To keep the Vercel build simple and avoid optional peer dependency conflicts,
// the Email provider is currently disabled. If you want to enable email sign-in,
// either install a compatible `nodemailer` version on your project, or re-enable
// the provider and ensure Vercel can install nodemailer.

export const authConfig: NextAuthConfig = {
  providers: [
    // EmailProvider({
    //   server: {
    //     host: process.env.EMAIL_SERVER_HOST ?? "localhost",
    //     port: Number(process.env.EMAIL_SERVER_PORT ?? 1025),
    //     auth: {
    //       user: process.env.EMAIL_SERVER_USER ?? "user",
    //       pass: process.env.EMAIL_SERVER_PASSWORD ?? "password"
    //     }
    //   },
    //   from: process.env.EMAIL_FROM ?? "support@example.com"
    // })
  ],
  callbacks: {
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "demo-user";
        (session.user as any).orgId = token.orgId ?? "demo-org";
        (session.user as any).role = token.role ?? "admin";
      }
      return session;
    },
    async jwt({ token }) {
      token.orgId = token.orgId ?? "demo-org";
      token.role = token.role ?? "admin";
      return token;
    }
  }
};
