
import { formatCurrency } from './utils';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';
const ITEMS_PER_PAGE = 6;


export async function fetchFilteredCustomers(query: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }
  const createdById = session.user.id;
  try {
    const customers = await prisma.customer.findMany({
      where: {
        createdById: createdById,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { email: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        freelancers: {
          select: {
            id: true,
            status: true,
            amount: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    const formattedCustomers = customers.map((customer) => {
      const totalInvoices = customer.freelancers.length;
      const totalPending = customer.freelancers
        .filter((invoice) => invoice.status === 'pending')
        .reduce((sum, invoice) => sum + invoice.amount, 0);
      const totalPaid = customer.freelancers
        .filter((invoice) => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.amount, 0);

      return {
        ...customer,
        total_invoices: totalInvoices,
        total_pending: formatCurrency(totalPending),
        total_paid: formatCurrency(totalPaid),
      };
    });

    return formattedCustomers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch customer table.');
  }
}


export async function fetchCustomers() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const createdById = session.user.id;
  try {
    const customers = await prisma.customer.findMany({
      where: {
        createdById:
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

    return customers;
  } catch (err) {
    console.error('Database Error:', err);
    throw new Error('Failed to fetch all customers.');
  }
}



export async function fetchInvoiceById(id: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const createdById = session.user.id;
  try {
    const invoiceId = parseInt(id, 10);
    const invoice = await prisma.customerInvoice.findUnique({
      where: {
        userId: createdById,
        id: invoiceId,
      },
      select: {
        id: true,
        customerId: true,
        amount: true,
        status: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found.');
    }

    const formattedInvoice = {
      ...invoice,
      amount: invoice.amount / 100,
    };

    return formattedInvoice;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch invoice.');
  } finally {
    await prisma.$disconnect();
  }
}


export async function fetchInvoicesPages(query: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const createdById = session.user.id;
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

    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
    return totalPages;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch total number of invoices.');
  } finally {
    await prisma.$disconnect();
  }
}

export async function fetchCardData() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const createdById = session.user.id;
  try {
    const invoiceCountPromise = prisma.customerInvoice.count({
      where: {
        userId: createdById,
      },
    });
    
    const customerCountPromise = prisma.customer.count({
      where: {
        createdById: createdById,
      },
    });
    const paidInvoicesPromise = prisma.customerInvoice.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'paid',
        userId: createdById,
      },
    });
    const pendingInvoicesPromise = prisma.customerInvoice.aggregate({
      _sum: {
        amount: true,
      },
      where: {
        status: 'pending',
        userId: createdById,
      },
    });

    const [invoiceCount, customerCount, paidInvoices, pendingInvoices] = await Promise.all([
      invoiceCountPromise,
      customerCountPromise,
      paidInvoicesPromise,
      pendingInvoicesPromise,
    ]);

    const numberOfInvoices = invoiceCount;
    const numberOfCustomers = customerCount;
    const totalPaidInvoices = formatCurrency(Number(paidInvoices._sum.amount ?? '0'));
    const totalPendingInvoices = formatCurrency(Number(pendingInvoices._sum.amount ?? '0'));

    return {
      numberOfCustomers,
      numberOfInvoices,
      totalPaidInvoices,
      totalPendingInvoices,
    };
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch card data.');
  }
}


export async function fetchLatestInvoices() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const createdById = session.user.id;
  try {
    const latestInvoices = await prisma.customerInvoice.findMany({
      where: {
        userId:
        createdById,
      },
      select: {
        id: true,
        amount: true,
        dateCreated: true,
        customer: {
          select: {
            name: true,
            imageurl: true,
            email: true,
          },
        },
      },
      orderBy: {
        dateCreated: 'desc',
      },
      take: 5,
    });

    const formattedInvoices = latestInvoices.map((invoice) => ({
      id: invoice.id,
      amount: formatCurrency(invoice.amount),
      name: invoice.customer.name,
      image_url: invoice.customer.imageurl,
      email: invoice.customer.email,
    }));

    return formattedInvoices;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch the latest invoices.');
  }
}


export async function fetchRevenue() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const createdById = session.user.id;
  try {
    console.log('Fetching revenue data...');
    await new Promise((resolve) => setTimeout(resolve, 3000));
    const transactions = await prisma.customerInvoice.findMany({
      where: {
        userId:
        createdById,
      },
      select: {
        dateCreated: true,
        amount: true,
      },
      orderBy: {
        dateCreated: 'asc',
      },
    });
    const monthlyRevenue = transactions.reduce((acc, transaction) => {
      const monthYear = transaction.dateCreated.toLocaleString('default', { month: 'short', year: 'numeric' });
      if (!acc[monthYear]) {
        acc[monthYear] = 0;
      }
      acc[monthYear] += transaction.amount;
      return acc;
    }, {} as Record<string, number>);
    const formattedRevenue = Object.entries(monthlyRevenue).map(([month, revenue]) => ({
      month,
      revenue,
    }));
    return formattedRevenue;
  } catch (error) {
    console.error('Database Error:', error);
    throw new Error('Failed to fetch revenue data.');
  } finally {
    await prisma.$disconnect();
  }
}


export async function fetchFilteredInvoices(query: string, currentPage: number) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("User not authenticated");
  }

  const createdById = session.user.id;
  const offset = (currentPage - 1) * ITEMS_PER_PAGE;

  const numberQuery = parseFloat(query);
  const isValidNumber = !isNaN(numberQuery);
  
  const dateQuery = new Date(query);
  const isValidDate = !isNaN(dateQuery.getTime());

  const filterConditions: any[] = [
    { customer: { name: { contains: query, mode: 'insensitive' } } },
    { customer: { email: { contains: query, mode: 'insensitive' } } },
  ];

  if (isValidNumber) {
    filterConditions.push({ amount: { equals: numberQuery } });
  }
  
  if (isValidDate) {
    filterConditions.push({ dateCreated: { gte: dateQuery, lte: dateQuery } });
  }

  try {
    const invoices = await prisma.customerInvoice.findMany({
      where: query ? { userId: createdById, OR: filterConditions } : { userId: createdById,},
      include: {
        customer: {
          select: {
            name: true,
            email: true,
            imageurl: true,
          },
        },
      },
      orderBy: { dateCreated: 'desc' },
      skip: offset,
      take: ITEMS_PER_PAGE,
    });

    const formattedInvoices = invoices.map((invoice) => ({
      id: invoice.id,
      amount: invoice.amount,
      date: invoice.dateCreated,
      status: invoice.status,
      name: invoice.customer.name,
      email: invoice.customer.email,
      image_url: invoice.customer.imageurl,
    }));

    return formattedInvoices;
  } catch (error: any) {
    console.error('Database Error:', error);
    throw new Error(`Failed to fetch invoices: ${error.message}`);
  }
}




