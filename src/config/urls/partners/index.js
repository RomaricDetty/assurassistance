import { BASE_URL } from "../base";

export const getAllPartners = `${BASE_URL}/api/partner/list`;
export const createPartner = `${BASE_URL}/api/partner/create`;
export const getStatistics = `${BASE_URL}/api/partner/statistics`;
export const getMainBalance = `${BASE_URL}/api/partner/get-balance`;
export const getPartnerBalance = `${BASE_URL}/api/partner/admin/get-partner-balance`;
export const getPartnerDetails = `${BASE_URL}/api/partner/admin/get-partner`;
export const updatePartnerDetails = `${BASE_URL}/api/partner/admin/update`;
export const updatePartnerPassword = `${BASE_URL}/api/partner/admin/update-password`;
export const blockPartner = `${BASE_URL}/api/partner/block`;
export const unblockPartner = `${BASE_URL}/api/partner/unblock`;