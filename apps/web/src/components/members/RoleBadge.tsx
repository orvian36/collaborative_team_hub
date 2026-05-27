export default function RoleBadge({ role }) {
  const isAdmin = role === 'ADMIN';
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
        isAdmin
          ? 'bg-primary-100 text-primary-800 dark:bg-primary-900/40 dark:text-primary-200'
          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200'
      }`}
    >
      {role}
    </span>
  );
}
