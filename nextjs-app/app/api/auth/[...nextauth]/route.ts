import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"
import GoogleProvider from "next-auth/providers/google"

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Save user to backend on sign in
      console.log("=== SIGNIN CALLBACK DEBUG ===")
      console.log("Provider:", account?.provider)
      console.log("User data:", user)
      console.log("Account data:", account)
      console.log("Profile data:", profile)
      
      if (account?.provider === "github" || account?.provider === "google") {
        try {
          console.log("Making API call to backend...")
          const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/auth/user`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-API-Key": process.env.NEXT_PUBLIC_API_KEY!,
            },
            body: JSON.stringify({
              provider: account.provider,
              provider_id: user.id,
              email: user.email || "",
              name: user.name || "",
              avatar_url: user.image || "",
            }),
          })
          
          console.log("Backend response status:", response.status)
          console.log("Backend response ok:", response.ok)
          
          if (!response.ok) {
            const errorText = await response.text()
            console.error("Failed to save user to backend:", errorText)
          } else {
            const responseData = await response.json()
            console.log("Backend response data:", responseData)
          }
        } catch (error) {
          console.error("Error saving user:", error)
          console.error("Error details:", error.message, error.stack)
        }
      }
      console.log("=== END SIGNIN CALLBACK DEBUG ===")
      return true
    },
    async session({ session, token }) {
      // Add provider-specific user id to session
      if (session?.user) {
        session.user.id = token.sub!
        // For backward compatibility, keep githubId but it now contains the provider ID
        session.user.githubId = token.sub! // This is actually the provider ID (GitHub or Google)
        session.user.provider = token.provider as string
      }
      // Add the raw JWT token to the session so we can use it for API auth
      ;(session as any).accessToken = token
      return session
    },
    async jwt({ token, user, account, trigger }) {
      if (user && account) {
        token.uid = user.id
        token.provider = account.provider
      }
      
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/", // Use the hero page as sign in page
  },
})

export { handler as GET, handler as POST }