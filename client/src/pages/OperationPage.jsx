import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function OperationPage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');
  const [activeTab, setActiveTab] = useState('flights');
  const [flights, setFlights] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [localAgencies, setLocalAgencies] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadOperationsData();
    }
  }, [selectedGroupId, activeTab]);

  const loadGroups = async () => {
    try {
      const data = await api.get('/tourists/groups');
      setGroups(data);
      if (!selectedGroupId && data.length > 0) {
        setSelectedGroupId(data[0].id.toString());
      }
    } catch (err) {}
  };

  const loadOperationsData = async () => {
    try {
      if (activeTab === 'flights') {
        const data = await api.get(`/operations/groups/${selectedGroupId}/flights`);
        setFlights(data);
      } else if (activeTab === 'hotels') {
        const data = await api.get(`/operations/groups/${selectedGroupId}/hotels`);
        setHotels(data);
      } else if (activeTab === 'local') {
        const data = await api.get(`/operations/groups/${selectedGroupId}/local-agency`);
        setLocalAgencies(data);
      }
    } catch (err) {}
  };

  const openAddModal = () => {
    setEditingItem(null);
    if (activeTab === 'flights') {
      setFormData({ flight_no: '', seat_count: 0, seat_price: 0, notes: '' });
    } else if (activeTab === 'hotels') {
      setFormData({ hotel_name: '', room_type: '双人房', room_count: 0, checkin_date: '', checkout_date: '', room_price: 0, notes: '' });
    } else if (activeTab === 'local') {
      setFormData({ agency_name: '', guide_name: '', vehicle_info: '', meal_info: '', total_cost: 0, notes: '' });
    }
    setShowModal(true);
  };

  const openEditModal = (item) => {
    setEditingItem(item);
    setFormData({ ...item });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (activeTab === 'flights') {
        if (editingItem) {
          await api.put(`/operations/flights/${editingItem.id}`, formData);
        } else {
          await api.post(`/operations/groups/${selectedGroupId}/flights`, formData);
        }
      } else if (activeTab === 'hotels') {
        if (editingItem) {
          await api.put(`/operations/hotels/${editingItem.id}`, formData);
        } else {
          await api.post(`/operations/groups/${selectedGroupId}/hotels`, formData);
        }
      } else if (activeTab === 'local') {
        if (editingItem) {
          await api.put(`/operations/local-agency/${editingItem.id}`, formData);
        } else {
          await api.post(`/operations/groups/${selectedGroupId}/local-agency`, formData);
        }
      }
      setShowModal(false);
      loadOperationsData();
    } catch (err) {}
  };

  const handleDelete = async (id) => {
    if (!confirm('确定删除？')) return;
    try {
      if (activeTab === 'flights') {
        await api.delete(`/operations/flights/${id}`);
      } else if (activeTab === 'hotels') {
        await api.delete(`/operations/hotels/${id}`);
      } else if (activeTab === 'local') {
        await api.delete(`/operations/local-agency/${id}`);
      }
      loadOperationsData();
    } catch (err) {}
  };

  const selectedGroup = groups.find(g => g.id.toString() === selectedGroupId);

  const getTabTitle = () => {
    if (activeTab === 'flights') return '航空切位';
    if (activeTab === 'hotels') return '酒店控房';
    return '地接社确认';
  };

  const renderFlightForm = () => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>航班号 *</label>
          <input type="text" value={formData.flight_no || ''}
            onChange={e => setFormData({ ...formData, flight_no: e.target.value })}
            placeholder="如：CA1234" />
        </div>
        <div className="form-group">
          <label>切位座位数 *</label>
          <input type="number" min="1" value={formData.seat_count || 0}
            onChange={e => setFormData({ ...formData, seat_count: parseInt(e.target.value) || 0 })} />
        </div>
      </div>
      <div className="form-row">
        <div className="form-group">
          <label>切位单价 (¥) *</label>
          <input type="number" min="0" step="0.01" value={formData.seat_price || 0}
            onChange={e => setFormData({ ...formData, seat_price: parseFloat(e.target.value) || 0 })} />
        </div>
        <div className="form-group">
          <label>预计总成本</label>
          <input type="text" disabled value={`¥${(formData.seat_count * formData.seat_price).toFixed(2)}`} />
        </div>
      </div>
      <div className="form-group">
        <label>备注</label>
        <textarea rows="2" value={formData.notes || ''}
          onChange={e => setFormData({ ...formData, notes: e.target.value })} />
      </div>
    </>
  );

  const renderHotelForm = () => {
    const nights = formData.checkin_date && formData.checkout_date
      ? Math.max(1, Math.ceil((new Date(formData.checkout_date) - new Date(formData.checkin_date)) / (1000 * 60 * 60 * 24)))
      : 0;
    return (
      <>
        <div className="form-row">
          <div className="form-group">
            <label>酒店名称 *</label>
            <input type="text" value={formData.hotel_name || ''}
              onChange={e => setFormData({ ...formData, hotel_name: e.target.value })} />
          </div>
          <div className="form-group">
            <label>房型</label>
            <select value={formData.room_type || '双人房'}
              onChange={e => setFormData({ ...formData, room_type: e.target.value })}>
              <option value="双人房">双人房</option>
              <option value="三人房">三人房</option>
              <option value="大床房">大床房</option>
              <option value="套房">套房</option>
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>入住日期 *</label>
            <input type="date" value={formData.checkin_date || ''}
              onChange={e => setFormData({ ...formData, checkin_date: e.target.value })} />
          </div>
          <div className="form-group">
            <label>离店日期 *</label>
            <input type="date" value={formData.checkout_date || ''}
              onChange={e => setFormData({ ...formData, checkout_date: e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label>房间数 *</label>
            <input type="number" min="1" value={formData.room_count || 0}
              onChange={e => setFormData({ ...formData, room_count: parseInt(e.target.value) || 0 })} />
          </div>
          <div className="form-group">
            <label>单间/夜价格 (¥) *</label>
            <input type="number" min="0" step="0.01" value={formData.room_price || 0}
              onChange={e => setFormData({ ...formData, room_price: parseFloat(e.target.value) || 0 })} />
          </div>
        </div>
        <div className="form-group">
          <label>预计总成本（{nights}晚）</label>
          <input type="text" disabled value={`¥${(formData.room_count * formData.room_price * nights).toFixed(2)}`} />
        </div>
        <div className="form-group">
          <label>备注</label>
          <textarea rows="2" value={formData.notes || ''}
            onChange={e => setFormData({ ...formData, notes: e.target.value })} />
        </div>
      </>
    );
  };

  const renderLocalForm = () => (
    <>
      <div className="form-row">
        <div className="form-group">
          <label>地接社名称 *</label>
          <input type="text" value={formData.agency_name || ''}
            onChange={e => setFormData({ ...formData, agency_name: e.target.value })} />
        </div>
        <div className="form-group">
          <label>地接导游</label>
          <input type="text" value={formData.guide_name || ''}
            onChange={e => setFormData({ ...formData, guide_name: e.target.value })} />
        </div>
      </div>
      <div className="form-group">
        <label>用车安排</label>
        <textarea rows="2" value={formData.vehicle_info || ''}
          onChange={e => setFormData({ ...formData, vehicle_info: e.target.value })}
          placeholder="如：33座旅游大巴一辆" />
      </div>
      <div className="form-group">
        <label>用餐安排</label>
        <textarea rows="2" value={formData.meal_info || ''}
          onChange={e => setFormData({ ...formData, meal_info: e.target.value })}
          placeholder="如：团餐，8菜1汤" />
      </div>
      <div className="form-group">
        <label>地接费用合计 (¥) *</label>
        <input type="number" min="0" step="0.01" value={formData.total_cost || 0}
          onChange={e => setFormData({ ...formData, total_cost: parseFloat(e.target.value) || 0 })} />
      </div>
      <div className="form-group">
        <label>备注</label>
        <textarea rows="2" value={formData.notes || ''}
          onChange={e => setFormData({ ...formData, notes: e.target.value })} />
      </div>
    </>
  );

  return (
    <div>
      <div className="page-header">
        <h1>计调操作</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>选择团队：</span>
          <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db', minWidth: 250 }}>
            <option value="">请选择团队</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.group_code} - {g.route_name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedGroupId ? (
        <div className="card">
          <div className="empty-state">请先选择一个团队</div>
        </div>
      ) : (
        <>
          {selectedGroup && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="form-row-3">
                <div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>团队</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedGroup.group_code}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>线路</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedGroup.route_name}</div>
                </div>
                <div>
                  <div style={{ color: '#64748b', fontSize: 13 }}>出团日期</div>
                  <div style={{ fontWeight: 600, marginTop: 4 }}>{selectedGroup.departure_date} ~ {selectedGroup.return_date}</div>
                </div>
              </div>
            </div>
          )}

          <div className="card">
            <div className="tabs">
              <div className={`tab ${activeTab === 'flights' ? 'active' : ''}`} onClick={() => setActiveTab('flights')}>
                航空切位
              </div>
              <div className={`tab ${activeTab === 'hotels' ? 'active' : ''}`} onClick={() => setActiveTab('hotels')}>
                酒店控房
              </div>
              <div className={`tab ${activeTab === 'local' ? 'active' : ''}`} onClick={() => setActiveTab('local')}>
                地接社确认
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 16 }}>
              <button className="btn btn-primary" onClick={openAddModal}>+ 添加{getTabTitle()}</button>
            </div>

            {activeTab === 'flights' && (
              flights.length === 0 ? (
                <div className="empty-state">暂无航班切位记录</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>航班号</th>
                      <th>座位数</th>
                      <th>单价</th>
                      <th>总成本</th>
                      <th>备注</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flights.map(f => (
                      <tr key={f.id}>
                        <td><strong>{f.flight_no}</strong></td>
                        <td>{f.seat_count}座</td>
                        <td>¥{f.seat_price}</td>
                        <td style={{ fontWeight: 600, color: '#dc2626' }}>¥{f.total_cost}</td>
                        <td>{f.notes || '-'}</td>
                        <td>
                          <button className="btn btn-sm btn-default" style={{ marginRight: 8 }}
                            onClick={() => openEditModal(f)}>编辑</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f.id)}>删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'hotels' && (
              hotels.length === 0 ? (
                <div className="empty-state">暂无酒店控房记录</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>酒店名称</th>
                      <th>房型</th>
                      <th>间数</th>
                      <th>入住/离店</th>
                      <th>单价</th>
                      <th>总成本</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {hotels.map(h => (
                      <tr key={h.id}>
                        <td><strong>{h.hotel_name}</strong></td>
                        <td>{h.room_type}</td>
                        <td>{h.room_count}间</td>
                        <td>{h.checkin_date} ~ {h.checkout_date}</td>
                        <td>¥{h.room_price}/间夜</td>
                        <td style={{ fontWeight: 600, color: '#dc2626' }}>¥{h.total_cost}</td>
                        <td>
                          <button className="btn btn-sm btn-default" style={{ marginRight: 8 }}
                            onClick={() => openEditModal(h)}>编辑</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(h.id)}>删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}

            {activeTab === 'local' && (
              localAgencies.length === 0 ? (
                <div className="empty-state">暂无地接社记录</div>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>地接社</th>
                      <th>导游</th>
                      <th>用车</th>
                      <th>用餐</th>
                      <th>费用</th>
                      <th>操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {localAgencies.map(l => (
                      <tr key={l.id}>
                        <td><strong>{l.agency_name}</strong></td>
                        <td>{l.guide_name || '-'}</td>
                        <td>{l.vehicle_info || '-'}</td>
                        <td>{l.meal_info || '-'}</td>
                        <td style={{ fontWeight: 600, color: '#dc2626' }}>¥{l.total_cost}</td>
                        <td>
                          <button className="btn btn-sm btn-default" style={{ marginRight: 8 }}
                            onClick={() => openEditModal(l)}>编辑</button>
                          <button className="btn btn-sm btn-danger" onClick={() => handleDelete(l.id)}>删除</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            )}
          </div>
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingItem ? '编辑' : '添加'}{getTabTitle()}</h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {activeTab === 'flights' && renderFlightForm()}
                {activeTab === 'hotels' && renderHotelForm()}
                {activeTab === 'local' && renderLocalForm()}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-default" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">{editingItem ? '保存' : '添加'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default OperationPage;
