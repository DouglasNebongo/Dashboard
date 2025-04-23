'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { signIn } from '@/auth';
//import { AuthError } from 'next-auth';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { convertToUSD } from '@/app/lib/currencyConverter';
import { NextResponse } from 'next/server';
import redisClient from '@/app/lib/redis';
 
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string({
    invalid_type_error: 'Please select a customer.',
  }),
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status.',
  }),
  date: z.string(),
  currency: z.string(),
});
 
const CreateInvoice = FormSchema.omit({ id: true, date: true });
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};



export async function createInvoice(prevState: State, formData: FormData) {
  let usdAmount: number = 0;
  const session = await getServerSession(authOptions);
  const validatedFields = CreateInvoice.safeParse({
      customerId: formData.get('customerId'),
      amount: formData.get('amount'),
      status: formData.get('status'),
      currency: formData.get('currency'),
    });
    
    if (!validatedFields.success) {
      return {
        errors: validatedFields.error.flatten().fieldErrors,
        message: 'Missing Fields. Failed to Create Invoice.',
      };
    }

    const { customerId, amount, status, currency } = validatedFields.data;
 
    
    try {
      // Check if the rate is cached in Redis
      const cachedRate = await redisClient.get(`exchangeRate_${currency}`);
      
  
      if (cachedRate) {
        // Use the cached rate
        usdAmount = amount * parseFloat(cachedRate);
      } else {
        // Fetch the rate from the API
        usdAmount = await convertToUSD(amount, currency);
  
        // Cache the rate in Redis (expire after 1 hour)
        await redisClient.set(`exchangeRate_${currency}`, usdAmount / amount, {
          EX: 3600, // 1 hour expiration
        });
      }
  
    } catch (error) {
      console.error('Error converting currency:', error);
    }

    const amountInCents = usdAmount * 100;
    //const date = new Date().toISOString().split('T')[0];
    try {
      await prisma.customerInvoice.create({
        data: {
          customerId: customerId, // or customerId if your model uses camelCase
          amount: amountInCents,
          status:status,
          userId: session?.user?.id ?? '',
          currency: currency,
        },
      });
    } catch (error) {
      console.error('Database Error:', error);
      throw new Error('Failed to update invoice.');
    }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}






export async function updateInvoice(id: string, formData: FormData) {
  const session = await getServerSession(authOptions);
  let usdAmount: number = 0;
  // Parse and validate the form data
  const { customerId, amount, status, currency } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
    currency: formData.get('currency'),
  });

  try {
    // Check if the rate is cached in Redis
    const cachedRate = await redisClient.get(`exchangeRate_${currency}`);
    

    if (cachedRate) {
      // Use the cached rate
      usdAmount = amount * parseFloat(cachedRate);
    } else {
      // Fetch the rate from the API
      usdAmount = await convertToUSD(amount, currency);

      // Cache the rate in Redis (expire after 1 hour)
      await redisClient.set(`exchangeRate_${currency}`, usdAmount / amount, {
        EX: 3600, // 1 hour expiration
      });
    }

  } catch (error) {
    console.error('Error converting currency:', error);
  }

  const amountInCents = usdAmount * 100;
  const invoiceId = parseInt(id, 10);
  if (isNaN(invoiceId)) {
    throw new Error('Invalid invoice ID.');
  }

  try {
    await prisma.customerInvoice.update({
      where: {
        id: invoiceId,
      },
      data: {
        customerId: customerId,
        amount: amountInCents, 
        status: status, 
        userId: session?.user?.id,
        currency: currency,
      },
    });
    
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to update invoice.');
  }
  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}







export async function deleteInvoice(id: string) {
  try {
    const invoiceId = parseInt(id, 10);
    // Delete the invoice
    await prisma.customerInvoice.delete({
      where: {
        id: invoiceId,
      },
    });
    revalidatePath('/dashboard/invoices');
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to delete invoice.');
  }
}



export async function authenticate(
  prevState: string | undefined,
  formData: FormData,
) {
  try {
    await signIn('credentials', formData);
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case 'CredentialsSignin':
          return 'Invalid credentials.';
        default:
          return 'Something went wrong.';
      }
    }
    throw error;
  }
}