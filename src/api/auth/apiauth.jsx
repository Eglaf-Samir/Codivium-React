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
  createusernew
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
  debugger;
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
  debugger;
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
  var url = baseURL + "api/v1/account/forgotpassword?email=" + email;
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
