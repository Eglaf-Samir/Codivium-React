import Axios from "axios";
import { getalltutorial} from './constants'
import { baseURL } from "../../config";

export const  getallgetalltutorial = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getalltutorial;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization':'Bearer '+ token
        }
    }
    try {
        const res = await Axios.get(url,config);
        return res;
    } catch (e) {
        return e.response;
    }
}