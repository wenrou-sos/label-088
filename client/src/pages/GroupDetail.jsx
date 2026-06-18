import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [tourists, setTourists] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTourist, setNewTourist] = useState({
    name: '',
    id_card: '',
    phone: '',
    room_type: '双人房',
    special_requirements: ''
  });
  const [newStatus, setNewStatus] = useState('');

  useEffect(() => {
    loadGroup();
  }, [id]);

  const loadGroup = async () => {
    try {
      const data = await api.get(`/tourists/groups/${id}`);
      setGroup(data);
      setTourists(data.tourists || []);
      setNewStatus(data.status);
    } catch (err) {}
  };

  const handleAddTourist = async (e) => {
    e.preventDefault();
    if (!newTourist.name || !newTourist.id_card || !newTourist.phone) {
      alert('请填写姓名、身份证号和联系方式');
      return;
    }
    if (newTourist.id_card.length !== 18) {
      alert('身份证号必须为18位');
      return;
    }
    try {
      await api.post(`/tourists/groups/${id}/tourists`, newTourist);
      setShowAddModal(false);
      setNewTourist({ name: '', id_card: '', phone: '', room_type: '双人房', special_requirements: '' });
      loadGroup();
    } catch (err) {}
  };

  const handleDeleteTourist = async (touristId) => {
    if (!confirm('确定要删除该游客吗？')) return;
    try {
      await api.delete(`/tourists/tourists/${touristId}`);
      loadGroup();
    } catch (err) {}
  };

  const handleStatusChange = async () => {
    try {
      await api.put(`/tourists/groups/${id}/status`, { status: newStatus });
      alert('状态更新成功');
      loadGroup();
    } catch (err) {}
  };

  const handleDeleteGroup = async () => {
    if (!confirm(`确定要删除团队 ${group.group_code} 吗？该操作将同时删除关联的游客、计调预订等所有数据，且无法恢复。`)) return;
    try {
      await api.delete(`/tourists/groups/${id}`);
      navigate('/groups');
    } catch (err) {}
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

  const maskIdCard = (id) => {
    if (!id || id.length < 10) return id;
    return id.substring(0, 4) + '**********' + id.substring(14);
  };

  if (!group) return <div>加载中...</div>;

  const isFull = group.current_count >= group.max_group_size;
  const canAdd = group.status === 'open' && !isFull;

  return (
    <div>
      <div className="page-header">
        <h1>{group.group_code} - {group.route_name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-default" onClick={() => navigate('/groups')}>返回列表</button>
          <button className="btn btn-default" onClick={() => navigate(`/operations/${id}`)}>计调操作</button>
          <button className="btn btn-default" onClick={() => navigate(`/finance/${id}`)}>成本分析</button>
          <button className="btn btn-primary" onClick={() => navigate(`/notices/${id}`)}>出团通知书</button>
          <button className="btn btn-danger" onClick={handleDeleteGroup}>删除团队</button>
        </div>
      </div>

      <div className="card">
        <div className="form-row-3">
          <div>
            <div style={{ color: '#64748b', fontSize: 13 }}>行程信息</div>
            <div style={{ marginTop: 4 }}>
              {group.departure_city} → {group.destination}，{group.days}天
            </div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 13 }}>出团日期</div>
            <div style={{ marginTop: 4 }}>{group.departure_date} ~ {group.return_date}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 13 }}>收客状态</div>
            <div style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 10 }}>
              {getStatusTag(group.status)}
              <span>{group.current_count} / {group.max_group_size}人</span>
            </div>
          </div>
        </div>
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>更改团队状态：</span>
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: 4, border: '1px solid #d1d5db' }}>
            <option value="open">收客中</option>
            <option value="full">已满员</option>
            <option value="closed">已截止</option>
            <option value="departed">已出团</option>
          </select>
          <button className="btn btn-sm btn-default" onClick={handleStatusChange}>更新状态</button>
        </div>
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>游客名单 ({tourists.length}人)</h3>
          <button className="btn btn-primary"
            disabled={!canAdd}
            style={{ opacity: canAdd ? 1 : 0.5, cursor: canAdd ? 'pointer' : 'not-allowed' }}
            onClick={() => canAdd && setShowAddModal(true)}>
            {isFull ? '团已满员' : group.status !== 'open' ? '已停止收客' : '+ 添加游客'}
          </button>
        </div>
        {tourists.length === 0 ? (
          <div className="empty-state">暂无游客，请点击"添加游客"</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>序号</th>
                <th>姓名</th>
                <th>身份证号</th>
                <th>联系方式</th>
                <th>房型</th>
                <th>特殊需求</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {tourists.map((t, idx) => (
                <tr key={t.id}>
                  <td>{idx + 1}</td>
                  <td>{t.name}</td>
                  <td>{maskIdCard(t.id_card)}</td>
                  <td>{t.phone}</td>
                  <td><span className="tag tag-blue">{t.room_type}</span></td>
                  <td>{t.special_requirements || '-'}</td>
                  <td>
                    <button className="btn btn-sm btn-danger" onClick={() => handleDeleteTourist(t.id)}>删除</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>添加游客</h3>
              <button className="modal-close" onClick={() => setShowAddModal(false)}>×</button>
            </div>
            <form onSubmit={handleAddTourist}>
              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>姓名 *</label>
                    <input type="text" value={newTourist.name}
                      onChange={e => setNewTourist({ ...newTourist, name: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>身份证号 *</label>
                    <input type="text" value={newTourist.id_card} maxLength={18}
                      onChange={e => setNewTourist({ ...newTourist, id_card: e.target.value })} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>联系方式 *</label>
                    <input type="text" value={newTourist.phone}
                      onChange={e => setNewTourist({ ...newTourist, phone: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>房型</label>
                    <select value={newTourist.room_type}
                      onChange={e => setNewTourist({ ...newTourist, room_type: e.target.value })}>
                      <option value="双人房">双人房</option>
                      <option value="三人房">三人房</option>
                      <option value="儿童不占床">儿童不占床</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label>特殊需求（如素食、轮椅等）</label>
                  <textarea rows="2" value={newTourist.special_requirements}
                    onChange={e => setNewTourist({ ...newTourist, special_requirements: e.target.value })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowAddModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">添加</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default GroupDetail;
