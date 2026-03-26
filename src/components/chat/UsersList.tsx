import type { OnlineUser } from '@/types/chat';

interface UsersListProps {
  users: OnlineUser[];
  currentUser: string;
}

const UsersList = ({ users, currentUser }: UsersListProps) => (
  <div className="w-56 bg-white border-l border-border p-4 hidden md:block">
    <h3 className="text-sm font-semibold text-foreground mb-3">Online Users</h3>
    <ul className="space-y-2">
      {users.map(user => (
        <li key={user.username} className="flex items-center gap-2 text-sm">
          <span className="h-2 w-2 rounded-full bg-green-400 shrink-0" />
          <span className={user.username === currentUser ? 'font-medium text-foreground' : 'text-muted-foreground'}>
            {user.username}{user.username === currentUser ? ' (you)' : ''}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default UsersList;
