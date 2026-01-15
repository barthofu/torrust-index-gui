import type { PublicSettings, Category, TokenResponse, TorrentTag } from "torrust-index-types-lib";
import { Rest } from "torrust-index-api-lib";
import { notify } from "notiwind-ts";
import { useRuntimeConfig, useState } from "#imports";

export const useRestApi = () => useState<Rest>("rest-api", () => new Rest(useRuntimeConfig().public.apiBase));
export const useCategories = () => useState<Array<Category>>("categories", () => new Array<Category>());
export const useTags = () => useState<Array<TorrentTag>>("tags", () => new Array<TorrentTag>());
export const useSettings = (): Ref<PublicSettings | null> => useState<PublicSettings>("public-settings", (): PublicSettings | null => null);
export const useUser = (): Ref<TokenResponse | null> => useState<TokenResponse>("user", (): TokenResponse | null => null);

type OkResponseData<T> = {
  data: T
};

function getAuthToken (): string | undefined {
  const rest = useRestApi().value;

  // If the Rest instance was created during SSR, it never read localStorage.
  // Calling getToken() on the client fixes that.
  rest.getToken();

  return rest.authToken ?? useUser().value?.token;
}

function getAuthHeaders (): Record<string, string> {
  const token = getAuthToken();
  if (!token) {
    return {};
  }

  // Keep Rest in sync so other API-lib calls include the token.
  useRestApi().value.setToken(token);

  return { Authorization: `Bearer ${token}` };
}

export function getSettings () {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    return;
  }

  const apiBase = (useRuntimeConfig().public.apiBase || "").replace(/\/+$/, "");

  $fetch<OkResponseData<PublicSettings>>(`${apiBase}/settings`, { headers })
    .then((res) => {
      useSettings().value = res.data;
    })
    .catch((err: Error) => {
      notify({
        group: "error",
        title: "Error",
        text: `Trying to get settings. ${err.message}.`
      }, 10000);
    });
}

export function getCategories () {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    return;
  }

  const apiBase = (useRuntimeConfig().public.apiBase || "").replace(/\/+$/, "");

  $fetch<OkResponseData<Category[]>>(`${apiBase}/category`, { headers })
    .then((res) => {
      useCategories().value = res.data;
    })
    .catch((err: Error) => {
      notify({
        group: "error",
        title: "Error",
        text: `Trying to get categories. ${err.message}.`
      }, 10000);
    });
}

export function getTags () {
  const headers = getAuthHeaders();
  if (!headers.Authorization) {
    return;
  }

  const apiBase = (useRuntimeConfig().public.apiBase || "").replace(/\/+$/, "");

  $fetch<OkResponseData<TorrentTag[]>>(`${apiBase}/tags`, { headers })
    .then((res) => {
      useTags().value = res.data;
    })
    .catch((err: Error) => {
      notify({
        group: "error",
        title: "Error",
        text: `Trying to get tags. ${err.message}.`
      }, 10000);
    });
}

export async function loginUser (login: string, password: string): Promise<boolean> {
  let authenticated = false;
  await useRestApi().value.user.loginUser({
    login,
    password
  })
    .then((user: TokenResponse) => {
      useUser().value = user;
      useRestApi().value.setToken(user.token);
      authenticated = true;

      // Now that we have a token, refresh bootstrap data.
      getSettings();
      getTags();
      getCategories();
    })
    .catch((err: Error) => {
      notify({
        group: "error",
        title: "Error",
        text: `Trying to login. ${err.message}.`
      }, 10000);
    });
  return authenticated;
}

export function logoutUser () {
  useUser().value = null;

  useRestApi().value.deleteToken();
}

export async function getUser () {
  // Ensure Rest reads localStorage token on the client.
  useRestApi().value.getToken();

  if (!useRestApi().value.authToken) {
    return;
  }

  return await useRestApi().value.user.renewToken()
    .then((user: TokenResponse) => {
      useUser().value = user;

      // Keep Rest/localStorage in sync with the renewed token.
      useRestApi().value.setToken(user.token);
    })
    .catch((err: Error) => {
      notify({
        group: "error",
        title: "Error",
        text: `Trying to get user info. ${err.message}.`
      }, 10000);
    });
}
