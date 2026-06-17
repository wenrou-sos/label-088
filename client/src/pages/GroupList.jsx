import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function GroupList() {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadGroups();
  }, [statusFilter]);

  const loadGroups = async () => {
    try {
      setLoading(true);
      const url = statusFilter ? `/tourists/groups?status=${statusFilter}` : '/tourists/groups';
      const data = await api.get(url);
      setGroups(data);
    } finally {
      setLoading(false);
    }
  };

  const getStatusTag = (status) => {
    const map = {
      open: { text: '收客中', class: 'tag-green' },
      full: { text: '已满员', class: 'tag-yellow' },
      closed: { text: '已截止', class: 'tag-gray' },
      departed: { text: '已出团', class: 'tag-blue' }
    };
    const s = map[status] || { text: status, class: 'tag-gray' };
    return <span className={`tag ${s.class}`}>{s.text}</span>;
  };

  if (loading) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>团队收客管理</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db' }}>
            <option value="">全部状态</option>
            <option value="open">收客中</option>
            <option value="full">已满员</option>
            <option value="closed">已截止</option>
            <option value="departed">已出团</option>
          </select>
        </div>
      </div>

      <div className="stat-cards">
        <div className="stat-card">
          <div className="label">团队总数</div>
          <div className="value">{groups.length}</div>
        </div>
        <div className="stat-card">
          <div className="label">收客中</div>
          <div className="value" style={{ color: '#16a34a' }}>{groups.filter(g => g.status === 'open').length}</div>
        </div>
        <div className="stat-card">
          <div className="label">已满员</div>
          <div className="value" style={{ color: '#d97706' }}>{groups.filter(g => g.status === 'full').length}</div>
        </div>
        <div className="stat-card">
          <div className="label">已收游客总数</div>
          <div className="value" style={{ color: '#3b82f6' }}>
            {groups.reduce((sum, g) => sum + g.current_count, 0)}
          </div>
        </div>
      </div>

      <div className="card">
        {groups.length === 0 ? (
          <div className="empty-state">暂无团队数据，请先在产品管理中创建出团计划</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>团号</th>
                <th>线路名称</th>
                <th>出发-目的地</th>
                <th>出发日期</th>
                <th>返程日期</th>
                <th>天数</th>
                <th>收客情况</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id} style={{ cursor: 'pointer' }} onClick={() => navigate(`/groups/${g.id}`)}>
                  <td><strong>{g.group_code}</strong></td>
                  <td>{g.route_name}</td>
                  <td>{g.departure_city} → {g.destination}</td>
                  <td>{g.departure_date}</td>
                  <td>{g.return_date}</td>
                  <td>{g.days}天</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 100, height: 8, background: '#e5e7eb', borderRadius: 4, overflow: 'hidden'
                      }}>
                        <div style={{
                          width: `${(g.current_count / g.max_group_size) * 100}%`,
                          height: '100%',
                          background: g.current_count >= g.max_group_size ? '#f59e0b' : '#10b981'
                        }} />
                      </div>
                      <span>{g.current_count}/{g.max_group_size}</span>
                    </div>
                  </td>
                  <td>{getStatusTag(g.status)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <button className="btn btn-sm btn-default" onClick={() => navigate(`/groups/${g.id}`)}>
                      管理
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default GroupList;
