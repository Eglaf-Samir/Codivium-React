export function isLoggedIn() {
  try {
    return Boolean(localStorage.getItem("LoginToken"));
  } catch {
    return false;
  }
}

export function isSuperAdmin() {
  try {
    return (localStorage.getItem("UserRoleName") || "").toLowerCase() === "superadmin";
  } catch {
    return false;
  }
}

export function logout() {
  try {
    localStorage.removeItem("Userid");
    localStorage.removeItem("LoginToken");
    localStorage.removeItem("UserRoleName");
    localStorage.removeItem("userpackagedetails");
    // These aren't written anymore, but clear them defensively in case a
    // session predates this fix and still has them cached.
    localStorage.removeItem("UserDisplayName");
    localStorage.removeItem("UserEmail");
    localStorage.removeItem("cv_profile_name");
    localStorage.removeItem("cv_profile_email");
    localStorage.removeItem("cv_profile_image");
  } catch {}
}
