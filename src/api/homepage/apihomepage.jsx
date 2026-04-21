import Axios from "axios";
import { getallhomepage} from './constants'
import { baseURL } from "../../config";

export const gethomepagedetails = async (type) => {
    var url = baseURL + getallhomepage+type;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.get(url,config);
        return res;
    } catch (e) {
        return e.response;
        // console.error('get home page details error:', e);
        //throw e.response
    }
}