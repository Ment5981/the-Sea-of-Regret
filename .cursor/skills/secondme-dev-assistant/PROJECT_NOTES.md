# 本仓库与 Skill 通用示例的差异（命中注定的离别 / secondme-oauth-site）

官方 Skill 文档里的 Redirect 示例常为 `/api/auth/callback`，**本仓库实际路径为**：

```
/api/auth/secondme/callback
```

请在 **develop.second.me** 与 **`SECONDME_REDIRECT_URI`** 中使用完整 URL，例如：

- 本地：`http://localhost:3000/api/auth/secondme/callback`
- 生产：`https://<你的域名>/api/auth/secondme/callback`

相关代码：`src/lib/secondme.ts`、`src/app/api/auth/secondme/*`。

---

部署与环境变量清单见仓库根目录 **`docs/deploy-vercel.md`**。
