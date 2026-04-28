import Axios from "axios";
import {
    getalldeliberatepractic, getalldeliberatePracticeByadmin, getExerciseDetails, executedeliberatepracticeUserCode, executedeliberatepracticeUserCodeStream, noncodingoutput, userTimelogandoutput,
    checkDeliberatepracticeUserCode, deleteDeliberatePracticePreprationbyadmin, createdeliberatepractice, getDeliberatePracticePrepration, updatedeliberatepractice,
    createdeliberatepracticunittestadd, deliberatepracticUnitTestDelete, deliberatePracticePreprationUnitTestfileupload,
    alldeliberatepracticunittestlistbyid, DeliberatePracticePreprationbyfileupload, getalldeliberatePracticefiltering, submitUserInterViewPrepration
} from './constants'
import { baseURL } from "../../config";

// Streaming counterpart to CreateOutput. Same NDJSON line protocol as the
// interview-track variant; resolves with the final `complete` event's result.
export const CreateOutputStream = async (body, onEvent) => {
    const token = localStorage.getItem('LoginToken');
    const url = baseURL + executedeliberatepracticeUserCodeStream;
    const res = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true',
        },
        body,
    });
    if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        const err = new Error(`Stream failed (${res.status}): ${text || res.statusText}`);
        err.status = res.status;
        throw err;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';
    let finalResult = null;

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, idx).trim();
            buffer = buffer.slice(idx + 1);
            if (!line) continue;
            let evt;
            try { evt = JSON.parse(line); }
            catch { continue; }
            if (evt?.type === 'complete') finalResult = evt.result;
            try { onEvent && onEvent(evt); } catch (_) { /* keep streaming */ }
        }
    }
    const tail = buffer.trim();
    if (tail) {
        try {
            const evt = JSON.parse(tail);
            if (evt?.type === 'complete') finalResult = evt.result;
            onEvent && onEvent(evt);
        } catch { /* ignore */ }
    }

    return { status: 200, data: finalResult };
};

//used user

export const getallDeliberatepracticlist = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getalldeliberatepractic;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
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

export const checkDeliberatecodeadd = async (UserID, deliberatePracticeId) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + checkDeliberatepracticeUserCode + UserID + "&deliberatePracticeId=" + deliberatePracticeId;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
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

export const GetallInterviewPreprationinerdetails = async (id, practiceId) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getExerciseDetails + id + "&practiceId=" + practiceId;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
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

export const CreateOutput = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + executedeliberatepracticeUserCode;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }

    try {
        const res = await Axios.post(url, body, config);
        return res;
    } catch (e) {
        console.error('Create paython output error:', e);
        throw e.response
    }
}
//end user



//used start admin
export const getalldeliberatePracticelistByadmin = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getalldeliberatePracticeByadmin;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
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

export const CreateDeliberatePracticPrepration = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + createdeliberatepractice;
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
        console.error('Create output error:', e);
        throw e.response
    }
}

export const UpdateDeliberatePracticPrepration = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + updatedeliberatepractice;
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
        console.error('update output error:', e);
        return e.response
        //throw
    }
}


export const DeleteDeliberatePracticePrepration = async (IntPID) => {
    let token = localStorage.getItem('LoginToken');
    let userid = localStorage.getItem("Userid");
    var url = baseURL + deleteDeliberatePracticePreprationbyadmin + IntPID + "&userid=" + userid;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.delete(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const GetDeliberatePracticePrepration = async (IntPID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getDeliberatePracticePrepration + IntPID;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
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

export const CreateDeliberatePracticePreprationUsingFile = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + DeliberatePracticePreprationbyfileupload;
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data;',
            'Authorization': 'Bearer ' + token
        }
    }

    try {
        const res = await Axios.post(url, body, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const AllDeliberatePracticeUnitTestListbyId = async (IntPID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + alldeliberatepracticunittestlistbyid + IntPID;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
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


export const CreateDeliberatePracticUnitTestAdd = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + createdeliberatepracticunittestadd;
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
        console.error('Create output error:', e);
        throw e.response
    }
}

export const DeleteDeliberatePracticUnitTest = async (deliberatePracticeid, practiceId, UnittestId) => {
    let token = localStorage.getItem('LoginToken');
    let userid = localStorage.getItem("Userid");
    var url = baseURL + deliberatepracticUnitTestDelete + deliberatePracticeid + "&practiceId=" + practiceId + "&UnittestId=" + UnittestId;
    debugger;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.delete(url, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const CreateeliberatePracticeUnitTestUsingFile = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + deliberatePracticePreprationUnitTestfileupload;
    const config = {
        headers: {
            'Content-Type': 'multipart/form-data;',
            'Authorization': 'Bearer ' + token
        }
    }

    try {
        const res = await Axios.post(url, body, config);
        return res;
    } catch (e) {
        return e.response;
    }
}


//use end admin





// not used
export const CreateNoncodingOutput = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + noncodingoutput;
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
        console.error('Create paython output error:', e);
        throw e.response
    }
}

// not used
export const CreateUserTimelogOutput = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + userTimelogandoutput;
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
        console.error('Create paython output error:', e);
        throw e.response
    }
}

export const SubmitUserInterViewPrepration = async (body) => {
    console.log('runBodyggdhsj===>', body)
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + submitUserInterViewPrepration;
    console.log('url=====>', url)
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    try {
        const res = await Axios.post(url, body, config);
        console.log('response=====>', res)
        return res;
    } catch (e) {
        console.error('Create paython output error:', e);
        throw e.response
    }
}


export const GetalldeliberatePracticefiltering = async (filters) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getalldeliberatePracticefiltering;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
            'ngrok-skip-browser-warning': 'true'
        }
    }
    try {
        const res = await Axios.post(url, filters, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const SaveDeliberatePracticeSession = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + 'api/v1/deliberatepractice/SaveDeliberatePracticeSession';
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
        return e.response;
    }
}


export const GetDeliberatePracticeSession = async (UserId, DeliberatePracticePreprationId) => {
    console.log('GetDeliberatePracticeSession UserId:', UserId);
    console.log('GetDeliberatePracticeSession DeliberatePracticePreprationId:', DeliberatePracticePreprationId);
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + 'api/v1/deliberatepractice/GetDeliberatePracticeSession?userId=' + UserId + '&deliberatePracticePreprationId =' + DeliberatePracticePreprationId;
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token,
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




