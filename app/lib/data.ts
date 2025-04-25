import { formatCurrency } from '@/app/lib/utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/authOptions';
import { prisma } from '@/app/lib/prisma';
import { Revenue } from './definitions'; 

export interface FormattedInvoice {
  id: number;
  amount: string;
  name: string;
  email: string;
  imageUrl: string;
}

interface RawFilteredInvoice {
  id: number;
  amount: number;
  dateCreated: Date;
  status: 'paid' | 'pending';
  customer: {
    name: string;
    email: string;
    imageUrl: string | null;
  };
}

export interface FilteredInvoice {
  id: number;
  amount: number;
  date: Date;
  status: 'paid' | 'pending';
  name: string;
  email: string;
  image_url: string;
  }

interface InvoiceWithCustomer {
  id: number;
  amount: number;
  customer: {
    name: string;
    email: string;
    imageUrl: string | null;
  };
}

const ITEMS_PER_PAGE = 6;

// Helper function to get authenticated user ID
async function getAuthenticatedUserId() {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    throw new Error("Error: User not authenticated");
  }
  return userId;
}

// Fetch filtered customers function
export async function fetchFilteredCustomers(query: string) {
  const createdById = await getAuthenticatedUserId();
  try {
    const customers = await prisma.customer.findMany({
      where: {
        createdById,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        name: true,
        email: true,
        invoices: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return customers.map((customer: {
      id: string;
      name: string;
      email: string;
      invoices: Array<{
        id: number;
        status: 'pending' | 'paid';
        amount: number;
      }>;
    }) => ({
      ...customer,
      total_invoices: customer.invoices.length,
      total_pendiing: formatCurrency(
        customer.invoices
          .filter(f => f.status === 'pending')
          .reduce((sum, f) => sum + f.amount, 0)
      ),
      total_paid: formatCurrency(
        customer.invoices
          .filter(f => f.status === 'paid')
          .reduce((sum, f) => sum + f.amount, 0)
      ),
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch clients');
  }
}

// Fetch all customers function
export async function fetchCustomers() {
  const createdById = await getAuthenticatedUserId();

  try {
    return await prisma.customer.findMany({
      where: {
        createdById,
      },
      select: {
        id: true,
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch clients');
  }
}

// Function to fetch a particular invoice using the id
export async function fetchInvoiceById(id: string) {
  const createdById = await getAuthenticatedUserId();

  try {
    const invoiceId = parseInt(id, 10);
    if (isNaN(invoiceId)) {
      throw new Error('Invalid invoice ID');
    }

    const invoice = await prisma.customerInvoice.findUnique({
      where: {
        id: invoiceId,
        userId: createdById,
      },
      select: {
        id: true,
        customerId: true,
        amount: true,
        status: true,
      },
    });

    return invoice ? { ...invoice, amount: invoice.amount / 100 } : null;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  }
}

export async function fetchInvoicesPages(query: string) {
  const createdById = await getAuthenticatedUserId();
  try {
    const totalCount = await prisma.customerInvoice.count({
      where: {
        userId: createdById,
        OR: [
          { customer: { name: { contains: query, mode: 'insensitive' } } },
          { customer: { email: { contains: query, mode: 'insensitive' } } },
          { amount: { equals: parseFloat(query) || undefined } },
        ],
      },
    });

    return Math.ceil(totalCount / ITEMS_PER_PAGE);
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices');
  }
}

export async function fetchCardData() {
  const createdById = await getAuthenticatedUserId();

  try {
    const [invoiceCount, customerCount, paidInvoices, pendingInvoices] = await Promise.all([
      prisma.customerInvoice.count({ where: { userId: createdById } }),
      prisma.customer.count({ where: { createdById } }),
      prisma.customerInvoice.aggregate({
        _sum: { amount: true },
        where: { userId: createdById, status: 'paid' }
      }),
      prisma.customerInvoice.aggregate({
        _sum: { amount: true },
        where: { userId: createdById, status: 'pending' }
      }),
    ]);

    return {
      numberOfCustomers: customerCount,
      numberOfInvoices: invoiceCount,
      totalPaidInvoices: formatCurrency(Number(paidInvoices._sum.amount ?? '0')),
      totalPendingInvoices: formatCurrency(Number(pendingInvoices._sum.amount ?? '0')),
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data');
  }
}



// Fetch filtered invoices 
export async function fetchFilteredInvoices( 
  query: string, currentPage: number): Promise<FilteredInvoice[]> { 
  const createdById = await getAuthenticatedUserId();
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  try {
    const invoices: RawFilteredInvoice[] = await prisma.customerInvoice.findMany({
      where: {
        userId: createdById,
        OR: [
          { customer: { name: { contains: query, mode: 'insensitive' } } },
          { customer: { email: { contains: query, mode: 'insensitive' } } },
          { amount: { equals: parseFloat(query) || undefined } },
          ...(!isNaN(new Date(query).getTime()) ? [{
            dateCreated: {
              gte: new Date(query),
              lte: new Date(query)
            }
          }] : []),
        ],
      },
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            imageUrl: true
          }
        }
      },
      orderBy: { dateCreated: 'desc' },
      skip: offset,
      take: ITEMS_PER_PAGE,
    });

    return invoices.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount,
      date: invoice.dateCreated,
      status: invoice.status,
      name: invoice.customer.name,
      email: invoice.customer.email,
      image_url: invoice.customer.imageUrl as string, // Type assertion
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoices.');
  }
}


export async function fetchRevenue(): Promise<Revenue[]> {
  const createdById = await getAuthenticatedUserId();
  try {
    const transactions = await prisma.customerInvoice.findMany({
      where: {
        userId: createdById,
        status: 'paid',
      },
      select: {
        amount: true,
        dateCreated: true,
      },
      orderBy: {
        dateCreated: 'asc',
      }
    });

    // Add explicit type for transactions
    type TransactionType = {
      dateCreated: Date;
      amount: number;
    };

    const monthlyRevenue = transactions.reduce(
      (acc: Record<string, number>, transaction: TransactionType) => {
        const monthYear = transaction.dateCreated.toLocaleString('default', { 
          month: 'short', 
          year: 'numeric' 
        });
        acc[monthYear] = (acc[monthYear] || 0) + transaction.amount;
        return acc;
      }, 
      {} as Record<string, number>
    );
    const entries = Object.entries(monthlyRevenue) as [string, number][];
    return entries.map(([month, revenue]) => ({ month, revenue }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data');
  }
}

// Fetch latest invoices with explicit typing
export async function fetchLatestInvoices(): Promise<FormattedInvoice[]> {
  const createdById = await getAuthenticatedUserId();

  try {
    
    const latestInvoices: InvoiceWithCustomer[] = await prisma.customerInvoice.findMany({
      where: { userId: createdById },
      select: {
        id: true,
        amount: true,
        customer: {
          select: { name: true, email: true, imageUrl: true }
        },
      },
      orderBy: { dateCreated: 'desc' },
      take: 5,
    });

    return latestInvoices.map(invoice => ({
      id: invoice.id,
      amount: formatCurrency(invoice.amount),
      name: invoice.customer.name,
      email: invoice.customer.email,
      imageUrl: invoice.customer.imageUrl ?? '',  
    }));
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch latest invoices');
  }
}