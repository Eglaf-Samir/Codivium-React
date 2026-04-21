import Axios from "axios";
import { createcontact} from './constants'
import { baseURL } from "../../config";

export const CreateContact = async (body) => {
    var url = baseURL + createcontact;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        }
    }
    try {
        const res = await Axios.post(url, body, config);
        return res;
    } catch (e) {
        console.error('Create Contact error:', e);
        throw e.response
    }
}