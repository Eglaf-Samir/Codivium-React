import Axios from "axios";
import { getallfaqpage } from './constants'
import { baseURL } from "../../config";

export const getfaqpagedetails = async (type) => {
    var url = baseURL + getallfaqpage + type;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        }
    }
    try {
        const res = await Axios.get(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}