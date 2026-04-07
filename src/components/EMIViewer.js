import React, { useState } from 'react';
import '../styles/global.css';

const EMIViewer = () => {
  const [formData, setFormData] = useState({
    principal: '', annualRate: '', tenureMonths: ''
  });
  const [result, setResult] = useState(null);
  const [schedule, setSchedule] = useState([]);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!formData.principal || parseFloat(formData.principal) < 1000)
      e.principal = 'Minimum principal of ₹1,000 required';
    if (!formData.annualRate || parseFloat(formData.annualRate) <= 0)
      e.annualRate = 'Valid interest rate (%) required';
    if (!formData.tenureMonths || parseInt(formData.tenureMonths) < 1)
      e.tenureMonths = 'Minimum tenure 1 month required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const calculateEMI = () => {
    if (!validate()) return;

    const P = parseFloat(formData.principal);
    const R = parseFloat(formData.annualRate) / 12 / 100;
    const N = parseInt(formData.tenureMonths);

    let emi;
    if (R === 0) {
      emi = P / N;
    } else {
      const onePlusRPowN = Math.pow(1 + R, N);
      emi = (P * R * onePlusRPowN) / (onePlusRPowN - 1);
    }

    const totalPayable = emi * N;
    const totalInterest = totalPayable - P;

    setResult({
      emi: emi.toFixed(2),
      totalPayable: totalPayable.toFixed(2),
      totalInterest: totalInterest.toFixed(2),
    });

    let balance = P;
    const newSchedule = [];
    const today = new Date();

    for (let i = 1; i <= N; i++) {
      const interestComponent = balance * R;
      const principalComponent = emi - interestComponent;
      balance = Math.max(0, balance - principalComponent);

      const dueDate = new Date(today);
      dueDate.setMonth(today.getMonth() + i);

      newSchedule.push({
        month: i,
        emi: emi.toFixed(2),
        principal: principalComponent.toFixed(2),
        interest: interestComponent.toFixed(2),
        balance: balance.toFixed(2),
        dueDate: dueDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      });
    }
    setSchedule(newSchedule);
  };

  return (
    <div className="emi-calculator animate-fade-in">
      <div className="row g-4">
        <div className="col-lg-4">
          <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: 'var(--radius-lg)' }}>
            <h5 className="fw-bold mb-4" style={{ color: 'var(--color-heading)' }}>
              <i className="bi bi-calculate me-2 text-primary"></i>Repayment Modeler
            </h5>
            
            <div className="mb-4">
              <label className="form-label small fw-bold text-muted text-uppercase">Principal Investment</label>
              <div className="input-group input-group-lg shadow-none">
                <span className="input-group-text bg-soft border-0 text-muted fw-bold">₹</span>
                <input
                  type="number" className={`form-control border-0 bg-soft ${errors.principal ? 'is-invalid' : ''}`}
                  placeholder="0.00"
                  value={formData.principal}
                  onChange={e => setFormData({ ...formData, principal: e.target.value })}
                />
              </div>
              {errors.principal && <div className="text-danger small mt-1">{errors.principal}</div>}
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold text-muted text-uppercase">Annual Interest Rate</label>
              <div className="input-group input-group-lg">
                <input
                  type="number" step="0.1"
                  className={`form-control border-0 bg-soft ${errors.annualRate ? 'is-invalid' : ''}`}
                  placeholder="0.0%"
                  value={formData.annualRate}
                  onChange={e => setFormData({ ...formData, annualRate: e.target.value })}
                />
                <span className="input-group-text bg-soft border-0 text-muted fw-bold">%</span>
              </div>
              {errors.annualRate && <div className="text-danger small mt-1">{errors.annualRate}</div>}
            </div>

            <div className="mb-4">
              <label className="form-label small fw-bold text-muted text-uppercase">Installment Period</label>
              <div className="input-group input-group-lg">
                <input
                  type="number"
                  className={`form-control border-0 bg-soft ${errors.tenureMonths ? 'is-invalid' : ''}`}
                  placeholder="0"
                  value={formData.tenureMonths}
                  onChange={e => setFormData({ ...formData, tenureMonths: e.target.value })}
                />
                <span className="input-group-text bg-soft border-0 text-muted fw-bold">MO.</span>
              </div>
              {errors.tenureMonths && <div className="text-danger small mt-1">{errors.tenureMonths}</div>}
            </div>

            <button className="btn btn-primary w-100 p-3 fw-bold shadow-sm mt-2" onClick={calculateEMI}>
              Sync Amortization Schedule
            </button>
          </div>
        </div>

        <div className="col-lg-8">
          {result ? (
            <div className="h-100 d-flex flex-column gap-4">
              <div className="row g-3">
                <div className="col-md-4">
                  <div className="p-4 bg-white border-bottom border-primary border-4 shadow-sm" style={{ borderRadius: 'var(--radius-md)' }}>
                    <div className="small text-muted fw-bold text-uppercase mb-1">Monthly Installment</div>
                    <div className="h3 fw-bold m-0" style={{ color: 'var(--color-primary)' }}>₹{parseFloat(result.emi).toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-4 bg-white border-bottom border-success border-4 shadow-sm" style={{ borderRadius: 'var(--radius-md)' }}>
                    <div className="small text-muted fw-bold text-uppercase mb-1">Capital + Interest</div>
                    <div className="h3 fw-bold m-0">₹{parseFloat(result.totalPayable).toLocaleString('en-IN')}</div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="p-4 bg-white border-bottom border-danger border-4 shadow-sm" style={{ borderRadius: 'var(--radius-md)' }}>
                    <div className="small text-muted fw-bold text-uppercase mb-1">Cost of Credit</div>
                    <div className="h3 fw-bold m-0">₹{parseFloat(result.totalInterest).toLocaleString('en-IN')}</div>
                  </div>
                </div>
              </div>

              <div className="card border-0 shadow-sm flex-grow-1 overflow-hidden" style={{ borderRadius: 'var(--radius-lg)' }}>
                <div className="card-header bg-white border-0 p-4">
                  <h6 className="fw-bold m-0">Amortization Table</h6>
                </div>
                <div className="table-responsive" style={{ maxHeight: '420px' }}>
                  <table className="table table-hover align-middle custom-table mb-0">
                    <thead>
                      <tr>
                        <th className="ps-4">Cycle</th>
                        <th>EMI Component</th>
                        <th>Principal</th>
                        <th>Interest</th>
                        <th>Residual</th>
                        <th className="pe-4 text-end">Projected Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {schedule.map(row => (
                        <tr key={row.month} className="transition-hover">
                          <td className="ps-4 py-3 fw-bold text-muted font-monospace">{row.month}</td>
                          <td>₹{parseFloat(row.emi).toLocaleString('en-IN')}</td>
                          <td className="text-primary fw-medium">₹{parseFloat(row.principal).toLocaleString('en-IN')}</td>
                          <td className="text-danger small">₹{parseFloat(row.interest).toLocaleString('en-IN')}</td>
                          <td className="fw-bold">₹{parseFloat(row.balance).toLocaleString('en-IN')}</td>
                          <td className="pe-4 text-end small text-muted">{row.dueDate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <div className="card border-0 shadow-sm h-100 d-flex align-items-center justify-content-center bg-soft p-5 text-center" style={{ borderRadius: 'var(--radius-lg)', border: '1px dashed var(--color-border)' }}>
              <div className="opacity-50">
                <i className="bi bi-graph-up-arrow fs-1 text-muted"></i>
                <h6 className="mt-3 fw-bold">Awaiting Model Parameters</h6>
                <p className="text-muted small">Enter loan metrics on the left to generate your amortization forecast.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .custom-table thead th {
          background-color: var(--color-bg);
          color: var(--color-muted);
          text-transform: uppercase;
          font-size: 0.65rem;
          font-weight: 700;
          letter-spacing: 1px;
          border-bottom: 1px solid var(--color-border);
          padding: 12px 16px;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .form-control:focus {
          background: #fff;
          box-shadow: none;
          border: 2px solid var(--color-primary);
        }
      `}</style>
    </div>
  );
};

export default EMIViewer;