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
      // Add GitHub user id and major status to session
      if (session?.user) {
        session.user.id = token.sub!
        session.user.githubId = token.sub! // Add GitHub ID for API calls
        session.user.needsOnboarding = token.needsOnboarding as boolean
      }
      return session
    },
    async jwt({ token, user, account, trigger }) {
      if (user) {
        token.uid = user.id
      }
      
      // Check if user needs onboarding (no major selected)
      // Force fresh check when session is being updated
      try {
        const response = await fetch(`http://127.0.0.1:8000/api/users/${token.sub}`)
        if (response.ok) {
          const userData = await response.json()
          const needsOnboarding = !userData.major
          
          console.log(`JWT Callback - User ${token.sub}:`, {
            trigger,
            major: userData.major,
            needsOnboarding,
            prevNeedsOnboarding: token.needsOnboarding
          })
          
          token.needsOnboarding = needsOnboarding
        } else {
          console.error(`Failed to fetch user data for ${token.sub}`)
          token.needsOnboarding = true // Default to onboarding if we can't check
        }
      } catch (error) {
        console.error("Error checking user major:", error)
        token.needsOnboarding = true // Default to onboarding if we can't check
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