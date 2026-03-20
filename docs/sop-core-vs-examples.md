# SOP：核心流程 vs 示例/占位

本文区分 **产品必选链路（Core）** 与 **可替换实现 / 演示占位（Examples）**，便于评委与维护者对齐边界。

## Core（核心）

| 阶段 | 产物 | 说明 |
|------|------|------|
| 觉醒 | `UserAwakeningInput` → `TwinPersonaReport` + `DestinyProfile` | 八字占位引擎可替换为真排盘；**接口契约**稳定。 |
| 广场 | Discover / 邀请房 / `PlazaMatchPayload` | 第三方 URL 与字段以环境变量为准；失败时 Mock 列表。 |
| 推演 | `SimulationResult` 三合三离 | 三轮 `StoryRound` + 本互变综错槽 + A2A；`events` 为兼容导出。 |
| 多模态 | 长篇小说 + 九帧 prompt + 生图 | 以 `simulation` 为输入；长度与九宫格为验收点。 |
| 复盘 | 理性报告 + 终局赠言 | 知乎向理性文风；轮回为 **可选**（`ENABLE_REINCARNATION`）。 |

## Examples / 占位（可替换）

- **八字**：`bazi-engine.ts` 哈希占位，非真四柱。
- **Discover**：HTTP 失败 → 本地 `MatchCandidate` Mock。
- **DEMO_MODE**：跳过外部 LLM/生图，读 `demo-data.ts`。
- **知乎**：未配置 `ZHIHU_API_*` → 固定 Mock 条目。
- **生图**：`DEMO_MODE` 或缺 Key → Unsplash 占位图重复。

## 计分对齐提示

- **A2A**：`StoryRound.a2aTurns` 双 Agent 轮次为评委可见证据链。
- **OAuth**：与 SecondMe 登录、广场 Discover 授权一致即可；具体 API 路径以官方更新为准。
