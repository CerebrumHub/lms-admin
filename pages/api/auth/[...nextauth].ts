import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_ID!,
      clientSecret: process.env.GOOGLE_SECRET!,
      authorization: {
        params: {
          prompt: 'consent',
          access_type: 'offline',
          response_type: 'code',
          scope: 'openid email profile https://www.googleapis.com/auth/admin.directory.group https://www.googleapis.com/auth/admin.directory.group.member https://www.googleapis.com/auth/calendar https://www.googleapis.com/auth/calendar.events'
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user, account, profile, isNewUser }) {
      if (account) {
        token.refresh_token = account.refresh_token;
        token.access_token = account.access_token;
        token.token_type = account.token_type;
        token.id_token = account.id_token;
        token.scope = account.scope;
        token.expiry_date = account.expires_at;
      }

      return token;
    }
  },
  session: { strategy: 'jwt' },
  secret: process.env.SECRET
});
