import { useDashboardStats } from '../../hooks/useDashboard';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#0dcaf0', '#6f42c1'];

const DashboardPage = () => {
  const { data: stats, isLoading, isError } = useDashboardStats();

  const applicationsByStatusArray = stats?.applications_by_status 
    ? Object.entries(stats.applications_by_status).map(([name, value]) => ({ name, value })) 
    : [];

  const metrics = [
    {
      title: 'Total Candidates',
      value: stats?.total_users || 0,
      icon: 'bi-people',
      colorClass: 'text-primary',
      bgClass: 'bg-primary-subtle',
    },
    {
      title: 'Total Job Roles',
      value: stats?.total_jobs || 0,
      icon: 'bi-briefcase',
      colorClass: 'text-success',
      bgClass: 'bg-success-subtle',
    },
    {
      title: 'Pending Applications',
      value: stats?.pending_applications || 0,
      icon: 'bi-file-earmark-text',
      colorClass: 'text-warning',
      bgClass: 'bg-warning-subtle',
    },
    {
      title: 'Accepted Applications',
      value: stats?.accepted_applications || 0,
      icon: 'bi-check-circle',
      colorClass: 'text-info',
      bgClass: 'bg-info-subtle',
    }
  ];

  return (
    <div>
      <div className="mb-4">
        <h4 className="fw-bold tracking-tight text-dark mb-1">Dashboard Overview</h4>
        <p className="text-muted small">A quick glance at your platform's metrics.</p>
      </div>

      {isLoading ? (
        <div className="row g-4">
          {[...Array(4)].map((_, i) => (
            <div className="col-md-6 col-lg-3" key={i}>
              <div className="card border-0 rounded-4 shadow-soft placeholder-glow">
                <div className="card-body p-4 d-flex align-items-center">
                  <div className="placeholder col-3 rounded-circle me-3" style={{ height: '56px', width: '56px' }}></div>
                  <div className="w-100">
                    <span className="placeholder col-8 mb-2"></span>
                    <span className="placeholder col-5 placeholder-lg d-block"></span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : isError ? (
        <div className="alert alert-danger shadow-soft border-0 rounded-4 text-center py-4">
          <i className="bi bi-exclamation-triangle fs-4 d-block mb-2"></i>
          Failed to load dashboard statistics.
        </div>
      ) : (
        <>
          <div className="row g-4 mb-4">
            {metrics.map((metric, idx) => (
              <div className="col-md-6 col-lg-3" key={idx}>
                <div className="card border-0 rounded-4 shadow-soft h-100 transition-hover">
                  <div className="card-body p-4 d-flex align-items-center">
                    <div 
                      className={`${metric.bgClass} ${metric.colorClass} rounded-circle d-flex align-items-center justify-content-center me-3 flex-shrink-0`}
                      style={{ width: '56px', height: '56px' }}
                    >
                      <i className={`bi ${metric.icon} fs-4`}></i>
                    </div>
                    <div>
                      <h6 className="text-muted fw-semibold mb-1 text-uppercase small tracking-wide" style={{ letterSpacing: '0.5px' }}>
                        {metric.title}
                      </h6>
                      <h3 className="fw-bold text-dark mb-0 tracking-tight">
                        {metric.value.toLocaleString()}
                      </h3>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card border-0 rounded-4 shadow-soft h-100">
                <div className="card-body p-4">
                  <h6 className="fw-bold text-dark mb-4">Applications Over Time (Last 30 Days)</h6>
                  {stats?.applications_over_time && stats.applications_over_time.length > 0 ? (
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={stats.applications_over_time} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#0d6efd" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#0d6efd" stopOpacity={0}/>
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="date" tick={{fontSize: 12}} tickMargin={10} axisLine={false} tickLine={false} />
                          <YAxis tick={{fontSize: 12}} axisLine={false} tickLine={false} />
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                          />
                          <Area type="monotone" dataKey="count" stroke="#0d6efd" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: '300px' }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="col-lg-4">
              <div className="card border-0 rounded-4 shadow-soft h-100">
                <div className="card-body p-4">
                  <h6 className="fw-bold text-dark mb-4">Application Pipeline</h6>
                  {applicationsByStatusArray.length > 0 ? (
                    <div style={{ height: '300px' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={applicationsByStatusArray}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={100}
                            paddingAngle={5}
                            dataKey="value"
                            nameKey="name"
                            stroke="none"
                          >
                            {applicationsByStatusArray.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                            itemStyle={{ fontWeight: 'bold' }}
                          />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px' }}/>
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="d-flex align-items-center justify-content-center text-muted" style={{ height: '300px' }}>
                      No data available
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
