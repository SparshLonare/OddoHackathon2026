import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import Modal from '../../components/Modal/Modal';
import { Plus, Pencil, Trash2, Truck, Search } from 'lucide-react';
import './PageStyles.css';

const VEHICLE_STATUSES = ['Available', 'On Trip', 'In Shop', 'Retired'];
const VEHICLE_TYPES = ['Truck', 'Van', 'Mini-Truck', 'Trailer'];

const emptyForm = {
  registrationNumber: '', name: '', type: 'Truck',
  maxLoadCapacity: '', odometer: '', acquisitionCost: '',
  status: 'Available', region: '',
};

const statusBadge = (status) => {
  const map = { Available: 'success', 'On Trip': 'warning', 'In Shop': 'danger', Retired: 'neutral' };
  return <span className={`badge badge-${map[status] || 'neutral'}`}>{status}</span>;
};

const Vehicles = () => {
  const { user } = useAuth();
  const isManager = user?.role === 'fleet_manager';

  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchVehicles = async () => {
    try {
      const res = await api.get('/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchVehicles(); }, []);

  const openAdd = () => {
    setForm(emptyForm);
    setEditingId(null);
    setError('');
    setIsModalOpen(true);
  };

  const openEdit = (v) => {
    setForm({
      registrationNumber: v.registrationNumber,
      name: v.name, type: v.type,
      maxLoadCapacity: v.maxLoadCapacity,
      odometer: v.odometer,
      acquisitionCost: v.acquisitionCost,
      status: v.status, region: v.region || '',
    });
    setEditingId(v._id);
    setError('');
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      if (editingId) {
        await api.put(`/vehicles/${editingId}`, form);
      } else {
        await api.post('/vehicles', form);
      }
      setIsModalOpen(false);
      fetchVehicles();
    } catch (err) {
      setError(err.response?.data?.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await api.delete(`/vehicles/${id}`);
      fetchVehicles();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete.');
    }
  };

  const filtered = vehicles.filter(v =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.registrationNumber.toLowerCase().includes(search.toLowerCase()) ||
    v.type.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page">
      {/* Page Header */}
      <div className="page-header">
        <div className="page-title-wrap">
          <div className="page-icon"><Truck size={20} color="#6366f1" /></div>
          <div>
            <h1>Vehicles</h1>
            <p className="text-secondary">Manage your fleet of {vehicles.length} vehicle{vehicles.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <div className="page-actions">
          <div className="search-bar">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search vehicles..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              id="vehicles-search"
            />
          </div>
          {isManager && (
            <button className="btn btn-primary" onClick={openAdd} id="add-vehicle-btn">
              <Plus size={16} /> Add Vehicle
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="glass-panel table-wrap">
        {loading ? (
          <div className="loading-row"><div className="spinner" /></div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">No vehicles found.</div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Reg. No.</th>
                  <th>Name / Model</th>
                  <th>Type</th>
                  <th>Max Load (kg)</th>
                  <th>Odometer (km)</th>
                  <th>Region</th>
                  <th>Status</th>
                  {isManager && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {filtered.map(v => (
                  <tr key={v._id}>
                    <td><code className="reg-code">{v.registrationNumber}</code></td>
                    <td style={{ fontWeight: 500 }}>{v.name}</td>
                    <td>{v.type}</td>
                    <td>{v.maxLoadCapacity.toLocaleString()}</td>
                    <td>{v.odometer.toLocaleString()}</td>
                    <td>{v.region || '—'}</td>
                    <td>{statusBadge(v.status)}</td>
                    {isManager && (
                      <td>
                        <div className="action-btns">
                          <button className="icon-btn" onClick={() => openEdit(v)} title="Edit">
                            <Pencil size={15} />
                          </button>
                          <button className="icon-btn danger" onClick={() => handleDelete(v._id)} title="Delete">
                            <Trash2 size={15} />
                          </button>
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

      {/* Add/Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingId ? 'Edit Vehicle' : 'Add New Vehicle'}
      >
        {error && <div className="form-error">{error}</div>}
        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Registration Number</label>
              <input name="registrationNumber" value={form.registrationNumber} onChange={handleChange} required placeholder="MH12AB1234" disabled={!!editingId} />
            </div>
            <div className="form-group">
              <label>Name / Model</label>
              <input name="name" value={form.name} onChange={handleChange} required placeholder="Tata Ace" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select name="type" value={form.type} onChange={handleChange}>
                {VEHICLE_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={form.status} onChange={handleChange}>
                {VEHICLE_STATUSES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Max Load Capacity (kg)</label>
              <input type="number" name="maxLoadCapacity" value={form.maxLoadCapacity} onChange={handleChange} required min="0" />
            </div>
            <div className="form-group">
              <label>Odometer (km)</label>
              <input type="number" name="odometer" value={form.odometer} onChange={handleChange} min="0" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Acquisition Cost (₹)</label>
              <input type="number" name="acquisitionCost" value={form.acquisitionCost} onChange={handleChange} required min="0" />
            </div>
            <div className="form-group">
              <label>Region</label>
              <input name="region" value={form.region} onChange={handleChange} placeholder="e.g. North, Mumbai" />
            </div>
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? <span className="spinner-sm" /> : (editingId ? 'Update Vehicle' : 'Add Vehicle')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Vehicles;
