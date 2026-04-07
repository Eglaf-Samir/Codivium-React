
import Axios from "axios";
import {getallemoji} from './constants'
import { baseURL } from "../../config";

export const getallemojilist = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallemoji;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization':'Bearer '+ token,
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