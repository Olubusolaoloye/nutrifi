import { ConvexError } from "convex/values";

/** A user-facing message for anything thrown by a mutation, action or the app. */
export function errorText(err: unknown): string {
  if (err instanceof ConvexError) return String(err.data);
  if (err instanceof Error) return err.message;
  return "Something went wrong. Please try again.";
}
