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
    const PLUGIN_SEARCH = "simple-search";
    const LOCAL_FETCH = "http";

    const en = {
      title: "Web search",
      description: "Model API search, or local Tavily then Bing.",
      "mode.label": "Search backend",
      "mode.model": "Model API search",
      "mode.tavily": "Tavily + Bing",
      "mode.hint.model":
        "Search runs on the model API (web_search / web_search_options). The local web_search function tool is hidden so the model does not search twice.",
      "mode.hint.tavily":
        "The model calls web_search. Tavily runs first (API key, or keyless if empty), then Bing.",
      "key.label": "Tavily API key",
      "key.placeholder": "Optional. Empty uses Tavily keyless.",
      "key.hint": "Used only in Tavily + Bing mode. Also reads TAVILY_API_KEY.",
      unavailable: "This plugin is not loaded, so it cannot be configured right now.",
      readOnly: "This deployment stores settings read-only.",
      saveFailed: "The deployment did not accept these values; they were left for you to correct.",
      save: "Save",
      saving: "Saving…",
    };
    const zh = {
      title: "网页搜索",
      description: "模型端搜索，或本机 Tavily + Bing。",
      "mode.label": "搜索后端",
      "mode.model": "模型端搜索",
      "mode.tavily": "Tavily + Bing",
      "mode.hint.model":
        "由模型接口提供联网搜索（web_search / web_search_options）。本机 web_search 函数工具不交给模型，避免搜两次。",
      "mode.hint.tavily":
        "模型调用 web_search。先走 Tavily（有 key 用账号，留空则 keyless），失败再 Bing。",
      "key.label": "Tavily API key",
      "key.placeholder": "可选。留空则走 Tavily keyless。",
      "key.hint": "仅 Tavily + Bing 模式使用。也会读取环境变量 TAVILY_API_KEY。",
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

    function settingsForm(pluginScope, webScope) {
      const plugin = new primitives.SettingsFormModel(pluginScope, [
        searchModeField(),
        tavilyKeyField(),
      ]);
      const web =
        webScope === undefined
          ? undefined
          : new primitives.SettingsFormModel(webScope, [
              primitives.settingsTextField("searchProvider"),
              primitives.settingsTextField("fetchProvider"),
            ]);
      if (web !== undefined) {
        if (web.field("searchProvider").text !== PLUGIN_SEARCH) {
          web.actions().edit("searchProvider", PLUGIN_SEARCH);
        }
        if (web.field("fetchProvider").text !== LOCAL_FETCH) {
          web.actions().edit("fetchProvider", LOCAL_FETCH);
        }
      }
      const store = plugin.bind(() => {
        const webShell = web?.shell();
        const pluginShell = plugin.shell();
        const modeText = plugin.field("searchMode").text;
        return {
          ...pluginShell,
          dirty: pluginShell.dirty || Boolean(webShell?.dirty),
          invalid: pluginShell.invalid || Boolean(webShell?.invalid),
          saving: pluginShell.saving || Boolean(webShell?.saving),
          failed: pluginShell.failed || Boolean(webShell?.failed),
          writable: pluginShell.writable && (webShell === undefined || webShell.writable),
          searchMode: modeText === "tavily" ? "tavily" : "model",
          tavilyApiKey: plugin.field("tavilyApiKey").text ?? "",
        };
      });
      const pluginActions = plugin.actions();
      const actions = {
        ...pluginActions,
        async save() {
          await pluginActions.save();
          if (plugin.shell().failed) return;
          if (web !== undefined && web.shell().dirty) await web.save();
        },
        discard() {
          pluginActions.discard();
          web?.actions().discard();
        },
      };
      return { plugin, web, store, actions };
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
        let webScope;
        try {
          webScope = ctx.configForms.get("web");
        } catch {
          webScope = undefined;
        }
        const { plugin, web, store, actions } = settingsForm(
          ctx.configForms.get(SETTINGS_ENTRY_ID),
          webScope,
        );
        ctx.effect(() => () => {
          plugin.dispose();
          web?.dispose();
        }, "dsh-plugin-search settings form");
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
