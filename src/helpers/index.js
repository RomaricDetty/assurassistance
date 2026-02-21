import { toast } from 'react-toastify';


import Orange from '../assets/images/payment_methods/orange.png'
import MTN from '../assets/images/payment_methods/mtn.png'
import Moov from '../assets/images/payment_methods/moov.png'
import Wave from '../assets/images/payment_methods/wave.png'


export const sendToastError =  (errorMessage) => {
    toast.error(errorMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
    });
}

export const sendToastSuccess = (successMessage) => {
    toast.success(successMessage, {
        position: "top-right",
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true
    });
}



export const getPaymentProviders = () => {
    return [
        {
            id: 1,
            name: 'Orange',
            img_provider: Orange,
            type: 'mobile',
            code: 'om'
        },
        {
            id: 2,
            name: 'MTN',
            img_provider: MTN,
            type: 'mobile',
            code: 'mtn'
        },
        {
            id: 3,
            name: 'Wave',
            img_provider: Wave,
            type: 'mobile',
            code: 'wave'
        },
        {
            id: 4,
            name: 'Moov',
            img_provider: Moov,
            type: 'mobile',
            code: 'moov'
        }
    ];
};