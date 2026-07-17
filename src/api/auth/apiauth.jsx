import Axios from "axios";
import {
  createuser,
  loginuser,
  programminglevel,
  getuser,
  updateuser,
  userresetpassword,
  getUserReceivingEmails,
  userdetailsUpdateisreceivingemails,
  getnoofquestion,
  updatenoofquestion,
  getUserLightMode,
  updateLightMode,
  getUserPersonalEmoji,
  updateuserPersonalEmoji,
  getalladminusers,
  updateUserActiveInactive,
  updateuserpassword,
  updateuserDetails,
  visitlogcreate,
  updatepassword,
  createusernew,
  sendverifyemail,
  verifyemailtoken,
  checkverifystatus,
  updateprofilephoto,
  requestaccountdeletion,
} from "./constants";
import { baseURL } from "../../config";

export const CreateUser = async (body) => {
  var url = baseURL + createuser;
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const res = await Axios.post(url, body, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const Loginuser = async (body) => {
  var url = baseURL + loginuser;
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const res = await Axios.post(url, body, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const getprogramminglevel = async (key) => {
  var url = baseURL + programminglevel + key;
  console.log("url", url);
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const getUserById = async (id) => {
  var url = baseURL + getuser + id;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const UpdateUserById = async (id, body) => {
  var url = baseURL + updateuser + id;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.put(url, body, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const UserResetPassword = async (body) => {
  var url = baseURL + userresetpassword;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.post(url, body, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const GetUserReceivingEmails = async (id) => {
  var url = baseURL + getUserReceivingEmails + id;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const UpdateIsreceivingEmails = async (id, isreceived) => {
  var url =
    baseURL +
    userdetailsUpdateisreceivingemails +
    id +
    "&IsReceivingEmails=" +
    isreceived;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const GetUserNoOfQuestion = async (id) => {
  var url = baseURL + getnoofquestion + id;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const UpdateNoOfQuestion = async (id, NoOfQuestion) => {
  var url = baseURL + updatenoofquestion + id + "&NoOfQuestion=" + NoOfQuestion;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const GetUserLightMode = async (id) => {
  var url = baseURL + getUserLightMode + id;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const UpdateLightMode = async (id, IsLightMode) => {
  var url = baseURL + updateLightMode + id + "&IsLightMode=" + IsLightMode;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    console.log("UpdateLightMode response:", res.data);
    return res;
  } catch (e) {
    console.error("UpdateLightMode error:", e.response);
    return e.response;
  }
};

export const GetUserPersonalEmoji = async (id) => {
  var url = baseURL + getUserPersonalEmoji + id;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const UpdateUserPersonalEmoji = async (id, Emojiid) => {
  var url = baseURL + updateuserPersonalEmoji + id + "&Emojiid=" + Emojiid;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const GetalladminUserslist = async () => {
  var url = baseURL + getalladminusers;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const UpdateActiveInactive = async (id, IsActive) => {
  var url = baseURL + updateUserActiveInactive + id + "&isActive=" + IsActive;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const SuperAdminUpdatePassword = async (body) => {
  var url = baseURL + updateuserpassword;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.post(url, body, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const SuperAdminUpdateUserDetails = async (id, body) => {
  var url = baseURL + updateuserDetails + id;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.put(url, body, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const Visitsite = async (body) => {
  var url = baseURL + visitlogcreate;
  const config = {
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true",
    },
  };
  try {
    const res = await Axios.post(url, body, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const ForgetPasswordApi = async (email) => {
  var url =
    baseURL + "api/v1/account/forgotpassword?email=" + encodeURIComponent(email);
  console.log("url", url);
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const res = await Axios.get(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const ResetPasswordApi = async (body) => {
  var url = baseURL + updatepassword;
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const res = await Axios.post(url, body, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const CreateUserNew = async (body) => {
  var url = baseURL + createusernew;
  const config = {
    headers: {
      "Content-Type": "application/json",
    },
  };
  try {
    const res = await Axios.post(url, body, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

// ── Verify-email-first signup ────────────────────────────────────────
// POST { email } → backend sends a verification link (24h validity).
export const SendVerifyEmail = async (email) => {
  var url = baseURL + sendverifyemail;
  const config = { headers: { "Content-Type": "application/json" } };
  try {
    const res = await Axios.post(url, { email }, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

// GET ?token=… → backend marks the token verified and returns { email, ok }.
export const VerifyEmailToken = async (token) => {
  var url = baseURL + verifyemailtoken + encodeURIComponent(token || "");
  try {
    const res = await Axios.get(url);
    return res;
  } catch (e) {
    return e.response;
  }
};

// GET ?email=… → cross-device poll. Returns { isVerified, token, email } once the
// link has been opened on ANY device, so the original signup window can advance.
export const CheckVerifyStatus = async (email) => {
  var url = baseURL + checkverifystatus + encodeURIComponent(email || "");
  try {
    const res = await Axios.get(url);
    return res;
  } catch (e) {
    return e.response;
  }
};

// Profile photo — persisted server-side (AppUser.ProfileImage) as a base64
// data URI, NOT localStorage (that was why every account on one browser
// showed the same photo). `imageDataUrl` is the full "data:image/...;base64,"
// string from FileReader.readAsDataURL.
export const UpdateProfilePhoto = async (id, imageDataUrl) => {
  var url = baseURL + updateprofilephoto + id;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.post(url, { imageDataUrl }, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const RemoveProfilePhoto = async (id) => {
  var url = baseURL + updateprofilephoto + id;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.delete(url, config);
    return res;
  } catch (e) {
    return e.response;
  }
};

// Self-service "Delete Account" — this NEVER deletes anything. It just emails
// Codivium staff a deletion request; a superadmin performs the actual
// deletion manually via the existing admin-only delete endpoint. No userid
// param — the backend identifies the requester from their own auth token.
export const RequestAccountDeletion = async () => {
  var url = baseURL + requestaccountdeletion;
  let token = localStorage.getItem("LoginToken");
  const config = {
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token,
    },
  };
  try {
    const res = await Axios.post(url, {}, config);
    return res;
  } catch (e) {
    return e.response;
  }
};
