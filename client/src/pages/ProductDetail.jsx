import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [groups, setGroups] = useState([]);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [newGroup, setNewGroup] = useState({
    group_code: '',
    departure_date: '',
    return_date: '',
    max_group_size: 30
  });

  useEffect(() => {
    loadProduct();
    loadGroups();
  }, [id]);

  const loadProduct = async () => {
    try {
      const data = await api.get(`/products/${id}`);
      setProduct(data);
      setNewGroup(g => ({ ...g, max_group_size: data.max_group_size }));
    } catch (err) {}
  };

  const loadGroups = async () => {
    try {
      const data = await api.get(`/products/${id}/groups`);
      setGroups(data);
    } catch (err) {}
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroup.group_code || !newGroup.departure_date || !newGroup.return_date) {
      alert('请填写完整信息');
      return;
    }
    try {
      await api.post(`/products/${id}/groups`, newGroup);
      setShowGroupModal(false);
      setNewGroup({ group_code: '', departure_date: '', return_date: '', max_group_size: product.max_group_size });
      loadGroups();
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

  if (!product) return <div>加载中...</div>;

  return (
    <div>
      <div className="page-header">
        <h1>{product.route_name}</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-default" onClick={() => navigate('/products')}>返回列表</button>
          <button className="btn btn-primary" onClick={() => navigate(`/products/${id}/edit`)}>编辑产品</button>
        </div>
      </div>

      <div className="card">
        <div className="form-row-3">
          <div>
            <div style={{ color: '#64748b', fontSize: 13 }}>行程天数</div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{product.days}天</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 13 }}>出发城市</div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{product.departure_city}</div>
          </div>
          <div>
            <div style={{ color: '#64748b', fontSize: 13 }}>目的地</div>
            <div style={{ fontSize: 20, fontWeight: 600, marginTop: 4 }}>{product.destination}</div>
          </div>
        </div>
        {product.description && (
          <div style={{ marginTop: 16, padding: 12, background: '#f8fafc', borderRadius: 6 }}>
            <strong>产品描述：</strong>{product.description}
          </div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>各日行程</h3>
        {product.itineraries && product.itineraries.length > 0 ? (
          product.itineraries.map(it => (
            <div key={it.id} className="itinerary-day">
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                第{it.day_number}天 - {it.title}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div><strong>景点：</strong>{it.attractions || '-'}</div>
                <div><strong>用餐：</strong>{it.meals || '-'}</div>
                <div style={{ gridColumn: '1 / -1' }}><strong>住宿：</strong>{it.accommodation || '-'}</div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state">暂无行程安排</div>
        )}
      </div>

      <div className="card">
        <h3 style={{ marginBottom: 16 }}>价格信息</h3>
        {product.prices && product.prices.length > 0 ? (
          <table>
            <thead>
              <tr>
                <th>房型</th>
                <th>价格</th>
              </tr>
            </thead>
            <tbody>
              {product.prices.map(p => (
                <tr key={p.id}>
                  <td>{p.room_type}</td>
                  <td>¥{p.price}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="empty-state">暂无价格设置</div>
        )}
      </div>

      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0 }}>出团计划</h3>
          <button className="btn btn-primary" onClick={() => setShowGroupModal(true)}>+ 新建团队</button>
        </div>
        {groups.length === 0 ? (
          <div className="empty-state">暂无出团计划</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>团号</th>
                <th>出发日期</th>
                <th>返程日期</th>
                <th>收客情况</th>
                <th>状态</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {groups.map(g => (
                <tr key={g.id}>
                  <td><strong>{g.group_code}</strong></td>
                  <td>{g.departure_date}</td>
                  <td>{g.return_date}</td>
                  <td>{g.current_count} / {g.max_group_size}人</td>
                  <td>{getStatusTag(g.status)}</td>
                  <td>
                    <button className="btn btn-sm btn-default" onClick={() => navigate(`/groups/${g.id}`)}>
                      详情
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showGroupModal && (
        <div className="modal-overlay" onClick={() => setShowGroupModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>新建出团计划</h3>
              <button className="modal-close" onClick={() => setShowGroupModal(false)}>×</button>
            </div>
            <form onSubmit={handleCreateGroup}>
              <div className="modal-body">
                <div className="form-group">
                  <label>团号 *</label>
                  <input type="text" value={newGroup.group_code}
                    onChange={e => setNewGroup({ ...newGroup, group_code: e.target.value })}
                    placeholder="如：SY20250601" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>出发日期 *</label>
                    <input type="date" value={newGroup.departure_date}
                      onChange={e => setNewGroup({ ...newGroup, departure_date: e.target.value })} />
                  </div>
                  <div className="form-group">
                    <label>返程日期 *</label>
                    <input type="date" value={newGroup.return_date}
                      onChange={e => setNewGroup({ ...newGroup, return_date: e.target.value })} />
                  </div>
                </div>
                <div className="form-group">
                  <label>最大成团人数</label>
                  <input type="number" min="1" value={newGroup.max_group_size}
                    onChange={e => setNewGroup({ ...newGroup, max_group_size: parseInt(e.target.value) || 30 })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowGroupModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProductDetail;
