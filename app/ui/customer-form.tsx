'use client';
import { XMarkIcon, ArrowPathIcon, CheckIcon } from '@heroicons/react/24/outline';
import { useState } from 'react';

interface CreateCustomerFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormData {
  name: string;
  email: string;
  phone: string;
}

export default function CreateCustomerForm({ 
  onSuccess,
  onCancel,
}: CreateCustomerFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    phone: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/customer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create customer');
      }

      setSuccess(true);
      setFormData({ name: '', email: '', phone: '' });
      onSuccess();
      setTimeout(onCancel, 1500);
    } catch (error: unknown) {
      console.error("Error submitting form:", error);
      setError(error instanceof Error ? error.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative bg-white rounded-xl shadow-2xl p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">New Customer</h2>
        <button
          onClick={onCancel}
          className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Close"
          disabled={loading}
        >
          <XMarkIcon className="h-6 w-6 text-gray-500" />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              
              disabled={loading}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all outline-none"
              
              pattern="[+]?[0-9\s\-]+"
              disabled={loading}
            />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2">
            <XMarkIcon className="h-5 w-5" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 text-green-700 rounded-lg text-sm flex items-center gap-2">
            <CheckIcon className="h-5 w-5" />
            <span>Customer created successfully!</span>
          </div>
        )}

        <div className="flex gap-3 justify-end pt-4">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-5 py-2.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-5 py-2.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 flex items-center gap-2"
          >
            {loading && <ArrowPathIcon className="h-4 w-4 animate-spin" />}
            {loading ? "Creating..." : "Create Customer"}
          </button>
        </div>
      </form>
    </div>
  );
}
