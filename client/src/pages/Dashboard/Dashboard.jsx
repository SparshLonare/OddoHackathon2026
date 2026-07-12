import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../api/axios';
import { Truck, Users, Map, Wrench, Fuel, TrendingUp, Activity, CheckCircle } from 'lucide-react';
import './Dashboard.css';

const StatCard = ({ icon: Icon, label, value, sub, color }) => (
  <div className="stat-card glass-card">
    <div className="stat-icon" style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
      <Icon size={22} color={color} />
    </div>
    <div className="stat-info">
      <span className="stat-value">{value ?? '—'}</span>
      <span className="stat-label">{label}</span>
      {sub && <span className="stat-sub">{sub}</span>}
    </div>
  </div>
);

const Dashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    vehicles: [],
    drivers: [],
    trips: [],
    maintenance: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [v, d, t, m] = await Promise.all([
          api.get('/vehicles'),
          api.get('/drivers'),
          api.get('/trips'),
          api.get('/maintenance'),
        ]);
        setStats({ vehicles: v.data, drivers: d.data, trips: t.data, maintenance: m.data });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const { vehicles, drivers, trips, maintenance } = stats;
  const availableVehicles = vehicles.filter(v => v.status === 'Available').length;
  const onTripVehicles = vehicles.filter(v => v.status === 'On Trip').length;
  const availableDrivers = drivers.filter(d => d.status === 'Available').length;
  const activeTrips = trips.filter(t => t.status === 'Dispatched').length;
  const completedTrips = trips.filter(t => t.status === 'Completed').length;
  const activeMaintenance = maintenance.filter(m => m.status === 'Active').length;

  const recentTrips = [...trips]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 5);

  const roleLabels = {
    fleet_manager: 'Fleet Manager',
    driver: 'Driver',
    safety_officer: 'Safety Officer',
    financial_analyst: 'Financial Analyst',
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div>
          <h1>
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            <span className="text-gradient">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="text-secondary" style={{ marginTop: 4, fontSize: '0.9rem' }}>
            {roleLabels[user?.role]} · {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="live-badge">
          <span className="pulse-dot" />
          Live
        </div>
      </div>

      {loading ? (
        <div className="dashboard-loading">
          <div className="spinner" />
          <span>Loading fleet data...</span>
        </div>
      ) : (
        <>
          {/* Stats Grid */}
          <div className="stats-grid">
            <StatCard icon={Truck} label="Total Vehicles" value={vehicles.length} sub={`${availableVehicles} available · ${onTripVehicles} on trip`} color="#6366f1" />
            <StatCard icon={Users} label="Total Drivers" value={drivers.length} sub={`${availableDrivers} available`} color="#8b5cf6" />
            <StatCard icon={Map} label="Active Trips" value={activeTrips} sub={`${completedTrips} completed total`} color="#10b981" />
            <StatCard icon={Wrench} label="In Maintenance" value={activeMaintenance} sub="Active records" color="#f59e0b" />
          </div>

          {/* Content Row */}
          <div className="dashboard-row">
            {/* Recent Trips */}
            <div className="glass-panel dashboard-panel">
              <div className="panel-header">
                <h3><Activity size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Recent Trips</h3>
              </div>
              {recentTrips.length === 0 ? (
                <div className="empty-state">No trips yet.</div>
              ) : (
                <div className="trips-list">
                  {recentTrips.map(trip => (
                    <div key={trip._id} className="trip-item">
                      <div className="trip-route">
                        <span>{trip.source}</span>
                        <span className="route-arrow">→</span>
                        <span>{trip.destination}</span>
                      </div>
                      <span className={`badge badge-${
                        trip.status === 'Completed' ? 'success' :
                        trip.status === 'Dispatched' ? 'warning' :
                        trip.status === 'Cancelled' ? 'danger' : 'neutral'
                      }`}>{trip.status}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Fleet Status */}
            <div className="glass-panel dashboard-panel">
              <div className="panel-header">
                <h3><TrendingUp size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Fleet Status</h3>
              </div>
              <div className="fleet-status-list">
                {[
                  { label: 'Available', count: availableVehicles, total: vehicles.length, color: '#10b981' },
                  { label: 'On Trip', count: onTripVehicles, total: vehicles.length, color: '#6366f1' },
                  { label: 'In Shop', count: vehicles.filter(v => v.status === 'In Shop').length, total: vehicles.length, color: '#f59e0b' },
                  { label: 'Retired', count: vehicles.filter(v => v.status === 'Retired').length, total: vehicles.length, color: '#ef4444' },
                ].map(({ label, count, total, color }) => (
                  <div key={label} className="fleet-stat-row">
                    <div className="fleet-stat-label">
                      <span className="fleet-dot" style={{ background: color }} />
                      <span>{label}</span>
                    </div>
                    <div className="fleet-bar-wrap">
                      <div
                        className="fleet-bar"
                        style={{ width: total > 0 ? `${(count / total) * 100}%` : '0%', background: color }}
                      />
                    </div>
                    <span className="fleet-count">{count}</span>
                  </div>
                ))}
              </div>

              <div className="panel-header" style={{ marginTop: 20 }}>
                <h3><CheckCircle size={16} style={{ verticalAlign: 'middle', marginRight: 8 }} />Trip Summary</h3>
              </div>
              <div className="trip-summary-grid">
                {[
                  { label: 'Draft', value: trips.filter(t => t.status === 'Draft').length, color: '#6c757d' },
                  { label: 'Dispatched', value: activeTrips, color: '#f59e0b' },
                  { label: 'Completed', value: completedTrips, color: '#10b981' },
                  { label: 'Cancelled', value: trips.filter(t => t.status === 'Cancelled').length, color: '#ef4444' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="trip-summary-chip" style={{ borderColor: `${color}30`, background: `${color}10` }}>
                    <span className="chip-value" style={{ color }}>{value}</span>
                    <span className="chip-label">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Dashboard;
