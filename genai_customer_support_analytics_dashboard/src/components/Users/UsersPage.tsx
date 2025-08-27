import React from 'react';
import { fetchUsers, CognitoUserSummary } from '../../services/usersApi';

const UsersPage: React.FC = () => {
  const [users, setUsers] = React.useState<CognitoUserSummary[]>([]);
  const [loading, setLoading] = React.useState<boolean>(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchUsers();
        if (mounted) setUsers(data);
      } catch (e) {
        if (mounted) setError(e instanceof Error ? e.message : 'Failed to load users');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading) return <div className="p-6">Loading users…</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-slate-900 mb-4">Cognito Users</h2>
      <div className="grid gap-3">
        {users.map((u) => (
          <div key={u.username} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-slate-900">{u.username}</div>
                <div className="text-sm text-slate-600">{u.email || '—'}</div>
              </div>
              <div className="text-sm text-slate-600">
                {u.status || 'UNKNOWN'} · {u.enabled ? 'ENABLED' : 'DISABLED'}
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="text-slate-600">No users found.</div>}
      </div>
    </div>
  );
};

export default UsersPage;



