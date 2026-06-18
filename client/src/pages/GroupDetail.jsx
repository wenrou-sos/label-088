import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function GroupDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState(null);
  const [tourists, setTourists] = useState([]);
  const [hotelBookings, setHotelBookings] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTourist, setNewTourist] = useState({
    name: '',
    id_card: '',
    phone: '',
    room_type: '双人房',
    special_requirements: ''
  });
  const [newStatus, setNewStatus] = useState('');
  const [accommodationExpanded, setAccommodationExpanded] = useState(true);

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
    try {
      const hotels = await api.get(`/operations/groups/${id}/hotels`);
      setHotelBookings(hotels || []);
    } catch (err) {}
  };

  const getGenderFromIdCard = (idCard) => {
    if (!idCard || idCard.length < 17) return 'unknown';
    const seventeenth = parseInt(idCard.charAt(16), 10);
    return isNaN(seventeenth) ? 'unknown' : (seventeenth % 2 === 1 ? 'male' : 'female');
  };

  const generateAccommodation = () => {
    const doubleRoomTourists = tourists.filter(t => t.room_type === '双人房');
    const tripleRoomTourists = tourists.filter(t => t.room_type === '三人房');
    const childNoBedTourists = tourists.filter(t => t.room_type === '儿童不占床');

    const males = doubleRoomTourists.filter(t => getGenderFromIdCard(t.id_card) === 'male');
    const females = doubleRoomTourists.filter(t => getGenderFromIdCard(t.id_card) === 'female');
    const unknownGender = doubleRoomTourists.filter(t => getGenderFromIdCard(t.id_card) === 'unknown');

    const rooms = [];
    let roomNumber = 1;

    for (let i = 0; i < males.length; i += 2) {
      const isSingle = i + 1 >= males.length;
      rooms.push({
        roomNo: roomNumber++,
        type: '双人房',
        gender: 'male',
        occupants: isSingle ? [males[i]] : [males[i], males[i + 1]],
        isNaturalSingle: isSingle
      });
    }

    for (let i = 0; i < females.length; i += 2) {
      const isSingle = i + 1 >= females.length;
      rooms.push({
        roomNo: roomNumber++,
        type: '双人房',
        gender: 'female',
        occupants: isSingle ? [females[i]] : [females[i], females[i + 1]],
        isNaturalSingle: isSingle
      });
    }

    const tripleMales = tripleRoomTourists.filter(t => getGenderFromIdCard(t.id_card) === 'male');
    const tripleFemales = tripleRoomTourists.filter(t => getGenderFromIdCard(t.id_card) === 'female');
    const tripleUnknown = tripleRoomTourists.filter(t => getGenderFromIdCard(t.id_card) === 'unknown');

    for (let i = 0; i < tripleMales.length; i += 3) {
      const remaining = tripleMales.length - i;
      const occupants = tripleMales.slice(i, i + 3);
      rooms.push({
        roomNo: roomNumber++,
        type: '三人房',
        gender: 'male',
        occupants,
        isNaturalSingle: false,
        isUnderfilled: remaining < 3
      });
    }

    for (let i = 0; i < tripleFemales.length; i += 3) {
      const remaining = tripleFemales.length - i;
      const occupants = tripleFemales.slice(i, i + 3);
      rooms.push({
        roomNo: roomNumber++,
        type: '三人房',
        gender: 'female',
        occupants,
        isNaturalSingle: false,
        isUnderfilled: remaining < 3
      });
    }

    for (const t of unknownGender) {
      rooms.push({
        roomNo: roomNumber++,
        type: '双人房',
        gender: 'unknown',
        occupants: [t],
        isNaturalSingle: true
      });
    }

    for (const t of tripleUnknown) {
      rooms.push({
        roomNo: roomNumber++,
        type: '三人房',
        gender: 'unknown',
        occupants: [t],
        isNaturalSingle: false,
        isUnderfilled: true
      });
    }

    const doubleRoomHotels = hotelBookings.filter(h => h.room_type === '双人房');
    const doubleRoomTotalPerRoom = doubleRoomHotels.reduce((sum, h) => {
      const checkin = new Date(h.checkin_date);
      const checkout = new Date(h.checkout_date);
      const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      return sum + h.room_price * nights;
    }, 0);

    const totalNights = doubleRoomHotels.reduce((sum, h) => {
      const checkin = new Date(h.checkin_date);
      const checkout = new Date(h.checkout_date);
      return sum + Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
    }, 0);

    const naturalSingles = rooms.filter(r => r.type === '双人房' && r.isNaturalSingle);
    const totalSingleSupplement = doubleRoomTotalPerRoom * naturalSingles.length;

    const hotelBreakdown = doubleRoomHotels.map(h => {
      const checkin = new Date(h.checkin_date);
      const checkout = new Date(h.checkout_date);
      const nights = Math.ceil((checkout - checkin) / (1000 * 60 * 60 * 24));
      return {
        hotel_name: h.hotel_name,
        room_price: h.room_price,
        nights,
        subtotal: h.room_price * nights
      };
    });

    return {
      rooms,
      stats: {
        totalTourists: tourists.length,
        doubleRoomCount: rooms.filter(r => r.type === '双人房').length,
        tripleRoomCount: rooms.filter(r => r.type === '三人房').length,
        naturalSingleCount: naturalSingles.length,
        singleSupplement: totalSingleSupplement,
        doubleRoomTotalPerRoom,
        totalNights,
        hotelBreakdown,
        childNoBedCount: childNoBedTourists.length,
        maleCount: males.length,
        femaleCount: females.length,
        unknownGenderCount: unknownGender.length
      },
      childNoBedTourists
    };
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

      {tourists.length > 0 && (() => {
        const accom = generateAccommodation();
        const { rooms, stats, childNoBedTourists } = accom;
        const genderLabel = { male: '男', female: '女', unknown: '未知' };
        return (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: accommodationExpanded ? 16 : 0, cursor: 'pointer' }}
              onClick={() => setAccommodationExpanded(!accommodationExpanded)}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
                住宿分配
                {stats.naturalSingleCount > 0 && (
                  <span className="tag tag-red">自然单间×{stats.naturalSingleCount}</span>
                )}
              </h3>
              <span style={{ color: '#64748b', fontSize: 13 }}>
                {accommodationExpanded ? '收起 ▲' : '展开 ▼'}
              </span>
            </div>

            {accommodationExpanded && (
              <>
                <div className="accom-stats">
                  <div className="accom-stat-item">
                    <div className="accom-stat-label">双人房游客</div>
                    <div className="accom-stat-value">{stats.maleCount + stats.femaleCount + stats.unknownGenderCount}人</div>
                    <div className="accom-stat-detail">男{stats.maleCount} / 女{stats.femaleCount}{stats.unknownGenderCount > 0 ? ` / 未知${stats.unknownGenderCount}` : ''}</div>
                  </div>
                  <div className="accom-stat-item">
                    <div className="accom-stat-label">所需房间</div>
                    <div className="accom-stat-value">{stats.doubleRoomCount + stats.tripleRoomCount}间</div>
                    <div className="accom-stat-detail">双人间{stats.doubleRoomCount} / 三人间{stats.tripleRoomCount}</div>
                  </div>
                  <div className="accom-stat-item accom-stat-highlight">
                    <div className="accom-stat-label">自然单间</div>
                    <div className="accom-stat-value" style={{ color: '#dc2626' }}>{stats.naturalSingleCount}间</div>
                    <div className="accom-stat-detail">仅统计双人房落单</div>
                  </div>
                  <div className="accom-stat-item accom-stat-highlight">
                    <div className="accom-stat-label">单房差补费合计</div>
                    <div className="accom-stat-value" style={{ color: '#dc2626' }}>
                      ¥{stats.singleSupplement > 0 ? stats.singleSupplement.toFixed(2) : '0.00'}
                    </div>
                    <div className="accom-stat-detail">
                      {stats.doubleRoomTotalPerRoom > 0
                        ? `全程双人房 ¥${stats.doubleRoomTotalPerRoom.toFixed(0)}/间 × ${stats.naturalSingleCount}间`
                        : '暂无酒店报价数据'}
                    </div>
                  </div>
                </div>

                {stats.naturalSingleCount > 0 && (
                  <div className="accom-single-supplement-notice">
                    <strong>单房差说明：</strong>
                    以下标记为"自然单间"的游客因同性双人房人数为奇数，无法完成配对，需单独占用一间房。
                    <br />
                    <strong>计算公式：</strong>单房差补费 = 全程每间双人房总价 × 自然单间数
                    {stats.doubleRoomTotalPerRoom > 0 && (
                      <>
                        <br />
                        <strong>全程房价明细（{stats.totalNights}晚）：</strong>
                        {stats.hotelBreakdown.map((h, idx) => (
                          <span key={idx}>
                            {idx > 0 && ' + '}
                            {h.hotel_name} ¥{h.room_price.toFixed(0)}×{h.nights}晚=¥{h.subtotal.toFixed(0)}
                          </span>
                        ))}
                        <span> = ¥{stats.doubleRoomTotalPerRoom.toFixed(2)}/间</span>
                        <br />
                        <strong>单房差合计：</strong>
                        <span>¥{stats.doubleRoomTotalPerRoom.toFixed(2)} × {stats.naturalSingleCount} = </span>
                        <strong style={{ color: '#dc2626' }}>¥{stats.singleSupplement.toFixed(2)}</strong>
                      </>
                    )}
                  </div>
                )}

                <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
                  <span className="accom-legend accom-legend-male">♂ 男宾房</span>
                  <span className="accom-legend accom-legend-female">♀ 女宾房</span>
                  <span className="accom-legend accom-legend-single">⚠ 自然单间</span>
                  <span className="accom-legend accom-legend-triple">三人房不足</span>
                  {stats.childNoBedCount > 0 && <span className="accom-legend accom-legend-child">👶 儿童不占床</span>}
                </div>

                <table className="accom-table">
                  <thead>
                    <tr>
                      <th style={{ width: 60 }}>房号</th>
                      <th style={{ width: 80 }}>房型</th>
                      <th style={{ width: 70 }}>性别</th>
                      <th>入住游客</th>
                      <th style={{ width: 110 }}>状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rooms.map(room => (
                      <tr key={room.roomNo} className={room.isNaturalSingle ? 'accom-row-single' : (room.isUnderfilled ? 'accom-row-underfilled' : '')}>
                        <td><strong>{room.roomNo}</strong></td>
                        <td>{room.type}</td>
                        <td>
                          <span className={`accom-gender-tag accom-gender-${room.gender}`}>
                            {genderLabel[room.gender]}
                          </span>
                        </td>
                        <td>
                          {room.occupants.map((t, idx) => (
                            <span key={t.id}>
                              {idx > 0 && <span style={{ color: '#94a3b8', margin: '0 4px' }}>+</span>}
                              <span className="accom-tourist-name">{t.name}</span>
                              {t.special_requirements && (
                                <span className="accom-req-tag">{t.special_requirements}</span>
                              )}
                            </span>
                          ))}
                        </td>
                        <td>
                          {room.isNaturalSingle && (
                            <span className="tag tag-red">自然单间</span>
                          )}
                          {!room.isNaturalSingle && room.isUnderfilled && (
                            <span className="tag tag-yellow">
                              {room.type === '三人房' ? `${room.occupants.length}人三人间` : '未满'}
                            </span>
                          )}
                          {!room.isNaturalSingle && !room.isUnderfilled && (
                            <span className="tag tag-green">满员</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {childNoBedTourists.length > 0 && (
                  <div className="accom-child-section">
                    <h4>儿童不占床 ({childNoBedTourists.length}人)</h4>
                    <div className="accom-child-list">
                      {childNoBedTourists.map(t => (
                        <span key={t.id} className="accom-child-tag">
                          👶 {t.name}
                          {t.special_requirements && <span className="accom-req-tag">{t.special_requirements}</span>}
                        </span>
                      ))}
                    </div>
                    <div style={{ color: '#64748b', fontSize: 12, marginTop: 6 }}>
                      儿童不占床需与家长同住，不单独分配房间
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        );
      })()}
    </div>
  );
}

export default GroupDetail;
