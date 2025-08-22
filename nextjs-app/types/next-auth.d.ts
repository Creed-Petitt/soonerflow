import NextAuth, { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      githubId: string  // This is now the provider ID (GitHub or Google)
      googleId?: string  // Add googleId as optional
      provider?: string  // "github" or "google"
    } & DefaultSession["user"]
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    uid?: string
    provider?: string
  }
}