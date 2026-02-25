import { toast } from 'react-toastify';

export const sendToastError =  (errorMessage) => {
    toast.error(errorMessage, {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
    });
}

export const sendToastSuccess = (successMessage) => {
    toast.success(successMessage, {
        position: "top-right",
        autoClose: false,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
    });
}