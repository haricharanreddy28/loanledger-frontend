import axiosInstance from '../api/axiosConfig';

const dashboardService = {
  getAdminStats: () => axiosInstance.get('/admin/stats'),
  getLenderStats: () => axiosInstance.get('/lender/stats'),
  getBorrowerStats: () => axiosInstance.get('/borrower/stats'),
  getAnalystLoanSummary: () => axiosInstance.get('/analyst/loan-summary'),
  getRiskAnalysis: () => axiosInstance.get('/analyst/risk-analysis'),
  getRepaymentTrends: () => axiosInstance.get('/analyst/repayment-trends'),
  getUserActivity: () => axiosInstance.get('/analyst/analytics/user-activity'),
};

export default dashboardService;
