<script>
    import { supabase } from '$lib/supabase';

    export let data;

    async function deleteUser(userId, userEmail) {
    if (userEmail === data.adminEmail) {
        alert('Cannot delete admin account');
        return;
    }

    if (!confirm('Are you sure you want to delete this user?')) return;
    
    try {
        const response = await fetch('/api/admin/delete-user', {  // Updated path
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ userId })
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message);
        }

        // Update local data
        data.users = data.users.filter(user => user.user_id !== userId);
        alert('User deleted successfully');
    } catch (error) {
        console.error('Error deleting user:', error);
        alert('Error deleting user: ' + error.message);
    }
}

    async function toggleUserStatus(userId, currentStatus, userEmail) {
        // Prevent deactivating admin account
        if (userEmail === data.adminEmail) {
            alert('Cannot modify admin account status');
            return;
        }

        try {
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            const { error } = await supabase
                .from('user_payments')
                .update({ status: newStatus })
                .eq('user_id', userId);

            if (error) throw error;

            // Update local data
            data.users = data.users.map(user => {
                if (user.user_id === userId) {
                    return { ...user, status: newStatus };
                }
                return user;
            });
        } catch (error) {
            console.error('Error updating user status:', error);
            alert('Error updating user status: ' + error.message);
        }
    }
</script>

<div class="admin-container">
    <h1>Admin Dashboard</h1>
    
    <table>
        <thead>
            <tr>
                <th>Email</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Amount</th>
                <th>Join Date</th>
                <th>Last Login</th>
                <th>Actions</th>
            </tr>
        </thead>
        <tbody>
            {#each data.users as user}
                <tr>
                    <td>{user.email}</td>
                    <td>{user.plan}</td>
                    <td>
                        <span class="status-badge {user.status}">
                            {user.status}
                        </span>
                    </td>
                    <td>${user.amount}</td>
                    <td>{new Date(user.created_at).toLocaleDateString()}</td>
                    <td>{user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
                    <td class="actions">
                        <button 
                            class="toggle-btn {user.status === 'active' ? 'deactivate' : 'activate'}"
                            on:click={() => toggleUserStatus(user.user_id, user.status, user.email)}
                            disabled={user.email === data.adminEmail}
                        >
                            {user.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                        <button 
                            class="delete-btn"
                            on:click={() => deleteUser(user.user_id, user.email)}
                            disabled={user.email === data.adminEmail}
                        >
                            Delete
                        </button>
                    </td>
                </tr>
            {/each}
        </tbody>
    </table>

    {#if data.users.length === 0}
        <p class="no-users">No users found.</p>
    {/if}
</div>

<style>
    .admin-container {
        max-width: 1200px;
        margin: 0 auto;
        padding: 2rem;
    }

    table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 1rem;
        background: white;
        box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    th, td {
        padding: 1rem;
        text-align: left;
        border-bottom: 1px solid #eee;
    }

    th {
        background: #f8f8f8;
        font-weight: 600;
    }

    tr:hover {
        background: #f5f5f5;
    }

    .actions {
        display: flex;
        gap: 0.5rem;
    }

    .delete-btn {
        background: #ff4444;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .delete-btn:hover {
        background: #ff0000;
    }

    .toggle-btn {
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 4px;
        cursor: pointer;
    }

    .toggle-btn.activate {
        background: #14F195;
        color: black;
    }

    .toggle-btn.deactivate {
        background: #ffd700;
        color: black;
    }

    .status-badge {
        padding: 0.25rem 0.5rem;
        border-radius: 999px;
        font-size: 0.875rem;
        font-weight: 500;
    }

    .status-badge.active {
        background: #14F195;
        color: black;
    }

    .status-badge.inactive {
        background: #ff4444;
        color: white;
    }

    .no-users {
        text-align: center;
        padding: 2rem;
        color: #666;
    }
</style>