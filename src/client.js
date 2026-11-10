window.__ModuleLoader__.load({
  id: "dsh-plugin-search",
  factory: (require) => {
    const jsxRuntime = require("react/jsx-runtime");
    const primitives = require("@deepseek-ai/dsh-client-ui-primitives");
    const jsx = jsxRuntime.jsx;
    const jsxs = jsxRuntime.jsxs;

    const name = "dsh-plugin-search";
    const inject = ["slots", "locale", "configForms"];
    const NS = "dsh-plugin-search";
    const SETTINGS_ENTRY_ID = "dsh-plugin-search";

    const en = {
      title: "Web search",
      description: "Model API search, or local Tavily then Bing.",
      "mode.label": "Search backend",
      "mode.model": "Model native search",
      "mode.tavily": "Tavily + Bing (external)",
      "mode.hint.model": "Uses the model's own web search.",
      "mode.hint.tavily": "Searches through a tool call. Tavily first, falling back to Bing on failure.",
      "key.label": "Tavily API Key",
      "key.placeholder": "Optional. Empty uses Tavily keyless.",
      "key.hint": "Also reads the TAVILY_API_KEY environment variable.",
      "providers.label": "Native search blocklist",
      "providers.placeholder": "e.g. provider_1,provider_2",
      "providers.hint":
        "Full provider route ids, separated by commas. Listed providers are forced to Tavily + Bing (deepseek-official is forced by default).",
      unavailable: "This plugin is not loaded, so it cannot be configured right now.",
      readOnly: "This deployment stores settings read-only.",
      saveFailed: "The deployment did not accept these values; they were left for you to correct.",
      save: "Save",
      saving: "Saving…",
    };
    const zh = {
      title: "网页搜索",
      description: "模型原生搜索，或 Tavily + Bing 外部检索。",
      "mode.label": "搜索后端",
      "mode.model": "模型原生搜索",
      "mode.tavily": "Tavily + Bing（外部检索）",
      "mode.hint.model": "使用模型自带的联网能力。",
      "mode.hint.tavily": "通过工具调用检索。优先使用 Tavily，失败时自动降级至 Bing。",
      "key.label": "Tavily API Key",
      "key.placeholder": "可选。留空则走 Tavily keyless。",
      "key.hint": "支持读取环境变量 TAVILY_API_KEY。",
      "providers.label": "模型原生搜索黑名单",
      "providers.placeholder": "例如：provider_1,provider_2",
      "providers.hint":
        "填写 Provider 完整路由 ID，多个以英文逗号分隔。名单内的 Provider 将强制走 Tavily + Bing（deepseek-official 已默认强制）。",
      unavailable: "该插件当前未加载，暂时无法配置。",
      readOnly: "本部署的设置为只读。",
      saveFailed: "本部署没有接受这些值，已保留供你修改。",
      save: "保存",
      saving: "保存中…",
    };

    const STYLE = `
.dsh-plugin-search-section {
  display: grid;
  gap: 6px;
  padding: 12px 0;
}
.dsh-plugin-search-label {
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary);
}
.dsh-plugin-search-select,
.dsh-plugin-search-input {
  width: 100%;
  max-width: 360px;
  box-sizing: border-box;
  padding: 6px 10px;
  font-size: 13px;
  line-height: 1.5;
  color: var(--dsw-alias-label-primary);
  background: var(--dsw-alias-bg-primary, transparent);
  border: 1px solid var(--dsw-alias-border-l2);
  border-radius: 8px;
}
.dsh-plugin-search-select:disabled,
.dsh-plugin-search-input:disabled {
  opacity: 0.6;
}
.dsh-plugin-search-hint {
  margin: 0;
  font-size: 12px;
  line-height: 1.5;
  color: var(--dsw-alias-label-tertiary);
}
.dsh-plugin-search-divider {
  border-top: 1px solid var(--dsw-alias-border-l2);
}
`;

    function formLabels(t) {
      return {
        unavailable: t("unavailable"),
        readOnly: t("readOnly"),
        saveFailed: t("saveFailed"),
        save: t("save"),
        saving: t("saving"),
      };
    }

    function searchModeField() {
      return {
        field: "searchMode",
        format: (value) => (value === "tavily" ? "tavily" : "model"),
        parse: (text) => ({ kind: "set", value: text === "tavily" ? "tavily" : "model" }),
      };
    }

    function tavilyKeyField() {
      return {
        field: "tavilyApiKey",
        format: (value) => (typeof value === "string" ? value : ""),
        parse: (text) => ({ kind: "set", value: typeof text === "string" ? text : "" }),
      };
    }

    function tavilyProvidersField() {
      return {
        field: "tavilyProviders",
        format: (value) => (typeof value === "string" ? value : ""),
        parse: (text) => ({ kind: "set", value: typeof text === "string" ? text : "" }),
      };
    }

    function settingsForm(pluginScope) {
      const plugin = new primitives.SettingsFormModel(pluginScope, [
        searchModeField(),
        tavilyProvidersField(),
        tavilyKeyField(),
      ]);
      const store = plugin.bind(() => {
        const pluginShell = plugin.shell();
        const modeText = plugin.field("searchMode").text;
        return {
          ...pluginShell,
          searchMode: modeText === "tavily" ? "tavily" : "model",
          tavilyProviders: plugin.field("tavilyProviders").text ?? "",
          tavilyApiKey: plugin.field("tavilyApiKey").text ?? "",
        };
      });
      return { plugin, store, actions: plugin.actions() };
    }

    function SettingsCard(props) {
      const { t, useSettingsCard } = props;
      const state = useSettingsCard((snapshot) => snapshot);
      if (props.view === "summary") return null;
      const disabled = !state.writable || state.saving;
      return jsxs(primitives.SettingsForm, {
        labels: formLabels(t),
        state,
        onSave: props.save,
        onDiscard: props.discard,
        children: [
          jsxs("div", {
            className: "dsh-plugin-search-section",
            children: [
              jsx("span", { className: "dsh-plugin-search-label", children: t("mode.label") }),
              jsxs("select", {
                className: "dsh-plugin-search-select",
                value: state.searchMode,
                disabled,
                "aria-label": t("mode.label"),
                onChange: (event) => props.edit("searchMode", event.target.value),
                children: [
                  jsx("option", { value: "model", children: t("mode.model") }),
                  jsx("option", { value: "tavily", children: t("mode.tavily") }),
                ],
              }),
              jsx("p", {
                className: "dsh-plugin-search-hint",
                children: t(state.searchMode === "tavily" ? "mode.hint.tavily" : "mode.hint.model"),
              }),
            ],
          }),
          jsx("div", { className: "dsh-plugin-search-divider" }),
          jsxs("div", {
            className: "dsh-plugin-search-section",
            children: [
              jsx("span", { className: "dsh-plugin-search-label", children: t("providers.label") }),
              jsx("input", {
                className: "dsh-plugin-search-input",
                type: "text",
                autoComplete: "off",
                spellCheck: false,
                value: state.tavilyProviders,
                placeholder: t("providers.placeholder"),
                disabled,
                "aria-label": t("providers.label"),
                onChange: (event) => props.edit("tavilyProviders", event.target.value),
              }),
              jsx("p", { className: "dsh-plugin-search-hint", children: t("providers.hint") }),
            ],
          }),
          jsx("div", { className: "dsh-plugin-search-divider" }),
          jsxs("div", {
            className: "dsh-plugin-search-section",
            children: [
              jsx("span", { className: "dsh-plugin-search-label", children: t("key.label") }),
              jsx("input", {
                className: "dsh-plugin-search-input",
                type: "password",
                autoComplete: "off",
                spellCheck: false,
                value: state.tavilyApiKey,
                placeholder: t("key.placeholder"),
                disabled,
                "aria-label": t("key.label"),
                onChange: (event) => props.edit("tavilyApiKey", event.target.value),
              }),
              jsx("p", { className: "dsh-plugin-search-hint", children: t("key.hint") }),
            ],
          }),
        ],
      });
    }

    function apply(ctx) {
      ctx.effect(function* () {
        yield ctx.locale.register(NS, { en, zh });
        const style = document.createElement("style");
        style.dataset.plugin = SETTINGS_ENTRY_ID;
        style.textContent = STYLE;
        document.head.appendChild(style);
        yield () => style.remove();
        const { plugin, store, actions } = settingsForm(ctx.configForms.get(SETTINGS_ENTRY_ID));
        ctx.effect(() => () => plugin.dispose(), "dsh-plugin-search settings form");
        yield ctx.slots.inject("plugins.bundle.config", () =>
          ctx.slots.register(
            {
              name: "plugins.bundle.config",
              key: SETTINGS_ENTRY_ID,
              locale: NS,
              inject: () => ({ hooks: { settingsCard: store }, ...actions }),
            },
            SettingsCard,
          ),
        );
      });
    }

    return { apply, inject, name };
  },
});
