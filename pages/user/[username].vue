<template>
  <div class="space-y-8">
    <ChangePasswordForm :username="user.username" />
    <ApiKeysManager />
  </div>
</template>

<script setup lang="ts">
import ChangePasswordForm from "~/components/user/ChangePasswordForm.vue";
import ApiKeysManager from "~/components/user/ApiKeysManager.vue";
import { useUser } from "#imports";

const user = useUser();

</script>

<style scoped>

</style>
