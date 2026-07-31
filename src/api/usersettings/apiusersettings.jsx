import Axios from "axios";
import { baseURL } from "../../config";

// Generic per-user settings API (backend: api/v1/user/settings). Stores one
// key/value row per user (upsert on KeyName). We use it to persist the Account
// & Settings → Appearance preferences so a user's setup follows them to any
// device/login. Values are plain strings (DisplayValue); the KeyName is the same
// lowercase localStorage key the app already reads.

const allUrl = baseURL + "api/v1/user/settings/all";
const createUrl = baseURL + "api/v1/user/settings/create";

function authConfig() {
  const token = localStorage.getItem("LoginToken");
  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
}

// Every Appearance preference we sync. All are lowercase snake_case, which
// matches the backend's lowercase KeyName storage exactly (no casing mismatch).
export const APPEARANCE_SETTING_KEYS = [
  "cv_site_theme",
  "as_dash_layout",
  "reduce_motion",
  "cv_drawer_speed",
  "cv_syntax_theme",
  "cv_editor_font_size",
  "cv_editor_font_family",
  "cv_repl_syntax_theme",
  "cv_repl_font_size",
  "cv_repl_font_family",
  "cv_instructions_font_size",
  "cv_instructions_font_family",
  "as_appear_subtab",
];

// Notification preferences ('1'|'0'). Persisted per-account the same way, so
// choices follow the user across devices and the backend can honour them (e.g.
// only email users who opted into marketing / weekly digests).
export const NOTIFICATION_SETTING_KEYS = [
  "notif_weekly_summary",
  "notif_milestones",
  "notif_in_app",
  "notif_marketing",
];

// GET all settings for the signed-in user (from the token).
export const GetAllUserSettings = async () => {
  try {
    return await Axios.get(allUrl, authConfig());
  } catch (e) {
    return e.response;
  }
};

// Upsert a single setting (create if new, update if the KeyName already exists).
// body: { KeyName, DisplayText, DisplayValue, Description? }
export const SaveUserSetting = async (body) => {
  try {
    return await Axios.post(createUrl, body, authConfig());
  } catch (e) {
    return e.response;
  }
};

// Fetch the user's saved appearance settings and mirror them into localStorage,
// so the whole app (site theme, editor/REPL, dashboard) reflects them on the
// next read. Also applies the site theme immediately and re-derives the
// reduce-motion mirror. Returns true on success. Safe to call unauthenticated
// (it just no-ops). Call this right after login.
export const hydrateAppearanceSettings = async () => {
  try {
    const res = await GetAllUserSettings();
    if (res?.status !== 200 || !Array.isArray(res.data)) return false;

    const allow = new Set(
      APPEARANCE_SETTING_KEYS.concat(NOTIFICATION_SETTING_KEYS).map((k) => k.toLowerCase()),
    );
    res.data.forEach((row) => {
      const key = (row?.keyName || "").toLowerCase();
      if (key && allow.has(key) && row.displayValue != null) {
        try {
          localStorage.setItem(key, String(row.displayValue));
        } catch (_) {
          /* ignore */
        }
      }
    });

    try {
      // reduce_motion drives the global effects mirror used elsewhere.
      const rm = localStorage.getItem("reduce_motion");
      if (rm != null) localStorage.setItem("cvEffects", rm === "1" ? "low" : "full");
      // Apply the site theme now so it takes effect across the SPA immediately.
      const theme = localStorage.getItem("cv_site_theme");
      if (theme) document.documentElement.setAttribute("data-theme", theme);
    } catch (_) {
      /* ignore */
    }
    return true;
  } catch (_) {
    return false;
  }
};
