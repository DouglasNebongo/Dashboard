// app/api/customer/route.ts
import { NextResponse, NextRequest } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/authOptions';
import { prisma } from '@/app/lib/prisma';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 },
    );
  }

  try {
    const payload = await request.json();
    const { name, email, phone } = payload;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 },
      );
    }

    const newCustomer = await prisma.customer.create({
      data: {
        name,
        email,
        phone,
        createdById: session.user.id,
      },
    });

    return NextResponse.json(newCustomer, { status: 201 });
  } catch (error) {
    console.error('Error creating customer:', error);

    if (error instanceof PrismaClientKnownRequestError && error.code === 'P2002') {
      const targetField = error.meta?.target as string[] | undefined;
      if (targetField?.includes('email')) {
        return NextResponse.json(
          { error: 'Email is already in use' },
          { status: 409 },
        );
      } else if (targetField?.includes('phone')) {
        return NextResponse.json(
          { error: 'Phone number is already in use' },
          { status: 409 },
        );
      }
    }
    return NextResponse.json(
      { error: 'Unable to create customer' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get('page') || '1');
    const pageSize = parseInt(searchParams.get('pageSize') || '10');

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [totalItems, customers] = await prisma.$transaction([
      prisma.customer.count({ where: { createdById: session.user.id } }),
      prisma.customer.findMany({
        where: { createdById: session.user.id },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.max(Math.ceil(totalItems / pageSize), 1);

    return NextResponse.json({
      data: customers,
      pagination: {
        page,
        pageSize,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching customers:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customers' },
      { status: 500 }
    );
  }
}