import Axios from "axios";
import {
    getallInterviewPrepration, getallInterviewPreprationinerdetails, paythonoutput, paythonoutputstream, noncodingoutput, userTimelogandoutput,
    getcheckusercode, deleteInterviewPrepration, createInterviewPrepration, getInterviewPrepration, updateInterviewPrepration,
    createInterviewPreprationUnitTest, interviewPreprationUnitTestDelete,
    getallInterviewPreprationbyadmin, allUnitTestListbyId, interviewPreprationfileupload, interviewUnitTestfileupload, getallinterviewpreprationfiltering, submitUserInterViewPrepration
} from './constants'
import { baseURL } from "../../config";

// Streaming variant of CreateOutput. Reads the NDJSON response body line by
// line and forwards each event ({type, ...}) to `onEvent`. Resolves with the
// final `complete` event's `result` (the same object the non-streaming
// endpoint would have returned). Falls back to throwing if the stream errors.
export const CreateOutputStream = async (body, onEvent) => {
    const token = localStorage.getItem('LoginToken');
    const url = baseURL + paythonoutputstream;
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
    // Drain any trailing partial buffer
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

export const getallInterviewPreprationlist = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallInterviewPrepration;
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

export const getallInterviewPreprationadminlist = async () => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallInterviewPreprationbyadmin;
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

export const GetallInterviewPreprationinerdetails = async (id, ExerciseId) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallInterviewPreprationinerdetails + id + "&ExerciseId=" + ExerciseId;
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
    console.log("body==>", body)
    var url = baseURL + paythonoutput;
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

export const checkalreadycodeadd = async (UserID, IntPID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getcheckusercode + UserID + "&InterviewPreprationId=" + IntPID;
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

export const DeleteInterviewPrepration = async (IntPID) => {
    let token = localStorage.getItem('LoginToken');
    let userid = localStorage.getItem("Userid");
    var url = baseURL + deleteInterviewPrepration + IntPID + "&userid=" + userid;
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

export const CreateInterviewPrepration = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + createInterviewPrepration;
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

export const UpdateInterviewPrepration = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + updateInterviewPrepration;
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

export const GetInterviewPrepration = async (IntPID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getInterviewPrepration + IntPID;
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

export const Getallinterviewpreprationfiltering = async (filters) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + getallinterviewpreprationfiltering;
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

export const AllUnitTestListbyId = async (IntPID) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + allUnitTestListbyId + IntPID;
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

export const CreateInterviewPreprationUnitTest = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + createInterviewPreprationUnitTest;
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

export const DeleteInterviewPreprationUnitTest = async (csInterviewPreprationId, ExcerciseId, UnittestId) => {
    let token = localStorage.getItem('LoginToken');
    let userid = localStorage.getItem("Userid");
    var url = baseURL + interviewPreprationUnitTestDelete + csInterviewPreprationId + "&ExcerciseId=" + ExcerciseId + "&UnittestId=" + UnittestId;
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

export const CreateInterviewPreprationUsingFile = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + interviewPreprationfileupload;
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

export const CreateInterviewPreprationUnitTestUsingFile = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + interviewUnitTestfileupload;
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

export const runcode = async (code) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + 'api/v1/interviewprepration/run';
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + token
        }
    }

    try {
        const res = await Axios.post(url, { code }, config);
        return res;
    } catch (e) {
        return e.response;
    }
}

export const SaveInterviewPreparationSession = async (body) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + 'api/v1/interviewprepration/SaveInterviewPreparationSession';
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


export const GetInterviewPreparationSession = async (UserId, InterViewPreprationId) => {
    let token = localStorage.getItem('LoginToken');
    var url = baseURL + 'api/v1/interviewprepration/GetInterviewPreparationSession?userId=' + UserId + '&interviewPreprationId=' + InterViewPreprationId;
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



