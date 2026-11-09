# dsh-plugin-search

搜索后端二选一：**模型端搜索**，或本机 **Tavily + Bing**。抓取固定走本机 HTTP。不禁用 DeepSeek API 插件，只把 `web_search` / `web_fetch` 指到本插件的 provider。

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
| 搜索后端 | `模型端搜索`：给 Chat Completions 加上 `web_search_options: {}`，隐藏本机 `web_search` 函数工具。`Tavily + Bing`：模型调用本机 `web_search`，先 Tavily 再 Bing。 |
| Tavily API key | 仅 Tavily + Bing 模式使用。有 key 走账号；留空走 keyless。也会读取 `TAVILY_API_KEY`。 |

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

两种模式都会注入一小段系统提示：结果不可信、回答末尾列 Sources。不禁止模型去 `web_fetch` 搜索页。模型端模式额外说明搜索已由接口提供；Tavily 模式说明先 Tavily 再 Bing。

## 不要做

- 不要只改 `searchProvider` 不写 `fetchProvider`
- 不要禁用 `web-deepseek-api`

## License

MIT
