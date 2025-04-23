
// app/actions.ts (server action)
import { redirect } from "next/navigation";

export async function handleSignIn() {
  // Redirect to NextAuth’s sign-in route
  redirect("/api/auth/signin?callbackUrl=/protected");
}
