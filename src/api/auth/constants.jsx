export const createuser = "api/v1/account/register";
export const loginuser = "api/v1/account/login";
export const programminglevel =
  "api/v1/account/GetAllProgrammingLevel?keyvalue=";
export const getuser = "api/v1/account/getuserDetails?userid=";
export const updateuser = "api/v1/account/userDetailsUpdate?userid=";

export const userresetpassword = "api/v1/account/resetpassword";

export const getnoofquestion = "api/v1/account/getnoofquestion?userid=";
export const updatenoofquestion =
  "api/v1/account/userUpdateNoofquestion?userid=";

export const getUserReceivingEmails =
  "api/v1/account/getUserReceivingEmails?userid=";
export const userdetailsUpdateisreceivingemails =
  "api/v1/account/updateisreceivingemails?userid=";

export const getUserLightMode = "api/v1/account/GetUserIsLightMode?userid=";
export const updateLightMode = "api/v1/account/updateIsLightMode?userid=";

export const getUserPersonalEmoji =
  "api/v1/account/GetUserPersonalEmoji?userid=";
export const updateuserPersonalEmoji =
  "api/v1/account/UserPersonalEmojiUpdate?userid=";

//super admin
export const getalladminusers = "api/v1/account/getalladminUserDetails";
export const updateUserActiveInactive =
  "api/v1/account/userActiveInactiveBySuperadmin?userid=";
export const updateuserpassword = "api/v1/account/superadminupdatepassword";

export const updateuserDetails =
  "api/v1/account/userDetailsUpdateBysuperadmin?userid=";

export const visitlogcreate = "api/v1/visitlog/createvisit";

export const updatepassword = "api/v1/account/updatepassword";
export const createusernew = "api/v1/account/register-simple";
export const sendverifyemail = "api/v1/account/send-verify-email";
export const verifyemailtoken = "api/v1/account/verify-email?token=";
export const checkverifystatus = "api/v1/account/check-verify-status?email=";


export const updateprofilephoto = "api/v1/account/profile-photo?userid=";
// No userid param — the backend identifies the requester from their own
// auth token (never a client-supplied id), so one user can't request
// deletion of another.
export const requestaccountdeletion = "api/v1/account/request-deletion";

