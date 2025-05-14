<!-- src/routes/auth/login/+page.svelte -->
<script lang="ts">
  export let data: { error?: string };
</script>

<h1>Log In</h1>

<form method="POST">
  <div>
    <label for="email">Email</label>
    <input id="email" name="email" type="email" required autocomplete="email" />
  </div>

  <div>
    <label for="password">Password</label>
    <input
      id="password"
      name="password"
      type="password"
      required
      autocomplete="current-password"
    />
  </div>

  {#if data.error}
    <p class="error">{data.error}</p>
  {/if}

  <button type="submit">Log In</button>
</form>
