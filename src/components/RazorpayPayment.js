import React, { useState } from 'react';
import axiosInstance from '../api/axiosConfig';
import { useAuth } from '../context/AuthContext';

const RAZORPAY_KEY_ID = process.env.REACT_APP_RAZORPAY_KEY_ID || 'rzp_test_SaiduyHaPeZWvC';

const RazorpayPayment = ({ payment, onPaymentSuccess, onPaymentError }) => {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handlePayment = async () => {
    setLoading(true);

    try {
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        const message = 'Razorpay SDK failed to load. Please try again.';
        onPaymentError && onPaymentError(message);
        alert(message);
        return;
      }

      const orderResponse = await axiosInstance.post('/payments/create-order', {
        amount: payment.emiAmount,
        currency: 'INR',
        receipt: `EMI-${payment.id}`,
        loanId: payment.loanId,
        paymentId: payment.id,
      });

      if (!orderResponse.data?.success) {
        const message = orderResponse.data?.message || 'Failed to create payment order';
        onPaymentError && onPaymentError(message);
        alert(message);
        return;
      }

      const order = orderResponse.data.data;

      const options = {
        key: RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: 'Loan Ledger',
        description: `EMI Payment for Loan #${payment.loanId}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            const verifyResponse = await axiosInstance.post('/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              loanId: payment.loanId,
              paymentId: payment.id,
            });

            if (verifyResponse.data?.success) {
              alert('Payment successful!');
              onPaymentSuccess && onPaymentSuccess();
              return;
            }

            const message = verifyResponse.data?.message || 'Payment verification failed';
            onPaymentError && onPaymentError(message);
            alert(message);
          } catch (error) {
            const message = error.response?.data?.message || 'Payment verification failed';
            onPaymentError && onPaymentError(message);
            alert(message);
          }
        },
        prefill: {
          name: user?.name || payment.borrowerName || 'Loan Ledger User',
          email: user?.email || '',
          contact: '',
        },
        theme: {
          color: '#3399cc',
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      const message = error.response?.data?.message || 'Payment failed. Please try again.';
      onPaymentError && onPaymentError(message);
      alert(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="btn btn-primary btn-sm px-4 fw-bold"
      style={{ borderRadius: 'var(--radius-md)' }}
    >
      {loading ? 'Processing...' : 'Remit'}
    </button>
  );
};

export default RazorpayPayment;
