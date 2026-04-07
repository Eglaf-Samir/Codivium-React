import Axios from "axios";
import { getalltopachivers} from './constants'
import { baseURL } from "../../config";

export const  getalltopachiverslist = async () => {
    var url = baseURL + getalltopachivers;
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