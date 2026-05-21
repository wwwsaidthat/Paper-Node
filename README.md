# Paper Globe（论文卡片库 + 主题图谱）

用“论文卡片模板”沉淀阅读笔记，并用 2D 关系图把同一方向下的论文按关系连成网。支持本地保存、导入导出、GitHub Pages 部署。

## 本地运行

```bash
npm install
npm run dev
```

## 数据与卡片

- 一张卡片是一条 JSON 数据（默认保存在浏览器 localStorage）
- 顶部支持导入/导出 JSON，便于批量管理与迁移
- 种子数据文件：`src/papers/seed.json`
- 首次打开会用 seed 初始化；如果你之前已经用过，浏览器缓存会优先生效
  - 重新用 seed 初始化：在浏览器控制台执行 `localStorage.removeItem('paper-cards.v1'); location.reload()`

## 关系（relations）结构

旧版本的 `relatedPaperIds: string[]` 已升级为更强的关系结构：

```json
"relations": [
  { "toId": "seed-mrl-1", "type": "combine", "note": "把它的方法模块合并进来" },
  { "toId": "seed-mrl-2", "type": "improve", "note": "在 XX 指标上改进" }
]
```

- `toId`：目标论文的 `id`
- `type`：关系类型
- `note`：备注（可选）

支持的 `type`：

- `related`：相关
- `combine`：结合
- `improve`：改进
- `compare`：对比
- `baseline`：基线
- `extend`：延续/拓展
- `cite`：引用

可视化处理：

- 图上的连线会按关系类型显示不同颜色
- `improve/extend/cite` 会显示箭头（表示方向）

兼容性：

- 仍兼容旧字段 `relatedPaperIds`（会自动映射为 `type: "related"`）

## 编辑与展示

- 点击图节点：节点旁边会出现简要解释（标题 + 一句话）
- 右侧面板：
  - 支持“叠加”多个已选卡片（可折叠/移除/清空）
  - 额外提供“论文详情（文本）”大文本框，方便复制整理

## GitHub Pages 部署

仓库已包含 GitHub Actions 工作流，推送到 `main` 后会自动构建并发布到 Pages。
