import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal/Modal';
import { Plus, Pencil, Trash2, Users, Search } from 'lucide-react';
import '../Vehicles/PageStyles.css';

const DRIVER_STATUSES = ['Available', 'On Trip', 'Off Duty', 'Suspended'];
const LICENSE_CATEGORIES = ['LMV', 'HMV', 'HPMV', 'HTV', 'MGV'];

const emptyForm = {
  name: '', licenseNumber: '', licenseCategory: 'LMV',
  licenseExpiryDate: '', contactNumber: '', safetyScore: 100, status: 'Available',
};

const statusBadge = (status) => {
  const map = { Available: 'success', 'On Trip': 'warning', 'Off Duty': 'neutral', Suspended: 'danger' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

const safetyColor = (score) => {
  if (score >= 80) return '#10b981';
  if (score >= 50) return '#f59e0b';
  return '#ef4444';
};

const isExpiringSoon = (dateStr) => {
  const diff = new Date(dateStr) - new Date();
  return diff > 0 && diff < 30 * 24 * 60 * 60 * 1000;
};

const Drivers = () => {
  const { user } = useAuth();
  const canWrite = ['fleet_manager', 'safety_officer'].includes(user?.role);

  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDrivers = async () => {
    try {
      const res = await api.get('/drivers');
      setDrivers(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchDrivers(); }, []);

  const openAdd = () => {
    setForm(emptyForm); setEditingId(null); setError(''); setIsModalOpen(true);
  };

  const openEdit = (d) => {
    setForm({
      name: d.name, licenseNumber: d.licenseNumber,
      licenseCategory: d.licenseCategory,
      licenseExpiryDate: d.licenseExpiryDate?.slice(0, 10),
      contactNumber: d.contactNumber, safetyScore: d.safetyScore, status: d.status,
    });
    setEditingId(d._id); setError(''); setIsModalOpen(true);
  };

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault(); setSubmitting(true); setError('');
    try {
      if (editingId) await api.put(`/drivers/${editingId}`, form);
      else await api.post('/drivers', form);
      setIsModalOpen(false); fetchDrivers();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally { setSubmitting(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this driver?')) return;
    try { await api.delete(`/drivers/${id}`); fetchDrivers(); }
    catch (err) { alert(err.response?.data?.message || 'Failed to delete.'); }
  };

  const filtered = drivers.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.licenseNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-icon"><Users size={20} color="#8b5cf6" /></div>
          <div>
            <h1>Drivers</h1>
            <p className="text-secondary">Managing {drivers.length} driver{drivers.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="page-actions">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input type="text" placeholder="Search drivers..." value={search} onChange={e => setSearch(e.target.value)} id="drivers-search" />
          </div>
          {canWrite && (
            <button className="btn btn-primary" onClick={openAdd} id="add-driver-btn">
              <Plus size={16} /> Add Driver
            </button>
          )}
        </div>
      </div>

      <div className="glass-panel table-wrap">
        {loading ? <div className="loading-row"><div className="spinner" /></div>
          : filtered.length === 0 ? <div className="empty-state">No drivers found.</div>
          : (
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>License No.</th>
                    <th>Category</th>
                    <th>Contact</th>
                    <th>Safety Score</th>
                    <th>Expiry</th>
                    <th>Status</th>
                    {canWrite && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(d => {
                    const expDate = new Date(d.licenseExpiryDate);
                    const expStr = expDate.toLocaleDateString('en-IN');
                    const soon = isExpiringSoon(d.licenseExpiryDate);
                    const color = safetyColor(d.safetyScore);
                    return (
                      <tr key={d._id}>
                        <td style={{ fontWeight: 500 }}>{d.name}</td>
                        <td><code className="reg-code">{d.licenseNumber}</code></td>
                        <td>{d.licenseCategory}</td>
                        <td>{d.contactNumber}</td>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="safety-bar-wrap" style={{ width: 70 }}>
                              <div className="safety-bar" style={{ width: `${d.safetyScore}%`, background: color }} />
                            </div>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color }}>{d.safetyScore}</span>
                          </div>
                        </td>
                        <td>
                          <span className={soon ? 'expiry-soon' : 'expiry-ok'}>{expStr}</span>
                        </td>
                        <td>{statusBadge(d.status)}</td>
                        {canWrite && (
                          <td>
                            <div className="action-btns">
                              <button className="icon-btn" onClick={() => openEdit(d)} title="Edit"><Pencil size={15} /></button>
                              <button className="icon-btn danger" onClick={() => handleDelete(d._id)} title="Delete"><Trash2 size={15} /></button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingId ? 'Edit Driver' : 'Add New Driver'}>
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="Ramesh Kumar" />
            </div>
            <div className="form-group">
              <label>License Number</label>
              <input name="licenseNumber" value={form.licenseNumber} onChange={handleChange} required placeholder="MH1220210012345" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>License Category</label>
              <select name="licenseCategory" value={form.licenseCategory} onChange={handleChange}>
                {LICENSE_CATEGORIES.map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>License Expiry Date</label>
              <input type="date" name="licenseExpiryDate" value={form.licenseExpiryDate} onChange={handleChange} required />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Contact Number</label>
              <input name="contactNumber" value={form.contactNumber} onChange={handleChange} required placeholder="+91 9876543210" />
            </div>
            <div className="form-group">
              <label>Safety Score (0-100)</label>
              <input type="number" name="safetyScore" value={form.safetyScore} onChange={handleChange} min="0" max="100" />
            </div>
          </div>
          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              {DRIVER_STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-sm" /> : (editingId ? 'Update Driver' : 'Add Driver')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Drivers;
