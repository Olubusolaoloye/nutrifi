import { Password } from "@convex-dev/auth/providers/Password";
import { convexAuth } from "@convex-dev/auth/server";

// Email + password to start. Phone OTP can be added later with an SMS provider (e.g. Termii).
export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [Password],
});
