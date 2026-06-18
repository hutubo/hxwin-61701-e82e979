import { useMemo, useRef, useState, type CSSProperties } from "react";
import "./styles.css";

type CaseDetail = {
  microscopy: string;
  diagnosis: string;
  structured: {
    tumorSize: string;
    invasionDepth: string;
    marginStatus: string;
    vascularInvasion: string;
  };
  remark: string;
};

type QuickEntryData = {
  tumorSize: string;
  invasionDepth: string;
  marginStatus: string;
  ihcSupplement: string;
  remark: string;
};

type ExportData = {
  version: string;
  exportedAt: string;
  records: ReadonlyRecordRow[];
  caseDetails: Record<string, CaseDetail>;
  quickEntry: QuickEntryData;
};

type ImportError = {
  field: string;
  message: string;
};

const emptyQuickEntry: QuickEntryData = {
  tumorSize: "",
  invasionDepth: "",
  marginStatus: "",
  ihcSupplement: "",
  remark: ""
};

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
  "caseDetails": {
    "P-240617-01": {
      microscopy: "腺体结构拥挤，局灶核深染，核浆比增高，可见少量炎细胞浸润。黏膜肌层未见明确侵犯。",
      diagnosis: "高级别上皮内瘤变倾向，部分区域疑有早期浸润，建议上级医师复核并做免疫组化辅助诊断。",
      structured: {
        tumorSize: "0.8cm × 0.6cm",
        invasionDepth: "黏膜层，疑及黏膜肌层",
        marginStatus: "四周切缘阴性",
        vascularInvasion: "未见明确脉管侵犯"
      },
      remark: "患者既往有萎缩性胃炎病史，建议结合临床随访。"
    },
    "P-240617-02": {
      microscopy: "穿刺组织见异型细胞呈腺管样排列，核大深染，核仁明显，间质纤维化伴炎细胞浸润。",
      diagnosis: "肺腺癌可能性大，待免疫组化TTF-1、Napsin-A、CK7确认分型及来源。",
      structured: {
        tumorSize: "穿刺组织长约0.5cm",
        invasionDepth: "穿刺标本无法评估",
        marginStatus: "不适用",
        vascularInvasion: "待评估"
      },
      remark: "请加做免疫组化panel：TTF-1、Napsin-A、CK7、CK20、P40。"
    },
    "P-240617-03": {
      microscopy: "息肉样病变，腺体呈管状及绒毛状增生，上皮细胞轻度异型，基底部切缘可见少量异型腺体。",
      diagnosis: "管状绒毛状腺瘤伴低级别上皮内瘤变，基底部切缘可疑阳性，建议内镜下追加治疗或密切随访。",
      structured: {
        tumorSize: "1.2cm × 1.0cm × 0.4cm",
        invasionDepth: "局限于黏膜层",
        marginStatus: "基底部切缘可疑阳性",
        vascularInvasion: "未见脉管侵犯"
      },
      remark: ""
    }
  } as Record<string, CaseDetail>,
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

type RecordRow = [string, string, string, string, string, string];
type ReadonlyRecordRow = readonly [string, string, string, string, string, string];

const stainOptions = ["HE", "IHC", "特殊染色"] as const;
const priorityOptions = ["高", "中", "低"] as const;
const reviewOptions = ["待复核", "已初筛", "待补充"] as const;
const defaultForm: RecordRow = ["", "", "HE", "中", "", "待复核"];

const emptyCaseDetail: CaseDetail = {
  microscopy: "",
  diagnosis: "",
  structured: {
    tumorSize: "",
    invasionDepth: "",
    marginStatus: "",
    vascularInvasion: ""
  },
  remark: ""
};

export default function App() {
  const [filter, setFilter] = useState<string>(project.filters[0]);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [records, setRecords] = useState<ReadonlyRecordRow[]>([...project.records]);
  const [caseDetails, setCaseDetails] = useState<Record<string, CaseDetail>>({ ...project.caseDetails });
  const [formData, setFormData] = useState<RecordRow>([...defaultForm]);
  const [quickEntry, setQuickEntry] = useState<QuickEntryData>({ ...emptyQuickEntry });
  const [importErrors, setImportErrors] = useState<ImportError[]>([]);
  const [importSuccess, setImportSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateImportData = (data: unknown): ImportError[] => {
    const errors: ImportError[] = [];
    if (typeof data !== "object" || data === null) {
      errors.push({ field: "root", message: "JSON 数据格式错误，必须是对象" });
      return errors;
    }
    const obj = data as Record<string, unknown>;
    if (typeof obj.version !== "string") {
      errors.push({ field: "version", message: "缺少或格式错误：version 字段应为字符串" });
    }
    if (!Array.isArray(obj.records)) {
      errors.push({ field: "records", message: "缺少或格式错误：records 字段应为数组" });
    } else {
      obj.records.forEach((row: unknown, index: number) => {
        if (!Array.isArray(row) || row.length !== 6) {
          errors.push({ field: `records[${index}]`, message: `第 ${index + 1} 条记录格式错误，应为包含 6 个字段的数组` });
        } else {
          row.forEach((cell: unknown, cellIndex: number) => {
            if (typeof cell !== "string") {
              errors.push({ field: `records[${index}][${cellIndex}]`, message: `第 ${index + 1} 条记录第 ${cellIndex + 1} 个字段应为字符串` });
            }
          });
        }
      });
    }
    if (typeof obj.caseDetails !== "object" || obj.caseDetails === null || Array.isArray(obj.caseDetails)) {
      errors.push({ field: "caseDetails", message: "缺少或格式错误：caseDetails 字段应为对象" });
    } else {
      Object.entries(obj.caseDetails as Record<string, unknown>).forEach(([key, value]) => {
        const detail = value as Record<string, unknown>;
        if (typeof detail.microscopy !== "string") {
          errors.push({ field: `caseDetails.${key}.microscopy`, message: `${key} 缺少 microscopy 字段或格式错误` });
        }
        if (typeof detail.diagnosis !== "string") {
          errors.push({ field: `caseDetails.${key}.diagnosis`, message: `${key} 缺少 diagnosis 字段或格式错误` });
        }
        if (typeof detail.structured !== "object" || detail.structured === null) {
          errors.push({ field: `caseDetails.${key}.structured`, message: `${key} 缺少 structured 字段或格式错误` });
        } else {
          const structured = detail.structured as Record<string, unknown>;
          if (typeof structured.tumorSize !== "string") {
            errors.push({ field: `caseDetails.${key}.structured.tumorSize`, message: `${key} structured 缺少 tumorSize 字段` });
          }
          if (typeof structured.invasionDepth !== "string") {
            errors.push({ field: `caseDetails.${key}.structured.invasionDepth`, message: `${key} structured 缺少 invasionDepth 字段` });
          }
          if (typeof structured.marginStatus !== "string") {
            errors.push({ field: `caseDetails.${key}.structured.marginStatus`, message: `${key} structured 缺少 marginStatus 字段` });
          }
          if (typeof structured.vascularInvasion !== "string") {
            errors.push({ field: `caseDetails.${key}.structured.vascularInvasion`, message: `${key} structured 缺少 vascularInvasion 字段` });
          }
        }
        if (typeof detail.remark !== "string") {
          errors.push({ field: `caseDetails.${key}.remark`, message: `${key} 缺少 remark 字段或格式错误` });
        }
      });
    }
    if (typeof obj.quickEntry !== "object" || obj.quickEntry === null || Array.isArray(obj.quickEntry)) {
      errors.push({ field: "quickEntry", message: "缺少或格式错误：quickEntry 字段应为对象" });
    } else {
      const qe = obj.quickEntry as Record<string, unknown>;
      if (typeof qe.tumorSize !== "string") {
        errors.push({ field: "quickEntry.tumorSize", message: "quickEntry 缺少 tumorSize 字段" });
      }
      if (typeof qe.invasionDepth !== "string") {
        errors.push({ field: "quickEntry.invasionDepth", message: "quickEntry 缺少 invasionDepth 字段" });
      }
      if (typeof qe.marginStatus !== "string") {
        errors.push({ field: "quickEntry.marginStatus", message: "quickEntry 缺少 marginStatus 字段" });
      }
      if (typeof qe.ihcSupplement !== "string") {
        errors.push({ field: "quickEntry.ihcSupplement", message: "quickEntry 缺少 ihcSupplement 字段" });
      }
      if (typeof qe.remark !== "string") {
        errors.push({ field: "quickEntry.remark", message: "quickEntry 缺少 remark 字段" });
      }
    }
    return errors;
  };

  const handleExport = () => {
    const exportData: ExportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      records: [...records],
      caseDetails: { ...caseDetails },
      quickEntry: { ...quickEntry }
    };
    const jsonStr = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pathology-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportClick = () => {
    setImportErrors([]);
    setImportSuccess(false);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      let data: unknown;
      try {
        data = JSON.parse(text);
      } catch {
        setImportErrors([{ field: "root", message: "JSON 解析失败，请检查文件格式" }]);
        return;
      }
      const errors = validateImportData(data);
      if (errors.length > 0) {
        setImportErrors(errors);
        setImportSuccess(false);
        return;
      }
      const validData = data as ExportData;
      setRecords([...validData.records]);
      setCaseDetails({ ...validData.caseDetails });
      setQuickEntry({ ...validData.quickEntry });
      setImportErrors([]);
      setImportSuccess(true);
    } catch (err) {
      setImportErrors([{ field: "root", message: `文件读取失败：${err instanceof Error ? err.message : "未知错误"}` }]);
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const updateQuickEntry = (field: keyof QuickEntryData, value: string) => {
    setQuickEntry((prev) => ({ ...prev, [field]: value }));
  };

  const saveQuickEntry = () => {
    if (!selectedCaseId) {
      alert("请先在左侧列表选择一个病例");
      return;
    }
    setCaseDetails((prev) => ({
      ...prev,
      [selectedCaseId]: {
        ...(prev[selectedCaseId] ?? emptyCaseDetail),
        structured: {
          ...(prev[selectedCaseId]?.structured ?? emptyCaseDetail.structured),
          tumorSize: quickEntry.tumorSize,
          invasionDepth: quickEntry.invasionDepth,
          marginStatus: quickEntry.marginStatus
        },
        remark: quickEntry.remark
      }
    }));
    alert("已保存到当前选中病例的结构化信息中");
  };

  const visibleRecords = useMemo(() => {
    if (filter === project.filters[0]) return records;
    return records.filter((row) => {
      if (filter === "需复核") {
        return row[5] === "待复核" || row[5] === "待补充";
      }
      return row.join(" ").includes(filter);
    });
  }, [filter, records]);

  const displayRecords = visibleRecords.length > 0 ? visibleRecords : records;

  const selectedRecord = selectedCaseId ? records.find((row) => row[0] === selectedCaseId) ?? null : null;
  const selectedCaseDetail = selectedCaseId ? (caseDetails[selectedCaseId] ?? emptyCaseDetail) : emptyCaseDetail;

  const updateForm = (index: number, value: string) => {
    const next: RecordRow = [formData[0], formData[1], formData[2], formData[3], formData[4], formData[5]];
    next[index] = value;
    setFormData(next);
  };

  const submitCase = () => {
    if (!formData[0].trim()) {
      alert("请填写病例编号");
      return;
    }
    if (!formData[1].trim()) {
      alert("请填写取材部位");
      return;
    }
    if (!formData[4].trim()) {
      alert("请填写初筛标签");
      return;
    }
    const newRecord: ReadonlyRecordRow = [formData[0], formData[1], formData[2], formData[3], formData[4], formData[5]];
    setRecords((prev) => [...prev, newRecord]);
    setFormData([defaultForm[0], defaultForm[1], defaultForm[2], defaultForm[3], defaultForm[4], defaultForm[5]]);
  };

  const handleRowClick = (row: ReadonlyRecordRow) => {
    setSelectedCaseId(row[0]);
    setDrawerOpen(true);
  };

  const closeDrawer = () => {
    setDrawerOpen(false);
  };

  const updateRemark = (value: string) => {
    if (!selectedCaseId) return;
    setCaseDetails((prev) => ({
      ...prev,
      [selectedCaseId]: {
        ...(prev[selectedCaseId] ?? emptyCaseDetail),
        remark: value
      }
    }));
  };

  const updateStructuredField = (field: keyof CaseDetail["structured"], value: string) => {
    if (!selectedCaseId) return;
    setCaseDetails((prev) => ({
      ...prev,
      [selectedCaseId]: {
        ...(prev[selectedCaseId] ?? emptyCaseDetail),
        structured: {
          ...(prev[selectedCaseId]?.structured ?? emptyCaseDetail.structured),
          [field]: value
        }
      }
    }));
  };

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
                {displayRecords.length > 0 ? (
                  displayRecords.map((row, index) => (
                    <tr
                      className={selectedCaseId === row[0] ? "selected" : ""}
                      key={row.join("-")}
                      onClick={() => handleRowClick(row)}
                    >
                      {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={project.fields.length} style={{ textAlign: "center", padding: "24px", color: "#6b7280" }}>
                      暂无记录
                    </td>
                  </tr>
                )}
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
            <h2>病例快速建档</h2>
            <div className="form-grid">
              <label>病例编号
                <input value={formData[0]} placeholder="如 P-240617-04" onChange={(e) => updateForm(0, e.target.value)} />
              </label>
              <label>取材部位
                <input value={formData[1]} placeholder="如 胃窦活检" onChange={(e) => updateForm(1, e.target.value)} />
              </label>
              <label>染色类型
                <select value={formData[2]} onChange={(e) => updateForm(2, e.target.value)}>
                  {stainOptions.map((opt) => <option value={opt} key={opt}>{opt}</option>)}
                </select>
              </label>
              <label>优先级
                <select value={formData[3]} onChange={(e) => updateForm(3, e.target.value)}>
                  {priorityOptions.map((opt) => <option value={opt} key={opt}>{opt}</option>)}
                </select>
              </label>
              <label style={{ gridColumn: "1 / -1" }}>初筛标签
                <input value={formData[4]} placeholder="如 腺体异型增生" onChange={(e) => updateForm(4, e.target.value)} />
              </label>
              <label style={{ gridColumn: "1 / -1" }}>复核状态
                <select value={formData[5]} onChange={(e) => updateForm(5, e.target.value)}>
                  {reviewOptions.map((opt) => <option value={opt} key={opt}>{opt}</option>)}
                </select>
              </label>
            </div>
            <div className="actions">
              <button className="primary" onClick={submitCase}>提交建档</button>
              <button className="secondary" onClick={() => setFormData([...defaultForm])}>重置</button>
            </div>
          </section>

          <section className="panel">
            <h2>快速录入</h2>
            <div className="form-grid">
              <label>肿瘤大小
                <input
                  value={quickEntry.tumorSize}
                  placeholder="填写肿瘤大小"
                  onChange={(e) => updateQuickEntry("tumorSize", e.target.value)}
                />
              </label>
              <label>浸润深度
                <input
                  value={quickEntry.invasionDepth}
                  placeholder="填写浸润深度"
                  onChange={(e) => updateQuickEntry("invasionDepth", e.target.value)}
                />
              </label>
              <label>切缘状态
                <input
                  value={quickEntry.marginStatus}
                  placeholder="填写切缘状态"
                  onChange={(e) => updateQuickEntry("marginStatus", e.target.value)}
                />
              </label>
              <label>是否补做免疫组化
                <input
                  value={quickEntry.ihcSupplement}
                  placeholder="填写是否补做免疫组化"
                  onChange={(e) => updateQuickEntry("ihcSupplement", e.target.value)}
                />
              </label>
              <textarea
                placeholder="补充专业备注"
                value={quickEntry.remark}
                onChange={(e) => updateQuickEntry("remark", e.target.value)}
              />
            </div>
            <div className="actions">
              <button className="primary" onClick={saveQuickEntry}>保存记录</button>
            </div>
          </section>

          <section className="panel">
            <h2>本地 JSON 导入导出</h2>
            <p className="mini-note">
              将病例列表、详情记录和快速录入内容导出为 JSON 文件，或选择 JSON 文件导入并替换当前数据。
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              style={{ display: "none" }}
              onChange={handleFileChange}
            />
            {importSuccess && (
              <div className="success-message">
                ✓ 数据导入成功，已替换当前页面数据
              </div>
            )}
            {importErrors.length > 0 && (
              <div className="error-panel">
                <div className="error-title">导入失败，存在以下字段问题：</div>
                <ul className="error-list">
                  {importErrors.map((err, idx) => (
                    <li key={idx}>
                      <span className="error-field">{err.field}</span>
                      <span className="error-text">{err.message}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <div className="actions">
              <button className="primary" onClick={handleExport}>导出 JSON</button>
              <button className="secondary" onClick={handleImportClick}>导入 JSON</button>
            </div>
          </section>
        </aside>
      </section>

      {drawerOpen && (
        <div className="drawer-overlay" onClick={closeDrawer}>
          <aside className="drawer" onClick={(e) => e.stopPropagation()}>
            <div className="drawer-header">
              <div>
                <h2>切片详情</h2>
                {selectedRecord && (
                  <p className="drawer-subtitle">
                    {selectedRecord[0]} · {selectedRecord[1]}
                  </p>
                )}
              </div>
              <button className="drawer-close" onClick={closeDrawer} aria-label="关闭">
                ×
              </button>
            </div>

            <div className="drawer-body">
              {selectedRecord ? (
                <>
                  <section className="panel">
                    <h3>病例基础信息</h3>
                    <div className="info-grid">
                      <div className="info-item">
                        <span className="info-label">病例编号</span>
                        <span className="info-value">{selectedRecord[0]}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">取材部位</span>
                        <span className="info-value">{selectedRecord[1]}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">染色类型</span>
                        <span className="info-value">
                          <span className="tag">{selectedRecord[2]}</span>
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">优先级</span>
                        <span className="info-value">
                          <span className={"priority-tag priority-" + selectedRecord[3]}>{selectedRecord[3]}</span>
                        </span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">初筛标签</span>
                        <span className="info-value">{selectedRecord[4]}</span>
                      </div>
                      <div className="info-item">
                        <span className="info-label">复核状态</span>
                        <span className="info-value">
                          <span className="review-tag">{selectedRecord[5]}</span>
                        </span>
                      </div>
                    </div>
                  </section>

                  <section className="panel">
                    <h3>镜下所见</h3>
                    <div className="detail-item">
                      <p>{selectedCaseDetail.microscopy || "暂无镜下所见描述"}</p>
                    </div>
                  </section>

                  <section className="panel">
                    <h3>疑似诊断</h3>
                    <div className="detail-item diagnosis-item">
                      <p>{selectedCaseDetail.diagnosis || "暂无疑似诊断描述"}</p>
                    </div>
                  </section>

                  <section className="panel">
                    <h3>结构化要素</h3>
                    <div className="form-grid">
                      <label>
                        肿瘤大小
                        <input
                          value={selectedCaseDetail.structured.tumorSize}
                          placeholder="填写肿瘤大小"
                          onChange={(e) => updateStructuredField("tumorSize", e.target.value)}
                        />
                      </label>
                      <label>
                        浸润深度
                        <input
                          value={selectedCaseDetail.structured.invasionDepth}
                          placeholder="填写浸润深度"
                          onChange={(e) => updateStructuredField("invasionDepth", e.target.value)}
                        />
                      </label>
                      <label>
                        切缘状态
                        <input
                          value={selectedCaseDetail.structured.marginStatus}
                          placeholder="填写切缘状态"
                          onChange={(e) => updateStructuredField("marginStatus", e.target.value)}
                        />
                      </label>
                      <label>
                        脉管侵犯
                        <input
                          value={selectedCaseDetail.structured.vascularInvasion}
                          placeholder="填写脉管侵犯情况"
                          onChange={(e) => updateStructuredField("vascularInvasion", e.target.value)}
                        />
                      </label>
                    </div>
                  </section>

                  <section className="panel">
                    <h3>备注</h3>
                    <textarea
                      className="remark-textarea"
                      placeholder="请输入备注信息..."
                      value={selectedCaseDetail.remark}
                      onChange={(e) => updateRemark(e.target.value)}
                    />
                    <div className="actions">
                      <button className="primary">保存备注</button>
                      <button className="secondary" onClick={() => updateRemark("")}>清空</button>
                    </div>
                  </section>
                </>
              ) : (
                <section className="panel">
                  <p style={{ textAlign: "center", color: "#6b7280", padding: "24px" }}>
                    未选中有效病例
                  </p>
                </section>
              )}
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}
