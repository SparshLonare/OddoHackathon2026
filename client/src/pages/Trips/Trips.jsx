import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal/Modal';
import { Plus, Map, Search, Play, CheckCheck, XCircle } from 'lucide-react';
import '../Vehicles/PageStyles.css';

const emptyForm = {
  source: '', destination: '', vehicle: '', driver: '',
  cargoWeight: '', plannedDistance: '',
};

const statusBadge = (status) => {
  const map = { Draft: 'neutral', Dispatched: 'warning', Completed: 'success', Cancelled: 'danger' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

const Trips = () => {
  const { user } = useAuth();
  const canWrite = ['fleet_manager', 'driver'].includes(user?.role);

  const [trips, setTrips] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Complete trip modal
  const [completeModal, setCompleteModal] = useState(false);
  const [completingId, setCompletingId] = useState(null);
  const [completeForm, setCompleteForm] = useState({ actualDistance: '', fuelConsumed: '' });

  const fetchAll = async () => {
    try {
      const [t, v, d] = await Promise.all([
        api.get('/trips'), api.get('/vehicles'), api.get('/drivers'),
      ]);
      setTrips(t.data);
      setVehicles(v.data.filter(v => v.status === 'Available' || v.status === 'On Trip'));
      setDrivers(d.data.filter(d => d.status === 'Available' || d.status === 'On Trip'));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      await api.post('/trips', form);
      setIsModalOpen(false); fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create trip.');
    } finally { setSubmitting(false); }
  };

  const dispatch = async (id) => {
    try { await api.put(`/trips/${id}/dispatch`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to dispatch.'); }
  };

  const openComplete = (id) => {
    setCompletingId(id); setCompleteForm({ actualDistance: '', fuelConsumed: '' }); setCompleteModal(true);
  };

  const handleComplete = async (e) => {
    e.preventDefault(); setSubmitting(true);
    try {
      await api.put(`/trips/${completingId}/complete`, completeForm);
      setCompleteModal(false); fetchAll();
    } catch (err) { alert(err.response?.data?.message || 'Failed.'); }
    finally { setSubmitting(false); }
  };

  const cancel = async (id) => {
    if (!window.confirm('Cancel this trip?')) return;
    try { await api.put(`/trips/${id}/cancel`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to cancel.'); }
  };

  const filtered = trips.filter(t =>
    t.source?.toLowerCase().includes(search.toLowerCase()) ||
    t.destination?.toLowerCase().includes(search.toLowerCase())
  );

  const getVehicleName = (id) => {
    const v = vehicles.find(v => v._id === id) || trips.flatMap(t => []).find(x => false);
    return v?.name || id;
  };

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-icon"><Map size={20} color="#10b981" /></div>
          <div>
            <h1>Trips</h1>
            <p className="text-secondary">{trips.length} trip{trips.length !== 1 ? 's' : ''} logged</p>
          </div>
        </div>
        <div className="page-actions">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search by route..." value={search} onChange={e => setSearch(e.target.value)} id="trips-search" />
          </div>
          {canWrite && (
            <button className="btn btn-primary" onClick={() => { setForm(emptyForm); setError(''); setIsModalOpen(true); }} id="add-trip-btn">
              <Plus size={16} /> New Trip
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel table-wrap">
        {loading ? <div className="loading-row"><div className="spinner" /></div>
          : filtered.length === 0 ? <div className="empty-state">No trips found.</div>
          : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Vehicle</th>
                    <th>Driver</th>
                    <th>Cargo (kg)</th>
                    <th>Planned Dist.</th>
                    <th>Actual Dist.</th>
                    <th>Status</th>
                    {canWrite && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(t => (
                    <tr key={t._id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{t.source} <span style={{ color: 'var(--text-muted)' }}>→</span> {t.destination}</div>
                      </td>
                      <td>{t.vehicle?.name || '—'}</td>
                      <td>{t.driver?.name || '—'}</td>
                      <td>{t.cargoWeight} kg</td>
                      <td>{t.plannedDistance} km</td>
                      <td>{t.actualDistance != null ? `${t.actualDistance} km` : '—'}</td>
                      <td>{statusBadge(t.status)}</td>
                      {canWrite && (
                        <td>
                          <div className="action-btns">
                            {t.status === 'Draft' && (
                              <button className="icon-btn" onClick={() => dispatch(t._id)} title="Dispatch">
                                <Play size={14} />
                              </button>
                            )}
                            {t.status === 'Dispatched' && (
                              <button className="icon-btn" onClick={() => openComplete(t._id)} title="Complete" style={{ color: 'var(--success)' }}>
                                <CheckCheck size={14} />
                              </button>
                            )}
                            {['Draft', 'Dispatched'].includes(t.status) && (
                              <button className="icon-btn danger" onClick={() => cancel(t._id)} title="Cancel">
                                <XCircle size={14} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
      </div>

      {/* Create Trip Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Create New Trip">
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Source</label>
              <input name="source" value={form.source} onChange={handleChange} required placeholder="Mumbai" />
            </div>
            <div className="form-group">
              <label>Destination</label>
              <input name="destination" value={form.destination} onChange={handleChange} required placeholder="Pune" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle</label>
              <select name="vehicle" value={form.vehicle} onChange={handleChange} required>
                <option value="">Select vehicle...</option>
                {vehicles.filter(v => v.status === 'Available').map(v => (
                  <option key={v._id} value={v._id}>{v.name} ({v.registrationNumber})</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Driver</label>
              <select name="driver" value={form.driver} onChange={handleChange} required>
                <option value="">Select driver...</option>
                {drivers.filter(d => d.status === 'Available').map(d => (
                  <option key={d._id} value={d._id}>{d.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cargo Weight (kg)</label>
              <input type="number" name="cargoWeight" value={form.cargoWeight} onChange={handleChange} required min="0" />
            </div>
            <div className="form-group">
              <label>Planned Distance (km)</label>
              <input type="number" name="plannedDistance" value={form.plannedDistance} onChange={handleChange} required min="0" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-sm" /> : 'Create Trip'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Complete Trip Modal */}
      <Modal isOpen={completeModal} onClose={() => setCompleteModal(false)} title="Complete Trip" size="sm">
        <form onSubmit={handleComplete} className="modal-form">
          <div className="form-group">
            <label>Actual Distance (km)</label>
            <input type="number" name="actualDistance" value={completeForm.actualDistance} onChange={e => setCompleteForm(p => ({ ...p, actualDistance: e.target.value }))} required min="0" />
          </div>
          <div className="form-group">
            <label>Fuel Consumed (liters)</label>
            <input type="number" name="fuelConsumed" value={completeForm.fuelConsumed} onChange={e => setCompleteForm(p => ({ ...p, fuelConsumed: e.target.value }))} required min="0" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setCompleteModal(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-sm" /> : 'Mark Complete'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Trips;
