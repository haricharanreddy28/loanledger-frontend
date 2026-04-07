import React, { useState } from 'react';
import axios from 'axios';

const RazorpayPayment = ({ payment, onPaymentSuccess }) => {
  const [loading, setLoading] = useState(false);

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
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
      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        alert('Razorpay SDK failed to load. Please try again.');
        setLoading(false);
        return;
      }

      // Create order
      const orderResponse = await axios.post('/api/payments/create-order', {
        amount: payment.emiAmount,
        currency: 'INR',
        receipt: `EMI-${payment.id}`,
        loanId: payment.loan.id,
        paymentId: payment.id
      });

      if (!orderResponse.data.success) {
        alert('Failed to create payment order');
        setLoading(false);
        return;
      }

      const order = orderResponse.data.data;

      // Razorpay options
      const options = {
        key: 'rzp_test_SaiduyHaPeZWvC', // Your Razorpay test key
        amount: order.amount, // Amount in paisa
        currency: order.currency,
        name: 'Loan Ledger',
        description: `EMI Payment for Loan #${payment.loan.id}`,
        order_id: order.id,
        handler: async function (response) {
          // Verify payment
          try {
            const verifyResponse = await axios.post('/api/payments/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              loanId: payment.loan.id,
              paymentId: payment.id
            });

            if (verifyResponse.data.success) {
              alert('Payment successful! Email notifications sent to both lender and borrower.');
              onPaymentSuccess && onPaymentSuccess();
            } else {
              alert('Payment verification failed');
            }
          } catch (error) {
            console.error('Payment verification error:', error);
            alert('Payment verification failed');
          }
        },
        prefill: {
          name: 'Lender Name', // You can get this from user context
          email: 'lender@example.com',
          contact: '9999999999'
        },
        theme: {
          color: '#3399cc'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();

    } catch (error) {
      console.error('Payment error:', error);
      alert('Payment failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePayment}
      disabled={loading}
      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded disabled:opacity-50"
    >
      {loading ? 'Processing...' : `Pay ₹${payment.emiAmount}`}
    </button>
  );
};

export default RazorpayPayment;