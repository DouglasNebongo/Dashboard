
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/authOptions';
import { prisma } from '@/app/lib/prisma';
import { NextResponse } from 'next/server';


export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const customers = await prisma.customer.findMany({
      where: {
        createdById: session.user.id,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });
    return NextResponse.json(customers);
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json({ error: 'Failed to fetch customers' }, { status: 500 });
  }
}