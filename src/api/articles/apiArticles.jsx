import Axios from "axios";
import { baseURL } from "../../config";
import {
  publicArticlesList,
  publicArticleBySlug,
  getallarticles,
  articledetail,
  createarticle,
  updatearticle,
  deletearticle,
} from './constants';

// ── Public (no auth) — used by src/pages/Articles.jsx and Article.jsx ──────
export const getPublicArticles = async () => {
  try {
    const res = await Axios.get(baseURL + publicArticlesList);
    return res;
  } catch (e) {
    return e.response;
  }
};

export const getPublicArticleBySlug = async (slug) => {
  try {
    const res = await Axios.get(baseURL + publicArticleBySlug + slug);
    return res;
  } catch (e) {
    return e.response;
  }
};

// ── Admin (auth) — used by src/pages/admin/ArticleManagement.jsx ──────────
function authConfig() {
  const token = localStorage.getItem('LoginToken');
  return {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + token,
    },
  };
}

export const getAllArticlesAdmin = async () => {
  try {
    const res = await Axios.get(baseURL + getallarticles, authConfig());
    return res;
  } catch (e) {
    return e.response;
  }
};

export const getArticleAdminById = async (id) => {
  try {
    const res = await Axios.get(baseURL + articledetail + id, authConfig());
    return res;
  } catch (e) {
    return e.response;
  }
};

export const createArticleAsync = async (body) => {
  try {
    const res = await Axios.post(baseURL + createarticle, body, authConfig());
    return res;
  } catch (e) {
    return e.response;
  }
};

export const updateArticleAsync = async (body) => {
  try {
    const res = await Axios.put(baseURL + updatearticle, body, authConfig());
    return res;
  } catch (e) {
    return e.response;
  }
};

export const deleteArticleAsync = async (id) => {
  try {
    const res = await Axios.delete(baseURL + deletearticle + id, authConfig());
    return res;
  } catch (e) {
    return e.response;
  }
};
