export function isLoggedIn() {
  try {
    return Boolean(localStorage.getItem("LoginToken"));
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
  } catch {}
}
