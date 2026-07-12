import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal/Modal';
import { Plus, Trash2, Fuel, Search, DollarSign } from 'lucide-react';
import '../Vehicles/PageStyles.css';
import './Fuel.css';

const emptyFuelForm = { vehicle: '', trip: '', liters: '', cost: '', date: '' };
const emptyExpenseForm = { vehicle: '', notes: '', amount: '', date: '', type: 'Toll' };
const EXPENSE_TYPES = ['Toll', 'Parking', 'Cleaning', 'Repair', 'Insurance', 'Fine', 'Other'];

const FuelLogs = () => {
  const { user } = useAuth();
  const canAddFuel = ['fleet_manager', 'driver'].includes(user?.role);
  const canDeleteFuel = ['fleet_manager', 'financial_analyst'].includes(user?.role);
  const canManageExpense = ['fleet_manager', 'driver', 'financial_analyst'].includes(user?.role);

  const [tab, setTab] = useState('fuel');
  const [fuelLogs, setFuelLogs] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [fuelModal, setFuelModal] = useState(false);
  const [expenseModal, setExpenseModal] = useState(false);
  const [fuelForm, setFuelForm] = useState(emptyFuelForm);
  const [expenseForm, setExpenseForm] = useState(emptyExpenseForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      const [fl, ex, v, t] = await Promise.all([
        api.get('/fuel/logs'), api.get('/fuel/expenses'),
        api.get('/vehicles'), api.get('/trips'),
      ]);
      setFuelLogs(fl.data); setExpenses(ex.data);
      setVehicles(v.data); setTrips(t.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleFuelSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await api.post('/fuel/logs', fuelForm);
      setFuelModal(false); fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed.');
    } finally { setSubmitting(false); }
  };

  const handleExpenseSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await api.post('/fuel/expenses', { vehicle: expenseForm.vehicle, type: expenseForm.type, amount: expenseForm.amount, date: expenseForm.date, notes: expenseForm.notes });
      setExpenseModal(false); fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed.');
    } finally { setSubmitting(false); }
  };

  const deleteFuelLog = async (id) => {
    if (!window.confirm('Delete this fuel log?')) return;
    try { await api.delete(`/fuel/logs/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const deleteExpense = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try { await api.delete(`/fuel/expenses/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const totalFuelCost = fuelLogs.reduce((s, l) => s + (l.cost || 0), 0);
  const totalExpenses = expenses.reduce((s, e) => s + (e.amount || 0), 0);

  const filteredFuel = fuelLogs.filter(l =>
    l.vehicle?.name?.toLowerCase().includes(search.toLowerCase())
  );
  const filteredExpenses = expenses.filter(e =>
    e.vehicle?.name?.toLowerCase().includes(search.toLowerCase()) ||
    e.description?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-icon"><Fuel size={20} color="#6366f1" /></div>
          <div>
            <h1>Fuel & Expenses</h1>
            <p className="text-secondary">Total fuel ₹{totalFuelCost.toLocaleString()} · Other expenses ₹{totalExpenses.toLocaleString()}</p>
          </div>
        </div>
        <div className="page-actions">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search by vehicle..." value={search} onChange={e => setSearch(e.target.value)} id="fuel-search" />
          </div>
          {tab === 'fuel' && canAddFuel && (
            <button className="btn btn-primary" onClick={() => { setFuelForm({ ...emptyFuelForm, date: new Date().toISOString().slice(0, 10) }); setError(''); setFuelModal(true); }} id="add-fuel-btn">
              <Plus size={16} /> Log Fuel
            </button>
          )}
          {tab === 'expenses' && canManageExpense && (
            <button className="btn btn-primary" onClick={() => { setExpenseForm({ ...emptyExpenseForm, date: new Date().toISOString().slice(0, 10) }); setError(''); setExpenseModal(true); }} id="add-expense-btn">
              <Plus size={16} /> Add Expense
            </button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="fuel-summary">
        <div className="fuel-summary-card">
          <Fuel size={20} color="#6366f1" />
          <div>
            <span className="fuel-summary-value">₹{totalFuelCost.toLocaleString()}</span>
            <span className="fuel-summary-label">Total Fuel Cost</span>
          </div>
        </div>
        <div className="fuel-summary-card">
          <DollarSign size={20} color="#8b5cf6" />
          <div>
            <span className="fuel-summary-value">₹{totalExpenses.toLocaleString()}</span>
            <span className="fuel-summary-label">Total Expenses</span>
          </div>
        </div>
        <div className="fuel-summary-card">
          <Fuel size={20} color="#10b981" />
          <div>
            <span className="fuel-summary-value">{fuelLogs.reduce((s, l) => s + (l.liters || 0), 0).toFixed(1)} L</span>
            <span className="fuel-summary-label">Total Liters</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="fuel-tabs">
        <button className={`fuel-tab ${tab === 'fuel' ? 'active' : ''}`} onClick={() => setTab('fuel')}>Fuel Logs</button>
        <button className={`fuel-tab ${tab === 'expenses' ? 'active' : ''}`} onClick={() => setTab('expenses')}>Expenses</button>
      </div>

      {/* Table */}
      <div className="glass-panel table-wrap">
        {loading ? <div className="loading-row"><div className="spinner" /></div>
          : tab === 'fuel' ? (
            filteredFuel.length === 0 ? <div className="empty-state">No fuel logs found.</div>
            : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Liters</th>
                      <th>Cost (₹)</th>
                      <th>Price/Liter</th>
                      <th>Trip</th>
                      <th>Date</th>
                      {canDeleteFuel && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFuel.map(l => (
                      <tr key={l._id}>
                        <td style={{ fontWeight: 500 }}>{l.vehicle?.name || '—'}</td>
                        <td>{l.liters} L</td>
                        <td>₹{l.cost?.toLocaleString()}</td>
                        <td>₹{l.liters > 0 ? (l.cost / l.liters).toFixed(2) : '—'}</td>
                        <td>{l.trip ? `${l.trip.source} → ${l.trip.destination}` : '—'}</td>
                        <td>{new Date(l.date).toLocaleDateString('en-IN')}</td>
                        {canDeleteFuel && (
                          <td>
                            <button className="icon-btn danger" onClick={() => deleteFuelLog(l._id)} title="Delete"><Trash2 size={15} /></button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          ) : (
            filteredExpenses.length === 0 ? <div className="empty-state">No expenses found.</div>
            : (
              <div className="table-container">
                <table>
                  <thead>
                    <tr>
                      <th>Vehicle</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Amount (₹)</th>
                      <th>Date</th>
                      {canManageExpense && <th>Actions</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredExpenses.map(e => (
                      <tr key={e._id}>
                        <td style={{ fontWeight: 500 }}>{e.vehicle?.name || '—'}</td>
                        <td><span className="badge badge-neutral">{e.type}</span></td>
                        <td>{e.notes || '—'}</td>
                        <td>₹{e.amount?.toLocaleString()}</td>
                        <td>{new Date(e.date).toLocaleDateString('en-IN')}</td>
                        {canManageExpense && (
                          <td>
                            <button className="icon-btn danger" onClick={() => deleteExpense(e._id)} title="Delete"><Trash2 size={15} /></button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          )}
      </div>

      {/* Log Fuel Modal */}
      <Modal isOpen={fuelModal} onClose={() => setFuelModal(false)} title="Log Fuel Entry">
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleFuelSubmit} className="modal-form">
          <div className="form-group">
            <label>Vehicle</label>
            <select name="vehicle" value={fuelForm.vehicle} onChange={e => setFuelForm(p => ({ ...p, vehicle: e.target.value }))} required>
                <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Related Trip (optional)</label>
            <select name="trip" value={fuelForm.trip} onChange={e => setFuelForm(p => ({ ...p, trip: e.target.value }))}>
              <option value="">None</option>
              {trips.filter(t => t.status === 'Dispatched').map(t => (
                <option key={t._id} value={t._id}>{t.source} → {t.destination}</option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Liters</label>
              <input type="number" value={fuelForm.liters} onChange={e => setFuelForm(p => ({ ...p, liters: e.target.value }))} required min="0" step="0.1" />
            </div>
            <div className="form-group">
              <label>Total Cost (₹)</label>
              <input type="number" value={fuelForm.cost} onChange={e => setFuelForm(p => ({ ...p, cost: e.target.value }))} required min="0" />
            </div>
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={fuelForm.date} onChange={e => setFuelForm(p => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setFuelModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? <span className="spinner-sm" /> : 'Log Fuel'}</button>
          </div>
        </form>
      </Modal>

      {/* Add Expense Modal */}
      <Modal isOpen={expenseModal} onClose={() => setExpenseModal(false)} title="Add Expense">
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleExpenseSubmit} className="modal-form">
          <div className="form-group">
            <label>Vehicle</label>
            <select value={expenseForm.vehicle} onChange={e => setExpenseForm(p => ({ ...p, vehicle: e.target.value }))} required>
                <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.name}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select value={expenseForm.type} onChange={e => setExpenseForm(p => ({ ...p, type: e.target.value }))}>
                {EXPENSE_TYPES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input type="number" value={expenseForm.amount} onChange={e => setExpenseForm(p => ({ ...p, amount: e.target.value }))} required min="0" />
            </div>
          </div>
          <div className="form-group">
            <label>Notes</label>
            <input value={expenseForm.notes} onChange={e => setExpenseForm(p => ({ ...p, notes: e.target.value }))} placeholder="e.g. Highway toll Mumbai-Pune" />
          </div>
          <div className="form-group">
            <label>Date</label>
            <input type="date" value={expenseForm.date} onChange={e => setExpenseForm(p => ({ ...p, date: e.target.value }))} required />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setExpenseModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>{submitting ? <span className="spinner-sm" /> : 'Add Expense'}</button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default FuelLogs;
