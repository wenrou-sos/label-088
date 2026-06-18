import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import api from '../services/api.js';

function FinancePage() {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState(groupId || '');
  const [summary, setSummary] = useState(null);
  const [allSummaries, setAllSummaries] = useState([]);

  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const trendChartRef = useRef(null);
  const barInstance = useRef(null);
  const pieInstance = useRef(null);
  const trendInstance = useRef(null);

  useEffect(() => {
    loadGroups();
  }, []);

  useEffect(() => {
    if (selectedGroupId) {
      loadSummary();
    }
  }, [selectedGroupId]);

  useEffect(() => {
    return () => {
      barInstance.current?.dispose();
      pieInstance.current?.dispose();
      trendInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    const onResize = () => {
      barInstance.current?.resize();
      pieInstance.current?.resize();
      trendInstance.current?.resize();
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const loadGroups = async () => {
    try {
      const data = await api.get('/tourists/groups');
      setGroups(data);
      if (groupId !== undefined && data.length > 0) {
        const exists = data.some(g => g.id.toString() === groupId);
        if (!exists) {
          setSelectedGroupId(data[0].id.toString());
        }
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

  useEffect(() => {
    if (!selectedGroupId && trendChartRef.current) {
      if (allSummaries.length > 0) {
        renderTrendChart();
      } else if (trendInstance.current) {
        trendInstance.current.dispose();
        trendInstance.current = null;
      }
    }
  }, [allSummaries, selectedGroupId]);

  useEffect(() => {
    if (!selectedGroupId && allSummaries.length > 0 && trendChartRef.current) {
      const t = requestAnimationFrame(() => {
        renderTrendChart();
        trendInstance.current?.resize();
      });
      return () => cancelAnimationFrame(t);
    }
  }, []);

  useEffect(() => {
    if (summary && barChartRef.current) {
      renderBarChart();
    }
    if (summary && pieChartRef.current) {
      renderPieChart();
    }
  }, [summary]);

  const renderBarChart = () => {
    if (!barChartRef.current) return;
    if (!barInstance.current) {
      barInstance.current = echarts.init(barChartRef.current);
    }
    const income = parseFloat(summary.total_income);
    const flight = parseFloat(summary.costs.flight);
    const hotel = parseFloat(summary.costs.hotel);
    const local = parseFloat(summary.costs.local_agency);
    const total = parseFloat(summary.costs.total);
    const profit = parseFloat(summary.gross_profit);

    const option = {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params) => {
          let html = `<strong>${params[0].axisValue}</strong><br/>`;
          params.forEach(p => {
            html += `${p.marker}${p.seriesName}: ¥${p.value.toFixed(2)}<br/>`;
          });
          return html;
        }
      },
      legend: {
        data: ['金额', '毛利率参考'],
        top: 0
      },
      grid: { left: 60, right: 40, top: 50, bottom: 40 },
      xAxis: {
        type: 'category',
        data: ['团费总收入', '航空切位', '酒店控房', '地接社', '成本合计', '毛利'],
        axisLabel: { fontSize: 12, interval: 0, rotate: 0 }
      },
      yAxis: {
        type: 'value',
        name: '金额 (¥)',
        axisLabel: { formatter: (v) => v >= 10000 ? (v/10000).toFixed(1)+'万' : v }
      },
      series: [
        {
          name: '金额',
          type: 'bar',
          barWidth: '50%',
          data: [
            { value: income, itemStyle: { color: '#22c55e' } },
            { value: flight, itemStyle: { color: '#3b82f6' } },
            { value: hotel, itemStyle: { color: '#f59e0b' } },
            { value: local, itemStyle: { color: '#8b5cf6' } },
            { value: total, itemStyle: { color: '#ef4444' } },
            { value: profit, itemStyle: { color: profit >= 0 ? '#10b981' : '#dc2626' } }
          ],
          label: {
            show: true,
            position: 'top',
            formatter: (p) => {
              if (p.value >= 10000) return '¥' + (p.value/10000).toFixed(1) + '万';
              return '¥' + p.value.toFixed(0);
            },
            fontSize: 11,
            fontWeight: 600
          }
        }
      ]
    };
    barInstance.current.setOption(option, true);
  };

  const renderPieChart = () => {
    if (!pieChartRef.current) return;
    if (!pieInstance.current) {
      pieInstance.current = echarts.init(pieChartRef.current);
    }
    const flight = parseFloat(summary.costs.flight);
    const hotel = parseFloat(summary.costs.hotel);
    const local = parseFloat(summary.costs.local_agency);
    const data = [
      { value: flight, name: '航空切位', itemStyle: { color: '#3b82f6' } },
      { value: hotel, name: '酒店控房', itemStyle: { color: '#f59e0b' } },
      { value: local, name: '地接社', itemStyle: { color: '#8b5cf6' } }
    ].filter(d => d.value > 0);

    const option = {
      tooltip: {
        trigger: 'item',
        formatter: (p) => {
          const total = flight + hotel + local;
          const pct = total > 0 ? (p.value / total * 100).toFixed(1) : 0;
          return `<strong>${p.name}</strong><br/>金额: ¥${p.value.toFixed(2)}<br/>占比: ${pct}%`;
        }
      },
      legend: { orient: 'vertical', left: 'left', top: 'middle' },
      series: [
        {
          name: '成本构成',
          type: 'pie',
          radius: ['45%', '72%'],
          center: ['60%', '50%'],
          avoidLabelOverlap: true,
          itemStyle: { borderRadius: 8, borderColor: '#fff', borderWidth: 2 },
          label: {
            show: true,
            formatter: '{b}\n{d}%',
            fontSize: 12,
            lineHeight: 18
          },
          labelLine: { length: 10, length2: 15 },
          emphasis: {
            label: { show: true, fontSize: 14, fontWeight: 'bold' },
            itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: 'rgba(0,0,0,0.3)' }
          },
          data
        }
      ],
      graphic: data.length === 0 ? [{
        type: 'text',
        left: 'center',
        top: 'middle',
        style: { text: '暂无成本数据', fontSize: 14, fill: '#94a3b8' }
      }] : undefined
    };
    pieInstance.current.setOption(option, true);
  };

  const renderTrendChart = () => {
    if (!trendChartRef.current) return;
    if (!trendInstance.current) {
      trendInstance.current = echarts.init(trendChartRef.current);
    }
    const sorted = [...allSummaries].sort((a, b) => {
      const da = new Date(a.group.departure_date);
      const db = new Date(b.group.departure_date);
      return da - db;
    });
    const dates = sorted.map(s => {
      const d = new Date(s.group.departure_date);
      return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
    });
    const margins = sorted.map(s => parseFloat(s.profit_margin));
    const codes = sorted.map(s => s.group.group_code);
    const benchmarkMargin = parseFloat(totalMargin);

    const option = {
      tooltip: {
        trigger: 'axis',
        formatter: (params) => {
          const idx = params[0].dataIndex;
          const s = sorted[idx];
          const income = parseFloat(s.total_income);
          const cost = parseFloat(s.costs.total);
          const profit = parseFloat(s.gross_profit);
          return `<strong>${codes[idx]}</strong><br/>
                  出团: ${dates[idx]}<br/>
                  收入: ¥${income.toFixed(0)}<br/>
                  成本: ¥${cost.toFixed(0)}<br/>
                  毛利: ¥${profit.toFixed(0)}<br/>
                  毛利率: <strong>${params[0].value}%</strong>`;
        }
      },
      grid: { left: 60, right: 40, top: 60, bottom: 80 },
      legend: { data: ['毛利率', '整体加权平均毛利率'], top: 0 },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: codes,
        axisLabel: {
          rotate: 30,
          fontSize: 11,
          formatter: (val, idx) => `${val}\n${dates[idx]}`
        }
      },
      yAxis: {
        type: 'value',
        name: '毛利率 (%)',
        axisLabel: { formatter: '{value}%' },
        scale: true
      },
      series: [
        {
          name: '毛利率',
          type: 'line',
          smooth: true,
          symbol: 'circle',
          symbolSize: 10,
          lineStyle: { width: 3, color: '#0ea5e9' },
          itemStyle: {
            color: (p) => p.value >= benchmarkMargin ? '#10b981' : '#f97316'
          },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(14, 165, 233, 0.35)' },
              { offset: 1, color: 'rgba(14, 165, 233, 0.02)' }
            ])
          },
          label: {
            show: true,
            position: 'top',
            formatter: '{c}%',
            fontSize: 11,
            fontWeight: 600
          },
          markLine: {
            symbol: 'none',
            lineStyle: { type: 'dashed', color: '#64748b', width: 2 },
            label: {
              formatter: `整体加权平均: {c}%`,
              position: 'end',
              fontSize: 12,
              fontWeight: 600,
              backgroundColor: '#f1f5f9',
              padding: [4, 8],
              borderRadius: 4
            },
            data: [{ yAxis: benchmarkMargin, name: '整体加权平均毛利率' }]
          },
          data: margins
        }
      ]
    };
    trendInstance.current.setOption(option, true);
  };

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
              <div className="label">整体加权平均毛利率</div>
              <div className="value">{totalMargin}%</div>
            </div>
          </div>

          <div className="card">
            <h3 style={{ marginBottom: 4 }}>毛利率趋势分析</h3>
            <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
              按出团日期排列，对比各团队毛利率；绿色高于整体加权平均、橙色低于整体加权平均
            </div>
            {allSummaries.length === 0 ? (
              <div className="empty-state" style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                暂无团队数据，无法绘制趋势图
              </div>
            ) : (
              <div ref={trendChartRef} style={{ width: '100%', height: 360 }}></div>
            )}
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
                  {[...allSummaries].sort((a,b) => new Date(a.group.departure_date) - new Date(b.group.departure_date)).map(s => {
                    const fmtDate = (iso) => {
                      if (!iso) return '-';
                      const d = new Date(iso);
                      return isNaN(d.getTime()) ? iso : `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                    };
                    return (
                    <tr key={s.group.id} style={{ cursor: 'pointer' }}
                      onClick={() => setSelectedGroupId(s.group.id.toString())}>
                      <td><strong>{s.group.group_code}</strong></td>
                      <td>{s.group.route_name}</td>
                      <td>{fmtDate(s.group.departure_date)}</td>
                      <td>{s.tourists_count}/{s.group.max_group_size}</td>
                      <td style={{ color: '#16a34a' }}>¥{s.total_income}</td>
                      <td style={{ color: '#dc2626' }}>¥{s.costs.total}</td>
                      <td style={{ fontWeight: 600, color: parseFloat(s.gross_profit) >= 0 ? '#16a34a' : '#dc2626' }}>
                        ¥{s.gross_profit}
                      </td>
                      <td>
                        <span style={{
                          padding: '2px 10px',
                          borderRadius: 12,
                          background: parseFloat(s.profit_margin) >= parseFloat(totalMargin) ? '#dcfce7' : '#ffedd5',
                          color: parseFloat(s.profit_margin) >= parseFloat(totalMargin) ? '#166534' : '#9a3412',
                          fontWeight: 600
                        }}>
                          {s.profit_margin}%
                        </span>
                      </td>
                      <td onClick={e => e.stopPropagation()}>
                        <button className="btn btn-sm btn-default"
                          onClick={() => navigate(`/finance/${s.group.id}`)}>详情</button>
                      </td>
                    </tr>
                  );})}
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
                <h3 style={{ marginBottom: 4 }}>收入 - 成本对比</h3>
                <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                  绿色代表收入/盈利，红/橙/蓝/紫代表各项成本支出
                </div>
                <div ref={barChartRef} style={{ width: '100%', height: 380 }}></div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div className="card">
                  <h3 style={{ marginBottom: 4 }}>成本构成</h3>
                  <div style={{ color: '#64748b', fontSize: 13, marginBottom: 12 }}>
                    航空/酒店/地接三大成本占比分析
                  </div>
                  <div ref={pieChartRef} style={{ width: '100%', height: 340 }}></div>
                </div>

                <div className="card" style={{
                  background: parseFloat(summary.gross_profit) >= 0 ? '#f0fdf4' : '#fef2f2',
                  border: `2px solid ${parseFloat(summary.gross_profit) >= 0 ? '#86efac' : '#fca5a5'}`
                }}>
                  <h3 style={{ marginBottom: 16 }}>毛利估算</h3>
                  <div style={{ marginBottom: 12, color: '#64748b' }}>
                    总收入 ¥{summary.total_income} - 总成本 ¥{summary.costs.total}
                  </div>
                  <div style={{ fontSize: 32, fontWeight: 700, color: parseFloat(summary.gross_profit) >= 0 ? '#16a34a' : '#dc2626' }}>
                    {parseFloat(summary.gross_profit) >= 0 ? '+' : ''}¥{summary.gross_profit}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 16, fontWeight: 600 }}>
                    毛利率 {summary.profit_margin}%
                  </div>
                  <div style={{ marginTop: 20, paddingTop: 20, borderTop: '1px dashed rgba(0,0,0,0.15)' }}>
                    <div style={{ fontSize: 13, color: '#64748b', marginBottom: 8 }}>各成本项明细</div>
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 8,
                      fontSize: 13
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#3b82f6' }}>■ 航空切位</span>
                        <span style={{ fontWeight: 600 }}>¥{summary.costs.flight}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#f59e0b' }}>■ 酒店控房</span>
                        <span style={{ fontWeight: 600 }}>¥{summary.costs.hotel}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gridColumn: '1 / -1' }}>
                        <span style={{ color: '#8b5cf6' }}>■ 地接社</span>
                        <span style={{ fontWeight: 600 }}>¥{summary.costs.local_agency}</span>
                      </div>
                    </div>
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
            </>
          )}
        </>
      )}
    </div>
  );
}

export default FinancePage;
