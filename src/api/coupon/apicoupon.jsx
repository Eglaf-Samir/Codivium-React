import Axios from "axios";
import {
    allcouponlist, createcoupon, updatecoupon, deletecoupon, couponalldetails, alladminuserlist, createpromotioncodes,
    promotionCodeActive, promotionCodeDeActive, getallTrackCouponlist,getallTrackPromocodelist,getallPromocodelist
} from './constants'
import { baseURL } from "../../config";


export const getallcouponlist = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + allcouponlist;
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

export const postCreateCoupon = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + createcoupon;
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

export const putUpdateCoupon = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + updatecoupon;
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

export const couponDelete = async (id) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + deletecoupon + id;
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


export const getallcouponDetails = async (couponID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + couponalldetails + couponID;
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



export const getallAdminuser = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + alladminuserlist;
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

export const createpromotioncodesodes = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + createpromotioncodes;
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


export const PromotionCodeActive = async (id) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + promotionCodeActive + id;
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
export const PromotionCodeDeActive = async (id) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + promotionCodeDeActive + id;
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


export const getallTrackCoupon = async (id , PromoCodeID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallTrackCouponlist + id +"&PromoCodeID="+PromoCodeID;
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
export const getallTrackPromocode = async (id) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallTrackPromocodelist + id;
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

export const getallPromocodelistbyCouponId = async (id) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallPromocodelist + id;
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