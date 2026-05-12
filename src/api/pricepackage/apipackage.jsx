import Axios from "axios";
import { allpackages, allpackagefiltering, getepackagebyid, createpackage, getallepackage, updatepackage, deletepackage , getallCurrency, allpackagesBillingPeriod ,
     packagepurchasecheckout, geteActivePackagebyuserid, ActivepackagecancelByUser} from './constants'
import { baseURL } from "../../config";

export const getpackageslist = async () => {
    var url = baseURL + allpackages;
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

export const getpackageslistbybillingperiod = async (key) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + allpackagesBillingPeriod+ key;
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

export const getpackageslistbyfilter = async (currencyID) => {
    var url = baseURL + allpackagefiltering + currencyID;
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

export const getpackageslistbyadmin = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallepackage;
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

export const getpackagedetailsById = async (id) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getepackagebyid + id;
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

export const packagedelete = async (id) => {
    let token = localStorage.getItem('LoginToken');
    let userid = localStorage.getItem("Userid");
    var url = baseURL + deletepackage + id + "&loginuserid=" + userid;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }
    try {
        const res = await Axios.delete(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const createPackage = async (body) => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + createpackage;
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
        throw e.response
    }
}

export const createFreePackage = async (body) => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + createpackage +"/CreateFreePackage";
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
        throw e.response
    }
}

export const updatePackage = async (body) => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + updatepackage;
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
        throw e.response
    }
}

export const getCurrencylist = async (key) => {
    var url = baseURL + getallCurrency + key;
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

export const createcheckout = async (body) => {
    let token = localStorage.getItem('LoginToken');

    var url = baseURL + packagepurchasecheckout;
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
        throw e.response
    }
}

export const ActivePackagebyuserid = async (userid) => {
    var url = baseURL + geteActivePackagebyuserid + userid;
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

export const activepackagecancelByUser = async (id) => {
    var url = baseURL + ActivepackagecancelByUser + id;
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

