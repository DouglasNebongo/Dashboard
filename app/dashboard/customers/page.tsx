import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/lib/authOptions';
import { prisma } from '@/app/lib/prisma';
import { CustomerPageClient } from '@/app/ui/customer-page';

export default async function CustomersPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return <div>Unauthorized</div>;
  }

  try {
    const pageSize = 10;
    const userId = session.user.id;

    // Fetch initial paginated data
    const [totalItems, customers] = await prisma.$transaction([
      prisma.customer.count({
        where: { createdById: userId },
      }),
      prisma.customer.findMany({
        where: { createdById: userId },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          createdAt: true,
        },
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Calculate total pages
    const totalPages = Math.ceil(totalItems / pageSize);

    return (
      <CustomerPageClient
        initialData={{
          data: customers.map((customer: { id: string; name: string; email: string; phone: string | null; createdAt: Date }) => ({
            ...customer,
            phone: customer.phone ?? undefined,
          })),
          pagination: {
            page: 1,
            pageSize,
            totalItems,
            totalPages,
          },
        }}
        userId={userId}
      />
    );
  } catch (error) {
    console.error('Error fetching customers:', error);
    return <div>Failed to load customers. Please try again later.</div>;
  }
}






