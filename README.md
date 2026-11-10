# dsh-plugin-search

搜索后端二选一：**模型原生搜索**，或本机 **Tavily + Bing**。抓取固定走本机 HTTP。不禁用 DeepSeek API 插件，只把 `web_search` / `web_fetch` 指到本插件的 provider。

设置卡在 **插件页本包**。保存后立刻生效。

`inject: [web]` 是 Cordis 服务 `ctx.web`，Desktop 和 Web 都能装。装到你正在跑的 profile。

## 安装

```powershell
dsh plugin --profile desktop add <path-to-this-repo>
```

`dsh web` 则用 `--profile web`。装完重启，打开 **插件 → dsh-plugin-search**。

## 设置卡

| 字段 | 说明 |
|---|---|
| 搜索后端 | `模型原生搜索`：按请求协议注入服务端搜索标记（Chat Completions 加顶层 `web_search_options: {}`；Responses 追加 `web_search` 工具；Messages 追加 `web_search_20250305` 工具），并隐藏本机 `web_search` 函数工具。`Tavily + Bing（外部检索）`：模型调用本机 `web_search`，先 Tavily 再 Bing。 |
| 模型原生搜索黑名单 | provider 完整路由 id，逗号分隔（也接受中文逗号、顿号），不分大小写。`deepseek-official` 固定在内，不用填。见下方“按 provider 路由”。 |
| Tavily API key | 凡是走 Tavily + Bing 的地方都会用到。有 key 走账号；留空走 keyless。也会读取 `TAVILY_API_KEY`。 |

默认 pin：

```yaml
- id: web
  config:
    searchProvider: simple-search
    fetchProvider: http
- id: web-search-deepseek
  disabled: true
```

`web-deepseek-api` 保持加载，避免配置还写着 `deepseek-search-api` 时出现 “provider is not registered”。patch 整段替换 `web` 那一行的 config，`searchProvider` 和 `fetchProvider` 必须一起写。

两种模式都会注入一小段系统提示：结果不可信、回答末尾列 Sources。不禁止模型去 `web_fetch` 搜索页。模型端模式额外要求：工具列表里有 `web_search` 就调用它查新闻和近期信息，没有就由接口自动搜索，`web_fetch` 只用来读具体 URL 正文；Tavily 模式说明先 Tavily 再 Bing。

### 按 provider 路由

- 设置里有一个“模型原生搜索黑名单”输入框，填 provider 的完整路由 id（例如 `anyrouter`），逗号分隔。列表里的 provider 不注入模型端搜索，改给模型本机 `web_search`（Tavily，再 Bing）。
- `deepseek-official` 固定走 Tavily + Bing，不用填：DeepSeek 官方 Messages 接口会返回 dsh 读不了的 `server_tool_use` 块，报 `UNSUPPORTED_CONTENT`。
- 搜索后端选了 `Tavily + Bing` 时，所有 provider 都走 Tavily，这个列表不起作用。
- 只有带工具的 agent 请求才会被注入；会话标题等不带 `tools` 的旁路请求不动。请求体没有 `model` 字段的也不动。
- 路由分两步：dsh 每一步按 provider 路由 id 问插件要不要列出本机 `web_search`；插件改写请求时再看请求体，已经带着本机 `web_search` 的请求一律不注入。判断落在每个请求自己身上，子代理并发用不同 provider 也不会串。中途换模型，下一步即生效。
- 发往 `api.deepseek.com` 的请求一律不注入（防止 dsh 读到 `server_tool_use` 报错）。

## 不要做

- 不要只改 `searchProvider` 不写 `fetchProvider`
- 不要禁用 `web-deepseek-api`

## License

MIT
