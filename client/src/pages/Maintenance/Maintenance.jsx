import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal/Modal';
import { Plus, Pencil, Trash2, Wrench, Search, CheckCircle } from 'lucide-react';
import '../Vehicles/PageStyles.css';

const emptyForm = {
  vehicle: '', description: '', cost: '', scheduledDate: '', status: 'Active',
};

const statusBadge = (status) => {
  const map = { Active: 'warning', Closed: 'success' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

const Maintenance = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'fleet_manager';

  const [records, setRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchAll = async () => {
    try {
      const [m, v] = await Promise.all([api.get('/maintenance'), api.get('/vehicles')]);
      setRecords(m.data); setVehicles(v.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchAll(); }, []);

  const openAdd = () => {
    setForm({ ...emptyForm, scheduledDate: new Date().toISOString().slice(0, 10) });
    setEditingId(null); setError(''); setIsModalOpen(true);
  };

  const openEdit = (r) => {
    setForm({
      vehicle: r.vehicle?._id || r.vehicle,
      description: r.description, cost: r.cost,
      scheduledDate: r.scheduledDate?.slice(0, 10),
      status: r.status,
    });
    setEditingId(r._id); setError(''); setIsModalOpen(true);
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      if (editingId) await api.put(`/maintenance/${editingId}`, form);
      else await api.post('/maintenance', form);
      setIsModalOpen(false); fetchAll();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally { setSubmitting(false); }
  };

  const closeRecord = async (id) => {
    if (!window.confirm('Close this maintenance record?')) return;
    try { await api.put(`/maintenance/${id}/close`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed.'); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try { await api.delete(`/maintenance/${id}`); fetchAll(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete.'); }
  };

  const filtered = records.filter(r =>
    r.description?.toLowerCase().includes(search.toLowerCase()) ||
    r.vehicle?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalCost = records.reduce((sum, r) => sum + (r.cost || 0), 0);

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-icon"><Wrench size={20} color="#f59e0b" /></div>
          <div>
            <h1>Maintenance</h1>
            <p className="text-secondary">{records.filter(r => r.status === 'Active').length} active · Total cost ₹{totalCost.toLocaleString()}</p>
          </div>
        </div>
        <div className="page-actions">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search records..." value={search} onChange={e => setSearch(e.target.value)} id="maintenance-search" />
          </div>
          {isManager && (
            <button className="btn btn-primary" onClick={openAdd} id="add-maintenance-btn">
              <Plus size={16} /> Add Record
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel table-wrap">
        {loading ? <div className="loading-row"><div className="spinner" /></div>
          : filtered.length === 0 ? <div className="empty-state">No maintenance records found.</div>
          : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Vehicle</th>
                    <th>Description</th>
                    <th>Cost (₹)</th>
                    <th>Scheduled Date</th>
                    <th>Closed Date</th>
                    <th>Status</th>
                    {isManager && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(r => (
                    <tr key={r._id}>
                      <td style={{ fontWeight: 500 }}>{r.vehicle?.name || '—'}</td>
                      <td>{r.description}</td>
                      <td>₹{r.cost?.toLocaleString()}</td>
                      <td>{r.scheduledDate ? new Date(r.scheduledDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{r.closedDate ? new Date(r.closedDate).toLocaleDateString('en-IN') : '—'}</td>
                      <td>{statusBadge(r.status)}</td>
                      {isManager && (
                        <td>
                          <div className="action-btns">
                            {r.status === 'Active' && (
                              <button className="icon-btn" onClick={() => closeRecord(r._id)} title="Close Record" style={{ color: 'var(--success)' }}>
                                <CheckCircle size={15} />
                              </button>
                            )}
                            <button className="icon-btn" onClick={() => openEdit(r)} title="Edit"><Pencil size={15} /></button>
                            <button className="icon-btn danger" onClick={() => handleDelete(r._id)} title="Delete"><Trash2 size={15} /></button>
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Record' : 'Add Maintenance Record'}>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label>Vehicle</label>
            <select name="vehicle" value={form.vehicle} onChange={handleChange} required>
              <option value="">Select vehicle...</option>
              {vehicles.map(v => <option key={v._id} value={v._id}>{v.name} ({v.registrationNumber})</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <input name="description" value={form.description} onChange={handleChange} required placeholder="e.g. Oil Change, Tyre Replacement" />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Cost (₹)</label>
              <input type="number" name="cost" value={form.cost} onChange={handleChange} required min="0" />
            </div>
            <div className="form-group">
              <label>Scheduled Date</label>
              <input type="date" name="scheduledDate" value={form.scheduledDate} onChange={handleChange} />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-sm" /> : (editingId ? 'Update' : 'Add Record')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Maintenance;
