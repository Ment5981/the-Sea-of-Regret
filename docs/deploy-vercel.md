# 生产环境部署指南（Vercel + SecondMe）

面向 **`secondme-oauth-site`**（Next.js 14 App Router）。按顺序完成即可上线。

---

## 一、上线前检查清单

- [ ] 代码已提交到 **Git**（GitHub / GitLab / Bitbucket）
- [ ] 本地 **`npm run build`** 能通过（可选但强烈建议）
- [ ] 已在 [develop.second.me](https://develop.second.me) 创建应用，并持有 **Client ID**、**Client Secret**
- [ ] 已确定生产域名，例如：`https://你的项目.vercel.app` 或自定义域名

---

## 二、在 SecondMe 开发者后台配置 OAuth（必做）

生产环境的 **回调地址** 必须与代码、环境变量 **完全一致**。

**不要**填成站点首页（如 `https://xxx.vercel.app/` 或 `https://xxx.vercel.app`）。若只填根路径，授权后会回到 `/?code=...`，无法换 token，首页会一直显示「尚未登录」。正确路径末尾必须是 **`/api/auth/secondme/callback`**。

### 1. 回调路径（本项目固定）

```
https://<你的域名>/api/auth/secondme/callback
```

示例：

- `https://secondme-oauth-site.vercel.app/api/auth/secondme/callback`
- `https://mingding.aibuild.com/api/auth/secondme/callback`（自定义域）

### 2. 在 develop.second.me 中操作

1. 打开应用 → **OAuth / 重定向 URI** 配置  
2. **新增** 上述生产 URL（保留本地开发 URL 也可：`http://localhost:3000/api/auth/secondme/callback`）  
3. **Scope** 至少包含项目使用的范围（默认 **`user.info`**，与 `SECONDME_SCOPES` 一致）

### 3. 与 Vercel 环境变量对应

部署到 Vercel 后，必须设置：

```env
SECONDME_REDIRECT_URI=https://<你的域名>/api/auth/secondme/callback
```

**注意**：`SECONDME_OAUTH_URL` 的用法是 `getSecondMeOAuthAuthorizeUrl` 拼接 query，**不要**在末尾加 `/authorize`（见 `src/lib/secondme.ts`）。

---

## 三、将代码推送到 Git

```bash
cd d:\home\workspace\secondme-oauth-site
git init   # 若尚未初始化
git add .
git commit -m "chore: prepare production deploy"
```

在 GitHub 新建仓库后：

```bash
git remote add origin https://github.com/<你的用户>/<仓库名>.git
git branch -M main
git push -u origin main
```

---

## 四、在 Vercel 导入项目

1. 打开 [vercel.com](https://vercel.com) → 登录  
2. **Add New → Project** → Import 你的 Git 仓库  
3. **Framework Preset**：Next.js（自动检测）  
4. **Root Directory**：若仓库根目录就是本项目，保持默认  
5. **Build Command**：`npm run build`（默认）  
6. **Output**：Next.js 默认即可  

先不要点 Deploy，先配置 **Environment Variables**（见下一节）。

---

## 五、Vercel 环境变量（必填与建议）

在 **Project → Settings → Environment Variables** 中配置。  
Production / Preview 建议：**Production 用正式密钥；Preview 可单独一套或复用（注意 OAuth 回调 URL 是否匹配）**。

### 必填（SecondMe OAuth）

| 变量名 | 说明 |
|--------|------|
| `SECONDME_CLIENT_ID` | 应用 Client ID |
| `SECONDME_CLIENT_SECRET` | Client Secret |
| `SECONDME_REDIRECT_URI` | **生产完整回调 URL**，如 `https://xxx.vercel.app/api/auth/secondme/callback` |
| `SECONDME_SCOPES` | 如 `user.info` |

### 通常保持默认（与代码一致）

| 变量名 | 示例值 |
|--------|--------|
| `SECONDME_API_BASE_URL` | `https://api.mindverse.com/gate/lab` |
| `SECONDME_OAUTH_URL` | `https://go.second.me/oauth/` |

### 可选（功能开关）

| 变量名 | 说明 |
|--------|------|
| `SECONDME_DISCOVER_BASE_URL` | 广场 Discover 网关，按文档 |
| `LLM_PROVIDER` | `minimax` 或 `openai` |
| `MINIMAX_API_KEY` / `MINIMAX_GROUP_ID`（及 `MINIMAX_MODEL`） | 使用 MiniMax 时 |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | 使用 OpenAI 时 |
| `ZHIHU_*` | 知乎相关 |
| `ENABLE_REINCARNATION` | `true` 开启轮回接口 |
| `DEMO_MODE` | 生产环境建议 **`false` 或不设** |
| `NEXT_PUBLIC_DEMO_MODE` | 与前端展示条一致，生产建议 **`false`** |

保存后**重新部署**一次（Redeploy），使变量生效。

---

## 六、首次部署与域名

1. 部署完成后，Vercel 会分配域名，例如：`https://xxx.vercel.app`  
2. **把该域名拼进** `SECONDME_REDIRECT_URI` 与 SecondMe 后台的 Redirect URI，**三者一致**  
3. 若使用 **自定义域名**：在 Vercel → Domains 添加 DNS，再把 **https 自定义域** 写入 SecondMe 与 `SECONDME_REDIRECT_URI`  

---

## 七、上线后验证（5 分钟）

1. 打开 `https://<你的域名>/`  
2. 点击 **使用 SecondMe 登录** → 应跳转 SecondMe → 授权后回到 `/?login=success`  
3. 若出现 `invalid_oauth_state`：见下文 **§八.4**，按清单排查（多为「登录入口域名」与「回调域名」不一致）  
4. 若出现 `redirect_uri_mismatch`：检查 SecondMe 控制台与 `SECONDME_REDIRECT_URI` 是否**完全一致**（含 https、无末尾斜杠差异）  
5. 走一遍 `/create` → `/simulation` → `/result`（必要时先关 `DEMO_MODE` 测真实 LLM）

---

## 八、常见问题

### 1. OAuth 成功但本地逻辑报错

查看 Vercel **Function Logs**（Serverless 日志），确认 `exchangeCodeForToken` 未因 `SECONDME_REDIRECT_URI` 与 SecondMe 注册不一致而失败。

### 2. Preview 部署无法登录

Preview URL 每次不同，SecondMe 未登记该 URL 时会失败。可选：

- 仅在 **Production** 域名测 OAuth；或  
- 在 SecondMe 为每个 Preview 域名单独添加 Redirect（不推荐，繁琐）。

### 3. 生产环境 Cookie

回调里已使用 `secure: process.env.NODE_ENV === "production"`，Vercel 上为 **HTTPS**，Cookie 行为正常。

### 4. `invalid_oauth_state`（登录回调异常）

含义：回调时无法校验 OAuth `state`（见 `src/app/api/auth/secondme/callback/route.ts`）。

**当前实现**：`state` 使用 **`SECONDME_CLIENT_SECRET` 做 HMAC 签名**（`src/lib/oauth-state.ts`），**不再依赖 Cookie** 比对，可避免部分环境下重定向后 Cookie 未带上导致的误报。请确保 Vercel 已配置 **`SECONDME_CLIENT_SECRET`** 且与 SecondMe 后台一致。

**旧版行为（Cookie）**：若仍失败，请检查是否混用域名 / 多标签页（见上表）。

**最常见原因（Vercel）：域名不一致**

| 情况 | 说明 |
|------|------|
| **入口 ≠ 回调** | 在 `https://preview-xxx.vercel.app` 点登录，Cookie 写在该预览域；但 `SECONDME_REDIRECT_URI` 配的是 `https://你的项目.vercel.app/...`，授权后回到**生产域**，读不到预览域的 Cookie → `invalid_oauth_state`。 |
| **www / 裸域混用** | 从 `www.example.com` 进站登录，回调却是 `example.com`（或相反），Cookie 域不同。 |

**处理步骤（按顺序试）**

1. **整段流程只用同一个域名**：浏览器地址栏从点「登录」到回到站点，主机名应一致（建议只用 **Production** 的 `https://xxx.vercel.app` 或你的自定义域测 OAuth）。  
2. **Vercel 环境变量** `SECONDME_REDIRECT_URI` 与 **SecondMe 后台** 里的重定向 URI **完全一致**，且与你在浏览器里访问的站点 **同协议、同主机**（`https` + 同一域名）。  
3. **单标签页**完成：先清站点 Cookie 或无痕窗口，只开一个标签，点一次登录，不要多开多个登录流程。  
4. 授权页不要停留过久（State Cookie 有效期约 30 分钟，超时需重新点登录）。  
5. 避免在 **第三方 App 内置浏览器**（部分机型会限制 Cookie）里测；用系统 Chrome/Safari/Edge。

若仅在 Preview 上测：要么在 SecondMe 为该 Preview 域名单独登记回调 + Vercel Preview 环境单独配 `SECONDME_REDIRECT_URI`，要么只在 Production 域名测登录。

---

## 九、提交应用 / 集成（黑客松）

- 应用信息、上架与 **integration** 审核流程见：  
  [develop.second.me](https://develop.second.me) 与仓库内  
  `.cursor/skills/secondme-dev-assistant/SKILL.md`  
- 将 **生产访问 URL**、**隐私说明**、**截图** 等按平台表单要求填写后提交审核。

---

## 十、快速命令备忘

```bash
# 本地构建
npm run build

# Vercel CLI（可选）
npx vercel login
npx vercel --prod
```

使用 CLI 时同样需在 Vercel 项目或 `vercel env` 中配置上述环境变量。
