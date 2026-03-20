# 命中注定的离别 - 技术框架冻结文档

## 1) 分层架构与模块边界

- 展示层：`src/app/*` 页面（`/login`、`/create`、`/dashboard`、`/simulation`、`/result`）
- API 层：`src/app/api/*`，统一承担鉴权、参数校验、错误映射
- 领域层：`src/lib/*`（`agent-factory`、`simulation-engine`、`novel-generator`、`comic-generator`、`prompts`、`llm-client`）
- 类型层：`src/types/index.ts`
- 状态层：Cookie（OAuth token / secondme_user_id）+ localStorage（profile/simulation）

## 2) 统一 API 契约

所有业务 API 返回：

```json
{
  "code": 0,
  "message": "ok",
  "data": {}
}
```

失败时：

```json
{
  "code": 1001,
  "message": "error message",
  "data": null
}
```

关键接口：

- `POST /api/destiny-profile`：生成命盘
- `POST /api/simulate`：三段式宿命推演
- `POST /api/novel`：小说生成
- `POST /api/comic-prompts`：漫画提示词
- `POST /api/generate-image`：图片生成
- `GET /api/zhihu-search?keyword=`：知乎建议
- `GET /api/secondme/profile`：SecondMe 用户资料

## 3) 阶段执行顺序与验收

1. 阶段 1（基础设施）
   - Next.js 14 + TypeScript + Tailwind + Shadcn 基础可运行
   - OAuth 登录可回调
2. 阶段 2（分身生成）
   - `/create` 可提交 MBTI/生日/出生地并展示命盘卡片
3. 阶段 3（A2A 推演）
   - `/simulation` 输出完整时间轴（初遇/冲突/离别）
4. 阶段 4（多模态）
   - `/result` 可展示小说、漫画提示词、图片
5. 阶段 5（知乎建议）
   - `/result` 底部展示 3 条建议
6. 阶段 6（冲刺优化）
   - 暗黑赛博风 UI、loading 骨架、错误兜底、首页行动按钮

## 4) Mock/降级策略（失败不阻断 Demo）

- LLM 不可用：回退到内置宿命文案（`fallbackText`）
- 图片不可用：返回占位图 URL
- 知乎接口不可用：返回 mock 建议列表
- 外部 API 超时：统一 try/catch 返回可读错误，前端继续可交互

## 5) 环境变量约定

- `SECONDME_CLIENT_ID`
- `SECONDME_CLIENT_SECRET`
- `SECONDME_REDIRECT_URI`
- `SECONDME_SCOPES`
- `SECONDME_API_BASE_URL`
- `SECONDME_OAUTH_URL`
- `OPENAI_API_KEY`（可选）
- `OPENAI_MODEL`（可选）
- `MINIMAX_API_KEY`（可选）
- `MINIMAX_GROUP_ID`（可选）
- `ZHIHU_API_BASE_URL`（可选）
- `ZHIHU_API_TOKEN`（可选）
