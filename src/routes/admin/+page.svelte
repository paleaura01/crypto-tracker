<script lang="ts">
  import { supabase } from '$lib/supabaseClient';

  export let data: {
    users: {
      user_id: string;
      email: string;
      plan: string;
      status: 'active' | 'inactive';
      amount: number;
      created_at: string;
      last_sign_in_at: string | null;
    }[];
    adminEmail: string;
  };

  async function deleteUser(id: string, email: string) {
    if (email === data.adminEmail) {
      return alert('Cannot delete admin');
    }
    if (!confirm('Delete this user?')) return;

    const res = await fetch('/api/admin/delete-user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: id })
    });
    if (!res.ok) {
      alert('Error deleting user');
    } else {
      data.users = data.users.filter((u) => u.user_id !== id);
      alert('Deleted');
    }
  }

  async function toggleUserStatus(
    id: string,
    status: 'active' | 'inactive',
    email: string
  ) {
    if (email === data.adminEmail) {
      return alert('Cannot modify admin');
    }

    const newStatus = status === 'active' ? 'inactive' : 'active';
    const { error } = await supabase
      .from('user_payments')
      .update({ status: newStatus })
      .eq('user_id', id);

    if (error) {
      alert('Error updating status: ' + error.message);
    } else {
      data.users = data.users.map((u) =>
        u.user_id === id ? { ...u, status: newStatus } : u
      );
    }
  }
</script>

<main class="container mx-auto px-4 py-8 dark:text-white">
  <h1 class="text-3xl font-semibold mb-6">Admin Dashboard</h1>

  <div class="overflow-x-auto">
    <table class="w-full  border-collapse shadow rounded-lg overflow-hidden">
      <thead class="px-4 py-2 border-b border-gray-200 text-left">
        <tr class="">
          <th >Email</th>
          <th>Plan</th>
          <th>Status</th>
          <th>Amount</th>
          <th>Join Date</th>
          <th>Last Login</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {#each data.users as u}
          <tr class="">
            <td class="py-2 ">{u.email}</td>
            <td>{u.plan}</td>
            <td>
              <span
                class="inline-block px-2 py-1 rounded-full text-sm font-medium
                  {u.status === 'active'
                    ? 'bg-green-400 dark:bg-green-600 text-black'
                    : 'bg-red-400 dark:bg-red-600 text-white'}"
              >
                {u.status}
              </span>
            </td>
            <td>${u.amount}</td>
            <td>{new Date(u.created_at).toLocaleDateString()}</td>
            <td>
              {u.last_sign_in_at
                ? new Date(u.last_sign_in_at).toLocaleDateString()
                : 'Never'}
            </td>
            <td class="flex pt-2  space-x-2">
              <button
                on:click={() => toggleUserStatus(u.user_id, u.status, u.email)}
                class="btn  {u.status === 'active' ? 'btn-toggle-active' : 'btn-toggle-inactive'} "
                disabled={u.email === data.adminEmail}
              >
                {u.status === 'active' ? 'Deactivate' : 'Activate'}
              </button>
              <button
                on:click={() => deleteUser(u.user_id, u.email)}
                class="btn btn-danger"
                disabled={u.email === data.adminEmail}
              >
                Delete
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if data.users.length === 0}
    <p class="mt-6  text-center text-gray-600 dark:text-gray-400">
      No users found.
    </p>
  {/if}
</main>
