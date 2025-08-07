import NextAuth from "next-auth"
import GithubProvider from "next-auth/providers/github"

const handler = NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_ID!,
      clientSecret: process.env.GITHUB_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // Save user to backend on sign in
      if (account?.provider === "github") {
        try {
          const response = await fetch("http://127.0.0.1:8000/api/auth/user", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              github_id: user.id,
              email: user.email || "",
              name: user.name || "",
              avatar_url: user.image || "",
            }),
          })
          
          if (!response.ok) {
            console.error("Failed to save user to backend")
          }
        } catch (error) {
          console.error("Error saving user:", error)
        }
      }
      return true
    },
    async session({ session, token }) {
      // Add GitHub user id to session
      if (session?.user) {
        session.user.id = token.sub!
        session.user.githubId = token.sub! // Add GitHub ID for API calls
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.uid = user.id
      }
      return token
    },
  },
  session: {
    strategy: "jwt",
  },
})

export { handler as GET, handler as POST }