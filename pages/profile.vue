<template>
  <div class="px-2 lg:px-0">
    <div class="w-full max-w-4xl px-6 py-6 mx-auto text-neutral-content/50 rounded-2xl">
      <h2 class="mb-4 text-2xl font-semibold text-center text-neutral-content">
        My Profile
      </h2>

      <div v-if="user">
        <div class="mt-2">
          <span class="font-semibold">Username:</span>
          <span class="ml-2">{{ username }}</span>
        </div>
        <div v-if="email" class="mt-2">
          <span class="font-semibold">Email:</span>
          <span class="ml-2">{{ email }}</span>
        </div>
        <div class="mt-4">
          <span class="font-semibold">Tracker Announce URL:</span>
          <span class="ml-2 break-all">{{ announceUrl || "Fetching…" }}</span>
        </div>
        <div v-if="trackerKey" class="mt-2">
          <span class="font-semibold">Tracker Key:</span>
          <span class="ml-2 break-all">{{ trackerKey }}</span>
        </div>
        <div class="py-10" />
        <ApiKeysManager />
      </div>
      <div v-else>
        <p>Loading profile…</p>
      </div>
    </div>
  </div>

</template>

<script setup lang="ts">
import { onMounted, computed, ref } from "vue";
import { notify } from "notiwind-ts";
import { getUser } from "../composables/states";
import ApiKeysManager from "~/components/user/ApiKeysManager.vue";
import { useUser, useRuntimeConfig, useRestApi } from "#imports";

const user = useUser();
const username = computed(() => user.value?.username ?? "");
const email = computed(() => "");
const announceUrl = ref<string>("");
const trackerKey = ref<string>("");

onMounted(async () => {
  try {
    if (!user.value) {
      await getUser();
    }
    const apiBase = (useRuntimeConfig().public.apiBase || "").replace(/\/+$/, "");
    const token = useRestApi().value.authToken;
    const res = await $fetch<{ data: { announce_url: string, key?: string } }>(`${apiBase}/user/tracker/announce`, {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined
    });
    announceUrl.value = res?.data?.announce_url || "";
    trackerKey.value = res?.data?.key || "";
  } catch (err: any) {
    notify({
      group: "error",
      title: "Error",
      text: `Unable to load profile. ${err?.message ?? ""}`
    }, 10000);
  }
});
</script>

<style scoped>
</style>
