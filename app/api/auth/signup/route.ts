
import { NextResponse } from "next/server";
import { prisma } from "@/app/lib/prisma";
import bcrypt from "bcrypt";
import { sendVerificationEmail } from "@/app/lib/email";
import { SignUpSchema } from "@/app/lib/schemas";

export async function POST(request: Request) {
  const body = await request.json();
  const validatedFields = SignUpSchema.safeParse(body);

  if (!validatedFields.success) {
    return NextResponse.json(
      { error: "Invalid input", details: validatedFields.error },
      { status: 400 }
    );
  }

  const { fullName, email, password } = validatedFields.data;

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    return NextResponse.json(
      { error: "User already exists" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const newUser = await prisma.user.create({
    data: {
      fullName,
      email,
      password: hashedPassword,
    },
  });

  

  return NextResponse.json(
    { message: "User created successfully. Please verify your email!." },
    { status: 201 }
  );
}