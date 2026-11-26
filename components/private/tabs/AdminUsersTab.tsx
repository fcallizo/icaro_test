'use client';

import { FormEvent, useCallback, useEffect, useState } from 'react';
import { ConfirmationDialog } from '@/components/private/ConfirmationDialog';
import { StatusToast, StatusToastTone } from '@/components/common/StatusToast';
import { PageTheme } from '@/lib/properties';

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
  const [busyId, setBusyId] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [userToDelete, setUserToDelete] = useState<PrivateUser | null>(null);
  const [toast, setToast] = useState<{ message: string; tone: StatusToastTone; surface?: PageTheme } | null>(null);

  const refreshUsers = useCallback(async () => {
    setUsers(await getUsers());
  }, []);

  useEffect(() => {
    let active = true;
    void getUsers()
      .then((loadedUsers) => {
        if (active) setUsers(loadedUsers);
      })
      .catch((loadError: unknown) => {
        if (active) {
          setToast({ message: loadError instanceof Error ? loadError.message : 'No se pudieron cargar los usuarios.', tone: 'error' });
        }
      });
    return () => {
      active = false;
    };
  }, []);

  const handleInvite = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsInviting(true);
    try {
      const response = await fetch('/api/private/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo enviar la invitación.');
      setEmail('');
      setToast({ message: data.message || 'Invitación enviada.', tone: 'success' });
      await refreshUsers();
    } catch (inviteError) {
      setToast({ message: inviteError instanceof Error ? inviteError.message : 'No se pudo enviar la invitación.', tone: 'error' });
    } finally {
      setIsInviting(false);
    }
  };

  const handleAdminChange = async (user: PrivateUser) => {
    setBusyId(user.id);
    try {
      const response = await fetch('/api/private/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, isAdmin: !user.isAdmin }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron actualizar los permisos.');
      setToast({ message: data.message, tone: 'success' });
      await refreshUsers();
    } catch (updateError) {
      setToast({ message: updateError instanceof Error ? updateError.message : 'No se pudieron actualizar los permisos.', tone: 'error' });
    } finally {
      setBusyId('');
    }
  };

  const handleNotificationChange = async (user: PrivateUser, flag: 1 | 2, checked: boolean) => {
    const notificationLevel = checked
      ? user.notifications | flag
      : user.notifications & ~flag;
    setBusyId(user.id);
    try {
      const response = await fetch('/api/private/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, notificationLevel }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron actualizar las notificaciones.');
      setToast({ message: data.message, tone: 'success' });
      await refreshUsers();
    } catch (updateError) {
      setToast({ message: updateError instanceof Error ? updateError.message : 'No se pudieron actualizar las notificaciones.', tone: 'error' });
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
    try {
      const response = await fetch('/api/private/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el usuario.');
      setToast({ message: data.message, tone: 'success' });
      setUserToDelete(null);
      await refreshUsers();
    } catch (deleteError) {
      setUserToDelete(null);
      setToast({ message: deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el usuario.', tone: 'error' });
    } finally {
      setBusyId('');
    }
  };

  return (
    <div className="private-tab-panel private-users-panel">
      <section className="private-request-section">
        <h2>Gestión de usuarios</h2>
        <p className="event-management-intro">
          Invita por correo y administra el acceso al área privada.
        </p>

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
          {users.length === 0 && <p className="private-empty-state">No hay usuarios que mostrar.</p>}
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
        <StatusToast message={toast?.message || ''} tone={toast?.tone || 'success'} surface={toast?.surface} onDismiss={() => setToast(null)} />
      </section>
    </div>
  );
}
