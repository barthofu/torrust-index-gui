<template>
  <div class="px-2 lg:px-0">
    <div class="w-auto max-w-md px-6 py-6 mx-auto text-neutral-content/50 rounded-2xl">
      <h2 class="mb-4 text-2xl font-semibold text-center text-neutral-content">
        Processing OIDC login...
      </h2>
      <p v-if="error" class="text-error">
        {{ error }}
      </p>
      <p v-else>
        Redirecting...
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted, ref } from "vue";
import { notify } from "notiwind-ts";

const error = ref<string | null>(null);

onMounted(async () => {
  try {
    const url = new URL(window.location.href);
    const token = url.searchParams.get("token");
    if (!token) {
      error.value = "Missing token in callback.";
      return;
    }

    // Store token in API client and refresh user info
    useRestApi().value.authToken = token;

    // Try to renew token to fetch compact user
    const { getUser } = await import("../composables/states");
    await getUser();

    navigateTo("/torrents", { replace: true });
  } catch (e: any) {
    error.value = e?.message ?? "Unexpected error";
    notify({
      group: "error",
      title: "Error",
      text: `OIDC callback failed. ${error.value}.`
    }, 10000);
  }
});
</script>

<style scoped>
</style>
