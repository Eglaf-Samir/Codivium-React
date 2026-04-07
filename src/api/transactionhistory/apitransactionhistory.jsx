import Axios from "axios";
import {allusertransactionhistory } from './constants'
import { baseURL } from "../../config";


export const Getallusertransactionhistory = async (id) => {
    var url = baseURL + allusertransactionhistory + id;
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