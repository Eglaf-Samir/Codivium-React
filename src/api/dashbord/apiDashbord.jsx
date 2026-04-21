import Axios from "axios";
import { getallDashboarditem , getsuperadminDashboard , getalluserDashboarditem , getalluserMcqDashboarditem} from './constants'
import { baseURL } from "../../config";

export const  getalldashborditem = async (userID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallDashboarditem + userID;
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

export const  getalluserdashborditem = async (userID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getalluserDashboarditem + userID;
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

export const  getsuperadmindashbord = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getsuperadminDashboard ;
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

export const  getalluserMcqdashborditem = async (userID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getalluserMcqDashboarditem + userID;
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