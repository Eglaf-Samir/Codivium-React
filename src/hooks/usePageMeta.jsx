// hooks/usePageMeta.js
import { useEffect } from "react";

const usePageMeta = (pageName) => {
    useEffect(() => {
        document.body.setAttribute("data-page", pageName);

        return () => {
            document.body.removeAttribute("data-page");
        };
    }, [pageName]);
};

export default usePageMeta;