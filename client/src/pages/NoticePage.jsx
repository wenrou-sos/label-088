import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function NoticePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadNotice();
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      const data = await api.get('/tourists/groups');
      setGroups(data);
      if (!selectedGroupId && data.length > 0) {
        setSelectedGroupId(data[0].id.toString());
      }
    } catch (err) {}
  };

  const loadNotice = async () => {
    try {
      const data = await api.get(`/notices/groups/${selectedGroupId}`);
      setNotice(data);
    } catch (err) {
      setNotice(null);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSend = (tourist) => {
    alert(`出团通知书已发送给：${tourist.name}（${tourist.phone}）`);
  };

  const handleSendAll = () => {
    if (!notice || notice.tourists.length === 0) {
      alert('暂无游客');
      return;
    }
    alert(`已向 ${notice.tourists.length} 位游客发送出团通知书`);
  };

  if (!notice) {
    return (
      <div>
        <div className="page-header">
          <h1>出团通知书</h1>
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
        <div className="card">
          <div className="empty-state">请选择团队查看出团通知书</div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header" style={{ display: 'none' }} id="no-print-header" />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }} id="toolbar">
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <h1 style={{ margin: 0 }}>出团通知书</h1>
          <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db' }}>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.group_code} - {g.route_name}</option>
            ))}
          </select>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button className="btn btn-default" onClick={handleSendAll}>群发给所有游客</button>
          <button className="btn btn-primary" onClick={handlePrint}>打印通知书</button>
        </div>
      </div>

      <div className="card" id="notice-content" style={{ padding: 40, maxWidth: 900, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', borderBottom: '3px double #333', paddingBottom: 20, marginBottom: 24 }}>
          <h1 style={{ fontSize: 28, margin: 0 }}>出团通知书</h1>
          <div style={{ marginTop: 12, fontSize: 16, color: '#666' }}>
            团号：{notice.group_code}
          </div>
        </div>

        <div className="sub-section">
          <h4 style={{ fontSize: 16, paddingBottom: 8, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
            一、行程信息
          </h4>
          <table style={{ marginBottom: 0 }}>
            <tbody>
              <tr>
                <td style={{ width: 120, background: '#f5f5f5', fontWeight: 600 }}>线路名称</td>
                <td style={{ fontWeight: 600, fontSize: 16 }}>{notice.route_name}</td>
              </tr>
              <tr>
                <td style={{ background: '#f5f5f5', fontWeight: 600 }}>行程天数</td>
                <td>{notice.days}天</td>
              </tr>
              <tr>
                <td style={{ background: '#f5f5f5', fontWeight: 600 }}>出发城市</td>
                <td>{notice.departure_city}</td>
              </tr>
              <tr>
                <td style={{ background: '#f5f5f5', fontWeight: 600 }}>目的地</td>
                <td>{notice.destination}</td>
              </tr>
              <tr>
                <td style={{ background: '#f5f5f5', fontWeight: 600 }}>出团日期</td>
                <td>{notice.departure_date} 至 {notice.return_date}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {notice.flights && notice.flights.length > 0 && (
          <div className="sub-section">
            <h4 style={{ fontSize: 16, paddingBottom: 8, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
              二、航班信息
            </h4>
            <table>
              <thead>
                <tr>
                  <th>航班号</th>
                  <th>座位数</th>
                </tr>
              </thead>
              <tbody>
                {notice.flights.map(f => (
                  <tr key={f.id}>
                    <td><strong>{f.flight_no}</strong></td>
                    <td>{f.seat_count}座</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {notice.hotels && notice.hotels.length > 0 && (
          <div className="sub-section">
            <h4 style={{ fontSize: 16, paddingBottom: 8, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
              三、住宿安排
            </h4>
            <table>
              <thead>
                <tr>
                  <th>酒店</th>
                  <th>房型</th>
                  <th>入住</th>
                  <th>离店</th>
                </tr>
              </thead>
              <tbody>
                {notice.hotels.map(h => (
                  <tr key={h.id}>
                    <td><strong>{h.hotel_name}</strong></td>
                    <td>{h.room_type}</td>
                    <td>{h.checkin_date}</td>
                    <td>{h.checkout_date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="sub-section">
          <h4 style={{ fontSize: 16, paddingBottom: 8, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
            四、每日行程
          </h4>
          {notice.itineraries.map(it => (
            <div key={it.id} style={{
              marginBottom: 16, padding: 12, background: '#fafafa', borderRadius: 6, border: '1px solid #eee'
            }}>
              <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 8, color: '#2563eb' }}>
                第{it.day_number}天：{it.title}
              </div>
              <div style={{ fontSize: 14, lineHeight: 1.8 }}>
                <div><strong>景点：</strong>{it.attractions || '敬请期待'}</div>
                <div><strong>用餐：</strong>{it.meals || '敬请期待'}</div>
                <div><strong>住宿：</strong>{it.accommodation || '敬请期待'}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="sub-section">
          <h4 style={{ fontSize: 16, paddingBottom: 8, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
            五、游客名单
          </h4>
          <table>
            <thead>
              <tr>
                <th style={{ width: 50 }}>序号</th>
                <th>姓名</th>
                <th>身份证号</th>
                <th>联系方式</th>
                <th>房型</th>
                <th style={{ width: 100, display: 'none' }} className="show-in-toolbar">操作</th>
              </tr>
            </thead>
            <tbody>
              {notice.tourists.map((t, idx) => (
                <tr key={t.id}>
                  <td>{idx + 1}</td>
                  <td>{t.name}</td>
                  <td>{t.id_card}</td>
                  <td>{t.phone}</td>
                  <td>{t.room_type}</td>
                  <td style={{ display: 'none' }} className="show-in-toolbar">
                    <button className="btn btn-sm btn-default" onClick={() => handleSend(t)}>发送</button>
                  </td>
                </tr>
              ))}
              {notice.tourists.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', color: '#999', padding: 20 }}>
                    暂无游客
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="sub-section">
          <h4 style={{ fontSize: 16, paddingBottom: 8, borderBottom: '1px solid #ddd', marginBottom: 16 }}>
            六、注意事项
          </h4>
          <div style={{ fontSize: 14, lineHeight: 2 }}>
            <p>1. 请携带有效身份证件原件，准时到达集合地点。</p>
            <p>2. 请根据目的地天气准备合适衣物和随身物品。</p>
            <p>3. 旅途中请遵守导游安排，注意人身和财产安全。</p>
            <p>4. 如有特殊饮食或其他需求，请提前告知导游。</p>
            {notice.notes && <p>5. {notice.notes}</p>}
          </div>
        </div>

        <div style={{ marginTop: 40, textAlign: 'right', fontSize: 14, color: '#666' }}>
          <div>旅行社签章：</div>
          <div style={{ marginTop: 40 }}>
            日期：{new Date(notice.generated_at).toLocaleDateString('zh-CN')}
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { background: white; }
          .layout .sidebar { display: none; }
          .layout .main-content { padding: 0; }
          #toolbar { display: none !important; }
          #no-print-header { display: none !important; }
          .show-in-toolbar { display: table-cell !important; }
          #notice-content { box-shadow: none; padding: 0; }
        }
      `}</style>
    </div>
  );
}

export default NoticePage;
