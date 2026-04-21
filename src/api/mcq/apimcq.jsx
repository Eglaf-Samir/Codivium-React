import Axios from "axios";
import {
    getallmcq, deletemcq, createmcq, getmcq, updatemcq, getallDifficultyLevel, getallCategory,
    mcqfileupload, getallmcqbyfilter, createmcqTimelogs, getallmcqbyadmin, getallCategorybyParentIds,getCategoriesByMode
} from './constants'
import { baseURL } from "../../config";
//'ngrok-skip-browser-warning': 'true'

export const getallmcqlist = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallmcq;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const getallmcqlistbyadmin = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallmcqbyadmin;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.post(url, body, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const getmcqdetails = async (id, mcqQuestionId) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getmcq + id + "&McqQuestionId=" + mcqQuestionId;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const Deletemcq = async (id, mcqQuestionId) => {
    let token = localStorage.getItem('LoginToken');
    let userid = localStorage.getItem("Userid");
    var url = baseURL + deletemcq + id + "&McqQuestionId=" + mcqQuestionId + "&userid=" + userid;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }
    try {
        const res = await Axios.delete(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const Createmcq = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + createmcq;
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
        console.error('Create paython output error:', e);
        throw e.response
    }
}
export const Updatemcq = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + updatemcq;
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
        console.error('Create paython output error:', e);
        throw e.response
    }
}

export const GetallDifficultyLevel = async (key) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallDifficultyLevel + key;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const GetallCategorybyParentIds = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallCategorybyParentIds;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.post(url, body, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const GetallCategory = async (ParentID, mode = "") => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallCategory + ParentID + "&mode=" + mode;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const GetCategoriesByMode = async (mode = "") => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getCategoriesByMode + mode;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}


export const Getallmcqbyfilter = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallmcqbyfilter;
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
        console.error('Create paython output error:', e);
        throw e.response
    }
}

export const Createmcqtimelogs = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + createmcqTimelogs;
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
        console.error('Create paython output error:', e);
        throw e.response
    }
}


export const CreatemcqUsingFile = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + mcqfileupload;
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data;',
            'Authorization': 'Bearer ' + token
        }
    }

    try {
        const res = await Axios.post(url, body, config);
        return res;
    } catch (e) {
        return e.response;
    }
}