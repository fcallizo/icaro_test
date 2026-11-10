'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ConfirmationDialog } from '@/components/private/ConfirmationDialog';

type PrivateUser = {
  id: string;
  email: string;
  isAdmin: boolean;
  passwordSet: boolean;
  notifications: number;
  createdAt: string;
};

async function getUsers() {
  const response = await fetch('/api/private/users', { cache: 'no-store' });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los usuarios.');
  return data.users as PrivateUser[];
}

export function AdminUsersTab() {
  const [users, setUsers] = useState<PrivateUser[]>([]);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<PrivateUser | null>(null);

  const refreshUsers = useCallback(async () => {
    setUsers(await getUsers());
  }, []);

  useEffect(() => {
    void refreshUsers().catch((loadError: unknown) => {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los usuarios.');
    });
  }, [refreshUsers]);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsInviting(true);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/private/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo enviar la invitación.');
      setEmail('');
      setMessage(data.message || 'Invitación enviada.');
      await refreshUsers();
    } catch (inviteError) {
      setError(inviteError instanceof Error ? inviteError.message : 'No se pudo enviar la invitación.');
    } finally {
      setIsInviting(false);
    }
  };

  const handleAdminChange = async (user: PrivateUser) => {
    setBusyId(user.id);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/private/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, isAdmin: !user.isAdmin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron actualizar los permisos.');
      setMessage(data.message);
      await refreshUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudieron actualizar los permisos.');
    } finally {
      setBusyId('');
    }
  };

  const handleNotificationChange = async (user: PrivateUser, flag: 1 | 2, checked: boolean) => {
    const notificationLevel = checked
      ? user.notifications | flag
      : user.notifications & ~flag;
    setBusyId(user.id);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/private/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, notificationLevel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron actualizar las notificaciones.');
      setMessage(data.message);
      await refreshUsers();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : 'No se pudieron actualizar las notificaciones.');
    } finally {
      setBusyId('');
    }
  };

  const handleDelete = async (user: PrivateUser, confirmed = false) => {
    if (!confirmed) {
      setUserToDelete(user);
      return;
    }

    setBusyId(user.id);
    setMessage('');
    setError('');
    try {
      const response = await fetch('/api/private/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el usuario.');
      setMessage(data.message);
      setUserToDelete(null);
      await refreshUsers();
    } catch (deleteError) {
      setUserToDelete(null);
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el usuario.');
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="private-tab-panel private-users-panel">
      <header className="private-users-heading">
        <div>
          <h2>Gestión de usuarios</h2>
          <p>Invita por correo y administra el acceso al área privada.</p>
        </div>
      </header>

      <form className="private-user-invite-form" onSubmit={handleInvite}>
        <label htmlFor="private-invite-email">Correo electrónico</label>
        <input
          id="private-invite-email"
          type="email"
          autoComplete="email"
          maxLength={254}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <button type="submit" className="private-gold-button" disabled={isInviting}>
          {isInviting ? 'Enviando...' : 'Enviar invitación'}
        </button>
      </form>

      {message && <p className="private-users-message" role="status">{message}</p>}
      {error && <p className="private-error-message" role="alert">{error}</p>}

      <div className="private-users-list">
        {users.map((user) => (
          <article className="private-user-row" key={user.id}>
            <div>
              <strong>{user.email || '(sin correo)'}</strong>
              <p>
                <span className={`${user.isAdmin ? 'private-user-role-admin' : ''}`}>
                  {user.isAdmin ? 'Administrador' : 'Usuario'}
                </span>
                <span> {' · '} </span>
                <span className={`${user.passwordSet ? 'private-user-status-active' : ''}`}>
                  {user.passwordSet ? 'Acceso activado' : 'Invitación pendiente'}
                </span>
              </p>
            </div>
            <div>
              <fieldset className="private-user-notifications" disabled={Boolean(busyId)}>
                <legend>Notificaciones por correo</legend>
                <label>
                  <input
                    type="checkbox"
                    checked={(user.notifications & 1) === 1}
                    onChange={(event) => void handleNotificationChange(user, 1, event.target.checked)}
                  />
                  Solicitudes de producción
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={(user.notifications & 2) === 2}
                    onChange={(event) => void handleNotificationChange(user, 2, event.target.checked)}
                  />
                  Solicitudes de boda
                </label>
              </fieldset>
            </div>
            <div className="private-user-actions">
              <button
                type="button"
                className="private-gold-button"
                onClick={() => void handleAdminChange(user)}
                disabled={Boolean(busyId) || !user.passwordSet}
              >
                {busyId === user.id ? 'Guardando...' : user.isAdmin ? 'Quitar admin' : 'Hacer admin'}
              </button>
              <button
                type="button"
                className="private-discard-button"
                onClick={() => void handleDelete(user)}
                disabled={Boolean(busyId)}
              >
                {busyId === user.id ? 'Guardando...' : 'Eliminar'}
              </button>
            </div>
          </article>
        ))}
        {users.length === 0 && !error && <p className="private-empty-state">No hay usuarios que mostrar.</p>}
      </div>
        {userToDelete && (
          <ConfirmationDialog
            title="Eliminar usuario"
            message={`¿Eliminar la cuenta de ${userToDelete.email}? Esta acción no se puede deshacer.`}
            confirmLabel="Eliminar cuenta"
            isDestructive
            isBusy={busyId === userToDelete.id}
            onCancel={() => setUserToDelete(null)}
            onConfirm={() => void handleDelete(userToDelete, true)}
          />
        )}
    </div>
  );
}
