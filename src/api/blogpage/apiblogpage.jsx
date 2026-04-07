import Axios from "axios";
import { getallblogpage} from './constants'
import { baseURL } from "../../config";

export const getblogspagedetails = async (type) => {
    var url = baseURL + getallblogpage + type;
    const config = {
        headers: {
            'Content-Type': 'application/json',
        }
    }
    try {
        const res = await Axios.get(url,config);
        return res;
    } catch (e) {
        return e.response;
    }
}