# dsh-plugin-search

搜索和抓取各一个开关，逻辑相同：**开 = 插件，关 = DeepSeek**。

- 搜索开：屏蔽 DeepSeek 搜索，给 magpie 的 Chat Completions 加上 `web_search_options: {}`
- 抓取开：屏蔽 DeepSeek 抓取，本机 HTTP 直连，和 Claude Code 的 WebFetch 一样

设置卡在 **插件页本包**，和 `dsh-rewind-plugin` 一样。保存后立刻生效。

`inject: [web]` 是 Cordis 服务 `ctx.web`，Desktop 和 Web 都能装。装到你正在跑的 profile。

## 安装

这台 DSH Desktop 用 `desktop` profile：

```powershell
dsh plugin --profile desktop add C:\Users\Fan\Desktop\dsh-plugin-search
```

`dsh web` 则用 `--profile web`。装完重启，打开 **插件 → dsh-plugin-search**。

## 设置卡

| 开关 | 关 | 开 |
|---|---|---|
| 搜索 | `deepseek-search-api` | `web_search_options`（屏蔽 DeepSeek 搜索，隐藏 DSH 的 `web_search` 工具） |
| 抓取 | `deepseek-fetch-api` | `http` 本机直连（屏蔽 DeepSeek 抓取） |

开搜索时 pin `searchProvider: simple-search`，该 provider 的 `ready()` 为 false，所以 `dsh-tool-web` 不会把函数工具 `web_search` 交给模型。关搜索时 pin `deepseek-search-api`，并且不再往请求里写 `web_search_options`。

保存时同时写入本插件 config 和 `web` 行的 `searchProvider` / `fetchProvider`。patch 整段替换，两字段必须一起在。

默认 pin：

```yaml
- id: web
  config:
    searchProvider: simple-search
    fetchProvider: http
- id: web-search-deepseek
  disabled: true
```

`web-deepseek-api` 保持加载，两个开关关掉时才能回到 DeepSeek。默认 pin 插件侧，所以不会出现 `deepseek-fetch-api, http` 双 provider 报错。

要整包屏蔽 DeepSeek Fetch，再加：

```yaml
- id: web-deepseek-api
  disabled: true
```

这时抓取开关的 DeepSeek 一侧会变成“已配置但未注册”。

## 不要做

- 不要只改 `searchProvider` 不写 `fetchProvider`
- 不要再依赖 `TAVILY_API_KEY`

## License

MIT
