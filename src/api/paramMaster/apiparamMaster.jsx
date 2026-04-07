import Axios from "axios";
import { getallparam , getallparamBykey, deleteparam, createparam, getparam, updateparam,
    getallparamByParentId, getallparamwithparentname

} from './constants'
import { baseURL } from "../../config";

export const getallparamListBykey = async (key) => {
    var url = baseURL + getallparamBykey + key;
    let token = localStorage.getItem('LoginToken');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const getallparamListByParentId = async (ParentId) => {
    var url = baseURL + getallparamByParentId + ParentId;
    let token = localStorage.getItem('LoginToken');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const createparamasync = async (body) => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + createparam;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }
    try {
        const res = await Axios.post(url, body, config);
        return res;
    } catch (e) {
        return e.response
    }
}

export const updateparamasync = async (id, body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + updateparam+id;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    try {
        const res = await Axios.put(url, body, config);
        return res;
    } catch (e) {
        return e.response
    }
}

export const deleteparamasync = async (id) => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + deleteparam + id;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    try {
        const res = await Axios.delete(url,config);
        return res;
    } catch (e) {
        return e.response
    }
}

export const getallparamwListithparentname = async (key , parentId) => {
    var url = baseURL + getallparamwithparentname + key +"&parantid="+parentId;
    let token = localStorage.getItem('LoginToken');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const getallCategoryparamwListithparentname = async (key , parentId) => {
    var url = baseURL + getallparamwithparentname + key +"&parantid="+parentId;
    let token = localStorage.getItem('LoginToken');
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}