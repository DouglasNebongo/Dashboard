
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { randomInt } from 'crypto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

const prisma = new PrismaClient();

export async function createUser(fullName: string, email: string, password: string) {
  const hashedPassword = await bcrypt.hash(password, 12);
  try {
      return prisma.user.create({
        data: {
          fullName,
          email,
          password: hashedPassword,
        },
      });
  }catch(error) {
  if(error instanceof PrismaClientKnownRequestError && error.code === 'P2002'){
    const prismaError = error as PrismaClientKnownRequestError;
    if(prismaError.meta && typeof prismaError.meta === 'object' && 'target' in prismaError.meta){
      const target = prismaError.meta.target;
      if(Array.isArray(target) && target.includes('email')){
      throw new Error('Email address is already taken');
      } else if (typeof target == 'string' && target === 'email'){
        throw new Error('Email address is already taken')
      }
     }
   }
   throw new Error('Failed to create user: ' + (error instanceof Error ? error.message : String(error)));
  }
}

export async function generateVerificationCode(email: string) {
  // Delete existing codes for this email
  await prisma.verificationCode.deleteMany({
    where: { email }
  });

  // Generate 6-digit code
  // Generate a 6-digit numeric code
  const code = String(randomInt(100000, 999999)); // Generates a random number between 100000 and 999999
  const expires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  return prisma.verificationCode.create({
    data: {
      email,
      code,
      expires,
    },
  });
}

export async function validateVerificationCode(email: string, code: string) {
  
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      //expires: { gt: new Date() },
      used: false,
    },
  });
  
  
  if (!validCode) return false;

  // Mark code as used
  await prisma.verificationCode.delete({
    where: { id: validCode.id },
   
  });

  // Mark email as verified
  await prisma.user.update({
    where: { email },
    data: { emailVerified: true },
  });

  return true;
}
