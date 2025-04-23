import { NextResponse } from "next/server";
import { verifyToken } from "@/app/lib/email";
import { prisma } from "@/app/lib/prisma";
import { signIn } from "next-auth/react";

// export async function GET(request: Request) {
//   const { searchParams } = new URL(request.url);
//   const token = searchParams.get("token");

//   if (!token) {
//     return NextResponse.json({ error: "Missing token" }, { status: 400 });
//   }

// //   const email = await verifyToken(token);
// //   if (!email) {
// //     return NextResponse.json({ error: "Invalid token" }, { status: 400 });
// //   }

//     // Verify token and get associated email
//     const email = await verifyToken(token);
//     if (!email) {
//       return NextResponse.json({ error: "Invalid token" }, { status: 400 });
//     }
  
//     // Update the user's emailVerified field
//     await prisma.user.update({
//       where: { email },
//       data: { emailVerified: new Date() }, // Set verification timestamp
//     });
  
//     // Delete the used verification token (important!)
//     await prisma.verificationToken.delete({
//       where: { token },
//     });


//   return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/auth/signin?verified=1`);
// }




export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get("token");
  
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }
  
    // Verify the token and get the associated email
    const email = await verifyToken(token);
    if (!email) {
      return NextResponse.json({ error: "Invalid token" }, { status: 400 });
    }

    await prisma.user.update({
      where: { email },
      data: { emailVerified: new Date() }, // Set verification timestamp
    });
  
    // Automatically log in the user
    const result = await signIn("credentials", {
      email:email,
      password:"y9BUS9+Z&!?*isZ", // Password is not needed for automatic login
      redirect: false, // Disable automatic redirect
    });
  
    // if (result?.error) {
    //   return NextResponse.json({ error: "Failed to log in" }, { status: 400 });
    // }
  
    // Redirect the user to the dashboard
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard`);
  }