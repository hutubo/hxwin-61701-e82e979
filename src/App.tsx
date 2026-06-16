import { useMemo, useState, type CSSProperties } from "react";
import "./styles.css";

const project = {
  "id": "hxwin-61701",
  "port": 61701,
  "framework": "react",
  "title": "病理切片初筛工作台",
  "subtitle": "面向病理科的待阅片队列、镜下所见与报告结构化记录。",
  "stack": "React + Vite + TypeScript",
  "accent": "#2f6f73",
  "filters": [
    "全部",
    "HE",
    "IHC",
    "特殊染色",
    "需复核"
  ],
  "metrics": [
    [
      "待阅片",
      "24例"
    ],
    [
      "需补做IHC",
      "6例"
    ],
    [
      "高优先级",
      "5例"
    ],
    [
      "今日复核",
      "9例"
    ]
  ],
  "fields": [
    "病例编号",
    "取材部位",
    "染色类型",
    "优先级",
    "初筛标签",
    "复核状态"
  ],
  "records": [
    [
      "P-240617-01",
      "胃窦活检",
      "HE",
      "高",
      "腺体异型增生",
      "待复核"
    ],
    [
      "P-240617-02",
      "肺穿刺",
      "IHC",
      "中",
      "TTF-1待判读",
      "已初筛"
    ],
    [
      "P-240617-03",
      "结肠息肉",
      "特殊染色",
      "低",
      "切缘待确认",
      "待补充"
    ]
  ],
  "details": [
    [
      "镜下所见",
      "腺体结构拥挤，局灶核深染，可见少量炎细胞浸润。"
    ],
    [
      "疑似诊断",
      "高级别上皮内瘤变倾向，建议上级医师复核。"
    ],
    [
      "结构化要素",
      "肿瘤大小、浸润深度、切缘状态、脉管侵犯均保留独立字段。"
    ]
  ],
  "chart": [
    42,
    68,
    35,
    74,
    51
  ],
  "form": [
    "肿瘤大小",
    "浸润深度",
    "切缘状态",
    "是否补做免疫组化"
  ]
} as const;

export default function App() {
  const [filter, setFilter] = useState<string>(project.filters[0]);
  const [selected, setSelected] = useState(0);
  const visibleRecords = useMemo(() => {
    if (filter === project.filters[0]) return project.records;
    return project.records.filter((row) => row.join(" ").includes(filter));
  }, [filter]);
  const rows = visibleRecords.length ? visibleRecords : project.records;

  return (
    <main className="app-shell" style={{ "--accent": project.accent } as CSSProperties}>
      <header className="topbar">
        <div>
          <p className="eyebrow">{project.stack}</p>
          <h1>{project.title}</h1>
          <p className="subtitle">{project.subtitle}</p>
        </div>
        <div className="port-card">
          <span>本地开发端口</span>
          <strong>{project.port}</strong>
          <span>{project.id}</span>
        </div>
      </header>

      <section className="workspace">
        <div>
          <div className="metric-grid">
            {project.metrics.map(([label, value]) => (
              <article className="metric" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </article>
            ))}
          </div>

          <section className="panel">
            <h2>专业记录列表</h2>
            <div className="filters">
              {project.filters.map((item) => (
                <button className={"chip " + (filter === item ? "active" : "")} key={item} onClick={() => setFilter(item)}>
                  {item}
                </button>
              ))}
            </div>
            <table className="data-table">
              <thead>
                <tr>{project.fields.map((field) => <th key={field}>{field}</th>)}</tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr className={selected === index ? "selected" : ""} key={row.join("-")} onClick={() => setSelected(index)}>
                    {row.map((cell) => <td key={cell}>{cell}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section className="panel">
            <h2>指标趋势</h2>
            <div className="chart" aria-label="指标趋势图">
              {project.chart.map((value, index) => (
                <div className="bar" style={{ height: value + "%" }} key={index}>
                  <span>{value}</span>
                </div>
              ))}
            </div>
            <p className="mini-note">图表使用前端mock数据展示关键指标变化，适合作为后续接口联调的UI骨架。</p>
          </section>
        </div>

        <aside>
          <section className="panel">
            <h2>详情工作区</h2>
            <div className="detail-list">
              {project.details.map(([title, text]) => (
                <div className="detail-item" key={title}>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="panel">
            <h2>快速录入</h2>
            <div className="form-grid">
              {project.form.map((field) => (
                <label key={field}>{field}<input placeholder={"填写" + field} /></label>
              ))}
              <textarea placeholder="补充专业备注" />
            </div>
            <div className="actions">
              <button className="primary">保存记录</button>
              <button className="secondary">导出JSON</button>
            </div>
          </section>
        </aside>
      </section>
    </main>
  );
}
