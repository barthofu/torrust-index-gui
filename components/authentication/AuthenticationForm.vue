<template>
  <div class="px-2 lg:px-0">
    <div class="w-auto max-w-md px-6 py-6 mx-auto text-neutral-content/50 rounded-2xl">
      <h2 class="mb-4 text-2xl font-semibold text-center text-neutral-content">
        Sign in
      </h2>
      <div class="space-y-3">
        <p class="text-center text-neutral-content">
          Sign in is handled by your Identity Provider.
        </p>
      </div>
      <div class="relative mt-6">
        <div class="relative flex justify-center text-sm">
          <span>
            Accounts are managed by your Identity Provider.
          </span>
        </div>
        <div class="mt-4 flex justify-center">
          <button type="button" class="btn" @click="loginWithOidc">
            Sign in with OIDC
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRuntimeConfig } from "#imports";

function loginWithOidc () {
  const apiBase = (useRuntimeConfig().public.apiBase || "").replace(/\/+$/, "");
  // Navigate to backend OIDC start endpoint, avoiding duplicate "/v1"
  window.location.href = `${apiBase}/user/oidc/login`;
}

</script>

<style scoped>

</style>
