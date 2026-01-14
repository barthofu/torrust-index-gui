<template>
  <div class="px-2 lg:px-0">
    <div class="w-auto max-w-2xl px-6 py-6 mx-auto text-neutral-content/50 rounded-2xl">
      <h2 class="mb-2 text-2xl font-semibold text-center text-neutral-content">
        API Keys
      </h2>

      <p class="mb-4 text-sm text-center">
        Create an API key for scripts/apps. The full key is shown only once.
      </p>

      <form class="flex flex-col gap-2 mb-6 md:flex-row" @submit.prevent="createKey">
        <FormInputText
          v-model="newKeyName"
          label="Name"
          name="api_key_name"
          placeholder="e.g. my-seedbox"
          class="flex-1"
          required
        />

        <button
          type="submit"
          class="btn btn-primary md:self-end"
          :disabled="busy"
        >
          Create
        </button>
      </form>

      <div v-if="loading" class="text-center">
        Loading...
      </div>

      <div v-else>
        <div v-if="apiKeys.length === 0" class="text-center">
          No API keys yet.
        </div>

        <div v-else class="overflow-x-auto">
          <table class="table table-zebra">
            <thead>
              <tr>
                <th>Name</th>
                <th>Prefix</th>
                <th>Created</th>
                <th>Last used</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              <tr v-for="k in apiKeys" :key="k.api_key_id">
                <td>{{ k.name }}</td>
                <td class="font-mono">
                  {{ k.key_prefix }}
                </td>
                <td>{{ formatTs(k.created_at) }}</td>
                <td>{{ k.last_used_at ? formatTs(k.last_used_at) : '-' }}</td>
                <td>
                  <span v-if="k.revoked_at" class="badge">revoked</span>
                  <span v-else class="badge badge-success">active</span>
                </td>
                <td class="text-right">
                  <button
                    class="btn btn-sm"
                    :disabled="busy || !!k.revoked_at"
                    @click="revokeKey(k.api_key_id)"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- One-time popup for the created key (not persisted) -->
    <div v-if="createdKey" class="fixed inset-0 z-50 flex items-center justify-center">
      <div class="absolute inset-0 bg-black/60" @click="closeCreatedKey" />
      <div class="relative w-[92vw] max-w-xl p-6 rounded-2xl bg-base-100 text-base-content">
        <h3 class="mb-2 text-xl font-semibold">
          API key created
        </h3>
        <p class="mb-4 text-sm">
          Copy it now. You won’t be able to see it again.
        </p>

        <div class="p-3 mb-4 rounded-lg bg-base-200">
          <div class="mb-1 text-xs opacity-70">
            API key
          </div>
          <div class="break-all font-mono select-all">
            {{ createdKey.api_key }}
          </div>
        </div>

        <div class="flex justify-end gap-2">
          <button class="btn" @click="copyCreatedKey">
            Copy
          </button>
          <button class="btn btn-primary" @click="closeCreatedKey">
            Close
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { notify } from "notiwind-ts";
import { onMounted, ref, useRuntimeConfig } from "#imports";
import { useUser } from "~/composables/states";
import FormInputText from "~/components/form/FormInputText.vue";

type ApiKeyPublic = {
  api_key_id: number,
  name: string,
  key_prefix: string,
  created_at: number,
  last_used_at: number | null,
  revoked_at: number | null
}

type CreatedApiKey = {
  api_key_id: number,
  name: string,
  key_prefix: string,
  api_key: string,
  created_at: number
}

type OkResponseData<T> = {
  data: T
}

const config = useRuntimeConfig();
const user = useUser();

const apiKeys = ref<ApiKeyPublic[]>([]);
const newKeyName = ref("");

const loading = ref(false);
const busy = ref(false);

const createdKey = ref<CreatedApiKey | null>(null);

function apiBase () {
  return String(config.public.apiBase || "").replace(/\/$/, "");
}

function authHeaders (): Record<string, string> {
  const token = user.value?.token;
  if (!token) {
    return {};
  }
  return { Authorization: `Bearer ${token}` };
}

function formatTs (ts: number) {
  return new Date(ts * 1000).toLocaleString();
}

async function fetchKeys () {
  if (!user.value?.token) {
    return;
  }

  loading.value = true;
  try {
    const res = await $fetch<OkResponseData<ApiKeyPublic[]>>(`${apiBase()}/v1/user/api-keys`, {
      headers: authHeaders()
    });
    apiKeys.value = res.data;
  } catch (err: any) {
    notify({
      group: "error",
      title: "Error",
      text: `Unable to load API keys. ${err?.message ?? err}.`
    }, 10000);
  } finally {
    loading.value = false;
  }
}

async function createKey () {
  if (!newKeyName.value.trim()) {
    return;
  }

  busy.value = true;
  try {
    const res = await $fetch<OkResponseData<CreatedApiKey>>(`${apiBase()}/v1/user/api-keys`, {
      method: "POST",
      headers: {
        ...authHeaders(),
        "Content-Type": "application/json"
      },
      body: {
        name: newKeyName.value.trim()
      }
    });

    createdKey.value = res.data;
    newKeyName.value = "";

    await fetchKeys();

    notify({
      group: "success",
      title: "Success",
      text: "API key created. Copy it from the popup."
    }, 4000);
  } catch (err: any) {
    notify({
      group: "error",
      title: "Error",
      text: `Unable to create API key. ${err?.message ?? err}.`
    }, 10000);
  } finally {
    busy.value = false;
  }
}

async function revokeKey (apiKeyId: number) {
  if (busy.value) {
    return;
  }

  const ok = confirm("Delete this API key? It will stop working immediately.");
  if (!ok) {
    return;
  }

  busy.value = true;
  try {
    await $fetch<OkResponseData<number>>(`${apiBase()}/v1/user/api-keys/${apiKeyId}`, {
      method: "DELETE",
      headers: authHeaders()
    });

    await fetchKeys();

    notify({
      group: "success",
      title: "Success",
      text: "API key deleted."
    }, 4000);
  } catch (err: any) {
    notify({
      group: "error",
      title: "Error",
      text: `Unable to delete API key. ${err?.message ?? err}.`
    }, 10000);
  } finally {
    busy.value = false;
  }
}

async function copyCreatedKey () {
  if (!createdKey.value?.api_key) {
    return;
  }

  try {
    await navigator.clipboard.writeText(createdKey.value.api_key);
    notify({
      group: "success",
      title: "Copied",
      text: "API key copied to clipboard."
    }, 2500);
  } catch {
    notify({
      group: "error",
      title: "Error",
      text: "Unable to copy. Please copy manually."
    }, 6000);
  }
}

function closeCreatedKey () {
  createdKey.value = null;
}

onMounted(async () => {
  await fetchKeys();
});
</script>
