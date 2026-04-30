'use client';

import useAuthStore from '@/stores/authStore';

export default function DashboardPage() {
  const { user } = useAuthStore();

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
        Welcome back, {user?.name || 'User'}!
      </h1>
      <p className="text-gray-600 dark:text-gray-300">
        You have successfully authenticated. This is your protected dashboard.
      </p>
    </div>
  );
}
