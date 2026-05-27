const STYLES = {
  PENDING:
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
  ACCEPTED:
    'bg-green-100  text-green-800  dark:bg-green-900/40  dark:text-green-200',
  REVOKED:
    'bg-gray-100   text-gray-700   dark:bg-gray-700      dark:text-gray-200',
  EXPIRED:
    'bg-gray-100   text-gray-700   dark:bg-gray-700      dark:text-gray-200',
};

export default function InvitationStatusBadge({ status }) {
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${STYLES[status] || STYLES.PENDING}`}
    >
      {status}
    </span>
  );
}
