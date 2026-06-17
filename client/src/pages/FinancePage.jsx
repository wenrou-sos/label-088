import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api.js';

function FinancePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');
  const [summary, setSummary] = useState(null);
  const [allSummaries, setAllSummaries] = useState([]);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadSummary();
    }
  }, [selectedGroupId]);

  const loadGroups = async () => {
    try {
      const data = await api.get('/tourists/groups');
      setGroups(data);
      if (!selectedGroupId && data.length > 0) {
        setSelectedGroupId(data[0].id.toString());
      }
      const summaries = [];
      for (const g of data) {
        try {
          const s = await api.get(`/finance/groups/${g.id}/summary`);
          summaries.push(s);
        } catch (e) {}
      }
      setAllSummaries(summaries);
    } catch (err) {}
  };

  const loadSummary = async () => {
    try {
      const data = await api.get(`/finance/groups/${selectedGroupId}/summary`);
      setSummary(data);
    } catch (err) {
      setSummary(null);
    }
  };

  const totalIncome = allSummaries.reduce((sum, s) => sum + parseFloat(s.total_income), 0);
  const totalCost = allSummaries.reduce((sum, s) => sum + parseFloat(s.costs.total), 0);
  const totalProfit = totalIncome - totalCost;
  const totalMargin = totalIncome > 0 ? (totalProfit / totalIncome * 100).toFixed(2) : 0;

  return (
    <div>
      <div className="page-header">
        <h1>收入成本分析</h1>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <span>选择团队：</span>
          <select value={selectedGroupId} onChange={e => setSelectedGroupId(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 4, border: '1px solid #d1d5db', minWidth: 250 }}>
            <option value="">全部团队（汇总）</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.group_code} - {g.route_name}</option>
            ))}
          </select>
        </div>
      </div>

      {!selectedGroupId ? (
        <>
          <div className="stat-cards">
            <div className="stat-card">
              <div className="label">总收入</div>
              <div className="value" style={{ color: '#16a34a' }}>¥{totalIncome.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="label">总成本</div>
              <div className="value" style={{ color: '#dc2626' }}>¥{totalCost.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="label">总毛利</div>
              <div className={`value ${totalProfit >= 0 ? 'positive' : 'negative'}`}>¥{totalProfit.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="label">平均毛利率</div>
              <div className="value">{totalMargin}%</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 16 }}>各团队明细</h3>
            {allSummaries.length === 0 ? (
              <div className="empty-state">暂无数据</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>团号</th>
                    <th>线路</th>
                    <th>出团日期</th>
                    <th>游客数</th>
                    <th>总收入</th>
                    <th>总成本</th>
                    <th>毛利</th>
                    <th>毛利率</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {allSummaries.map(s => (
                    <tr key={s.group.id} style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedGroupId(s.group.id.toString())}>
                      <td><strong>{s.group.group_code}</strong></td>
                      <td>{s.group.route_name}</td>
                      <td>{s.group.departure_date}</td>
                      <td>{s.tourists_count}/{s.group.max_group_size}</td>
                      <td style={{ color: '#16a34a' }}>¥{s.total_income}</td>
                      <td style={{ color: '#dc2626' }}>¥{s.costs.total}</td>
                      <td style={{ fontWeight: 600, color: parseFloat(s.gross_profit) >= 0 ? '#16a34a' : '#dc2626' }}>
                        ¥{s.gross_profit}
                      </td>
                      <td>{s.profit_margin}%</td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn btn-sm btn-default"
                          onClick={() => navigate(`/finance/${s.group.id}`)}>详情</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      ) : (
        <>
          {summary && (
            <>
              <div className="card">
                <div className="form-row-3">
                  <div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>团队</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{summary.group.group_code}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>线路</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>{summary.group.route_name}</div>
                  </div>
                  <div>
                    <div style={{ color: '#64748b', fontSize: 13 }}>出团日期</div>
                    <div style={{ fontWeight: 600, marginTop: 4 }}>
                      {summary.group.departure_date} ~ {summary.group.return_date}
                    </div>
                  </div>
                </div>
              </div>

              <div className="stat-cards">
                <div className="stat-card">
                  <div className="label">游客人数</div>
                  <div className="value">{summary.tourists_count}人</div>
                </div>
                <div className="stat-card">
                  <div className="label">总收入</div>
                  <div className="value" style={{ color: '#16a34a' }}>¥{summary.total_income}</div>
                </div>
                <div className="stat-card">
                  <div className="label">总成本</div>
                  <div className="value" style={{ color: '#dc2626' }}>¥{summary.costs.total}</div>
                </div>
                <div className="stat-card">
                  <div className="label">毛利 / 毛利率</div>
                  <div className={`value ${parseFloat(summary.gross_profit) >= 0 ? 'positive' : 'negative'}`}>
                    ¥{summary.gross_profit}
                  </div>
                  <div style={{ fontSize: 14, marginTop: 4, color: '#64748b' }}>
                    毛利率 {summary.profit_margin}%
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 16 }}>收入明细</h3>
                <table>
                  <thead>
                    <tr>
                      <th>项目</th>
                      <th style={{ textAlign: 'right' }}>金额</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>游客团费收入（{summary.tourists_count}人）</td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#16a34a' }}>¥{summary.total_income}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="card">
                <h3 style={{ marginBottom: 16 }}>成本明细</h3>
                <table>
                  <thead>
                    <tr>
                      <th>项目</th>
                      <th style={{ textAlign: 'right' }}>金额</th>
                      <th style={{ width: 100 }}>占比</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>航空切位费用</td>
                      <td style={{ textAlign: 'right' }}>¥{summary.costs.flight}</td>
                      <td>
                        {parseFloat(summary.costs.total) > 0
                          ? (parseFloat(summary.costs.flight) / parseFloat(summary.costs.total) * 100).toFixed(1)
                          : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td>酒店控房费用</td>
                      <td style={{ textAlign: 'right' }}>¥{summary.costs.hotel}</td>
                      <td>
                        {parseFloat(summary.costs.total) > 0
                          ? (parseFloat(summary.costs.hotel) / parseFloat(summary.costs.total) * 100).toFixed(1)
                          : 0}%
                      </td>
                    </tr>
                    <tr>
                      <td>地接社费用</td>
                      <td style={{ textAlign: 'right' }}>¥{summary.costs.local_agency}</td>
                      <td>
                        {parseFloat(summary.costs.total) > 0
                          ? (parseFloat(summary.costs.local_agency) / parseFloat(summary.costs.total) * 100).toFixed(1)
                          : 0}%
                      </td>
                    </tr>
                    <tr style={{ background: '#fef2f2' }}>
                      <td><strong>成本合计</strong></td>
                      <td style={{ textAlign: 'right', fontWeight: 600, color: '#dc2626' }}>
                        <strong>¥{summary.costs.total}</strong>
                      </td>
                      <td>100%</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="card" style={{
                background: parseFloat(summary.gross_profit) >= 0 ? '#f0fdf4' : '#fef2f2',
                border: `2px solid ${parseFloat(summary.gross_profit) >= 0 ? '#86efac' : '#fca5a5'}`
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>毛利估算</h3>
                    <div style={{ marginTop: 8, color: '#64748b' }}>
                      总收入 ¥{summary.total_income} - 总成本 ¥{summary.costs.total}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 32, fontWeight: 700, color: parseFloat(summary.gross_profit) >= 0 ? '#16a34a' : '#dc2626' }}>
                      {parseFloat(summary.gross_profit) >= 0 ? '+' : ''}¥{summary.gross_profit}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 16 }}>
                      毛利率 {summary.profit_margin}%
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

export default FinancePage;
