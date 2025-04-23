'use client';

// app/ui/customer-page.tsx
import { useState, useMemo, useCallback } from 'react';
import { formatDateToLocal } from '@/app/lib/utils';
import { PlusIcon } from '@heroicons/react/24/outline';
import { useDebounce } from 'use-debounce';
import { useSwipeable } from 'react-swipeable';
import { lusitana } from '@/app/ui/fonts';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import CreateCustomerForm from './customer-form';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
}

interface PaginatedResponse {
  data: Customer[];
  pagination: {
    page: number;
    pageSize: number;
    totalItems: number;
    totalPages: number;
  };
}

interface CustomerPageClientProps {
  initialData: PaginatedResponse;
  userId: string;
}

export function CustomerPageClient({ initialData, userId }: CustomerPageClientProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [search, setSearch] = useState('');
  const [debouncedSearch] = useDebounce(search, 300);
  const [page, setPage] = useState(1);
  const pageSize = 1;

  const { data, isLoading, isError, error } = useQuery<PaginatedResponse, Error>({
    queryKey: ['customers', userId, page],
    queryFn: async () => {
      const res = await fetch(`/api/customer?page=${page}&pageSize=${pageSize}`);
      if (!res.ok) throw new Error('Failed to fetch customers');
      return res.json();
    },
    initialData: () => initialData,
    placeholderData: (previousData) => previousData,
  });

  const handleCreateCustomer = useCallback(async () => {
    await queryClient.invalidateQueries({ 
      queryKey: ['customers', userId] 
    });
    setShowForm(false);
  }, [queryClient, userId]);

  const filteredCustomers = useMemo(() => {
    const searchTerm = debouncedSearch.toLowerCase();
    return (data?.data || []).filter((customer: Customer) => 
      customer.name.toLowerCase().includes(searchTerm) ||
      customer.email.toLowerCase().includes(searchTerm)
    );
  }, [data, debouncedSearch]);
  const swipeHandlers = useSwipeable({
    onSwipedDown: () => setShowForm(false),
    trackMouse: true,
  });

  const renderEmptyState = () => (
    <div className="flex flex-col items-center justify-center p-6 text-center text-gray-500">
      <p className="text-lg">No customers found.</p>
      <p className="text-sm">Try adjusting your search or create a new customer.</p>
    </div>
  );

  if (isLoading) return (
    <div className="flex justify-center items-center h-64">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
    </div>
  );

  if (isError) return (
    <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded-lg">
      Error: {error?.message || 'Failed to load customers'}
    </div>
  );

  return (
    <div className={`${lusitana.className} w-full mx-auto p-4 space-y-4`}>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Customers</h1>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-2 py-2 rounded-lg transition-colors"
        >
          <PlusIcon className="h-3 w-3" />
          New Customer
        </button>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Search customers..."
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Name</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Email</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Phone</th>
              <th className="px-6 py-3 text-left text-sm font-medium text-gray-500">Joined</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {filteredCustomers.map((customer) => (
              <tr key={customer.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 text-sm text-gray-900">{customer.name}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{customer.email}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{customer.phone || '-'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">
                  {formatDateToLocal(customer.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile List */}
      <div className="md:hidden space-y-3">
        {filteredCustomers.map((customer) => (
          <div key={customer.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-sm font-semibold text-gray-900">{customer.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{customer.email}</p>
                {customer.phone && <p className="text-sm text-gray-500 mt-1">{customer.phone}</p>}
              </div>
              <span className="text-xs text-gray-500">
                {formatDateToLocal(customer.createdAt)}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <div className="text-sm text-gray-600">
          Showing {data.pagination.page * data.pagination.pageSize - data.pagination.pageSize + 1}-
          {Math.min(data.pagination.page * data.pagination.pageSize, data.pagination.totalItems)} of{' '}
          {data.pagination.totalItems} results
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Previous
          </button>
          <button
            onClick={() => setPage(p => Math.min(p + 1, data.pagination.totalPages))}
            disabled={page === data.pagination.totalPages}
            className="px-4 py-2 bg-gray-100 rounded-lg disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>

      {/* Create Customer Modal */}
      {showForm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4"
          onClick={() => setShowForm(false)}
        >
          <div
            {...swipeHandlers}
            className="bg-white rounded-lg p-6 w-full max-w-md"
            onClick={(e) => e.stopPropagation()}
          >
            <CreateCustomerForm
              onSuccess={handleCreateCustomer}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

