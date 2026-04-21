import Axios from "axios";
import { createfaq, updatefaq, deletefaq, allfaq } from './constants'
import { baseURL } from "../../config";


export const createfaqasync = async (body) => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + createfaq;
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

export const updatefaqasync = async (body) => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + updatefaq;
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
export const deletefaqasync = async (id) => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + deletefaq + id;
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

export const getallfaq = async () => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + allfaq;
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
        return e.response
    }
}