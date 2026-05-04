# bluff-code — 设计文档

> 本文为 [DESIGN.md](./DESIGN.md) 的中文翻译版。英文版为权威版本；如有歧义以英文为准。

> **状态：** 草案 v0.1 · 2026-05-03
> **负责人：** Lomnus AI
> **技术栈：** Bun + TypeScript + React + Ink（与 Claude Code 一致）

---

## 1. 概述

`bluff-code` 是一个终端 CLI 工具，模仿 AI 编程助手的视觉体验——流式 token 输出、脚本化的工具调用、加载动画、底部输入框，应有尽有——但背后没有任何模型。所有输出都由一个基于规则的引擎，从模板库和脚本化场景中确定性地生成。

整个产品是一个被严肃打磨过的玩笑：它必须经得起一眼之间的扫视，并扛过中等程度的细看。

---

## 2. 目标与非目标

### 目标

- **视觉拟真。** 一眼看去与真实的 Claude Code 难以区分。
- **零订阅成本。** 不需要 API key，不发起任何网络请求，可离线运行。
- **可信的动效。** 流式输出、抖动、加载动画、工具调用序列要让人觉得是真模型在运行，而不是按稿照念。
- **仓库感知。** 输出会引用用户工作目录里的真实文件，从而扛住路过同事的一瞥。
- **多种喜剧风格。** 从 v1 起就提供多种语气（"vibes"）。

### 非目标

- 不是 LLM 代理。我们从不调用任何模型。
- 不是代码修改工具。我们从不写入用户文件。（我们*读取*它们——见 §10。）
- 不是网络工具。无遥测、无网络请求、无身份认证。

---

## 3. 主要用例

我们针对用例 **(a)** 和 **(d)** 优化。其他用例顺带服务。

### (a) 咖啡店摸鱼 / 装忙人

用户希望终端*看起来*在认真编程，而其实他/她离开了座位、走神、或正被人盯着。设计含义：

- 必须能**长时间无输入运行** → 引入 Ambient 循环模式（§6.3）。
- 必须引用**本地真实文件**，扛住路过同事的一瞥（§10）。
- 必须**绝不阻塞**等待输入。
- `Ctrl+C` 退出要看起来优雅，不能像崩溃。

### (d) 喜剧 / 讽刺

用户想录视频片段、截图对话、或直播展示"看，我做了个假 AI"内容。设计含义：

- **Vibes** 是一等公民——`--vibe doomer` 之后梗会更好笑。
- 通过 seed 实现确定性，便于重复录制同一段镜头。
- 工具调用拟态必须高保真；微妙的"错位"细节（比如 "Reading… banana.ts"）反而能让讽刺更到位。

### 不覆盖的场景

- 我们不为"解释我真实的代码"这种无脚本实时使用做设计。这种场景需要真 LLM。如果用户想要真回答，应该用真 Claude。

---

## 4. 设计决策（已锁定的答案）

| # | 决策项 | 选择 |
|---|---|---|
| 1 | 主要用例 | (a) 咖啡店摸鱼 + (d) 喜剧/讽刺 |
| 2 | 运行模式 | 同时支持 REPL 和一次性模式，通过 CLI 参数切换；默认一次性。（外加 Ambient——见 §6.3） |
| 3 | 真实环境上下文 | **Heavy**（读取文件内容），带严格防护栏（§10） |
| 4 | 会话状态 | 单次 REPL 会话内**有状态** |
| 5 | 确定性 | 默认**随机化**；可通过 `--seed N` 指定种子 |
| 6 | 工具调用保真度 | **完全拟态**——Read / Grep / Edit / Bash 块，配加载动画与 ✓ 标记 |
| 7 | Vibes | v1 即提供一组 vibe 包（§9） |

---

## 5. 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          CLI Entry                              │
│  parses argv → picks mode (one-shot / REPL / ambient) + vibe    │
└──────────────────────────────┬──────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────┐
            ▼                  ▼                  ▼
       OneShot Mode        REPL Mode         Ambient Mode
            │                  │                  │
            └──────────────────┼──────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       Session State                             │
│  history · seen-files · prior-tools · seed · vibe               │
└──────────────────────────────┬──────────────────────────────────┘
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                          Director                               │
│  intent ← classify(input)                                       │
│  scenario ← pick(intent, state)                                 │
│  beats ← scenario.expand(repoContext, state, vibe)              │
└────────────┬─────────────────────────────────┬──────────────────┘
             │                                 │
             ▼                                 ▼
┌──────────────────────────┐      ┌────────────────────────────────┐
│     Repo Context         │      │       Vibe Pack                │
│  cwd files · git state · │      │  phrase pools · tone rules ·   │
│  read snippets (cached)  │      │  filler · openers · closers    │
│  ┌────────────────────┐  │      └────────────────────────────────┘
│  │ Safety Guardrails  │  │
│  └────────────────────┘  │
└──────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Renderer (Ink)                          │
│  StreamingText · ToolCallBlock · Spinner · PromptBox            │
│  + Pacing/Jitter engine                                         │
└─────────────────────────────────────────────────────────────────┘
```

### 组件职责

| 组件 | 职责 |
|---|---|
| **CLI Entry** | argv 解析、模式选择、vibe 选择、seed 注入 |
| **Modes**（运行模式） | 各模式的生命周期（单次响应 / 交互循环 / 环绕循环） |
| **Session State**（会话状态） | 内存中的轮次记录、文件引用、工具历史、RNG 种子 |
| **Director**（编排器） | 意图分类 → 场景选择 → 节拍序列 |
| **Scenarios**（场景） | 脚本化的剧情弧（debug-fix、explain、refactor 等），由上下文参数化 |
| **Beats**（节拍） | 原子单元：聊天、工具调用、停顿、请求权限等 |
| **Repo Context**（仓库上下文） | 对 cwd 文件 / git 状态的懒加载读取，受 Safety Guardrails 限制 |
| **Safety Guardrails**（安全防护栏） | 路径检查、密钥黑名单、大小上限、感知 gitignore |
| **Vibe Pack** | 短语池和语气规则，被每个聊天 beat 消费 |
| **Renderer**（渲染器） | Ink 组件 + token 流节奏控制 |

---

## 6. 运行模式

### 6.1 一次性模式（默认）

```bash
bluff "fix the auth bug in login flow"
```

- 跑完一个场景后退出。
- 适用于：脚本、截图、录像、README 演示。
- 多次调用之间不持久化状态。
- 流式输出到 stdout，可管道化（`bluff "..." | tee transcript.txt`）。

### 6.2 REPL 模式

```bash
bluff --repl
```

- 底部输入框（Ink 实现），上方显示滚动历史。
- 斜杠命令：`/clear`、`/vibe <name>`、`/seed <n>`、`/exit`、`/init`、`/plan`（仅装饰——见 §13）。
- 多轮对话，**有状态**（§11）。
- 适用于：直播 cosplay、喜剧节目、需要由用户驱动节奏的演示。

### 6.3 Ambient 模式（无参数）

```bash
bluff
```

- 不需要输入。无限循环跑脚本化场景，弧之间有真实的停顿。
- 从 cwd 拉真实文件路径，让每段弧看起来都是新工作。
- 设计目标：**咖啡店里离开电脑时**用。
- `Ctrl+C` 优雅退出，配一句假"会话已结束"提示。
- 待定问题（§14）：到底是独立模式，还是 `bluff --ambient` 在无输入时默认开启？目前设计为**无参数 = ambient**。

### 6.4 模式切换标志

| 标志 | 行为 |
|---|---|
| (无参数) | Ambient 循环 |
| `<prompt>` | 一次性 |
| `--repl`、`-i` | REPL |
| `--once <prompt>` | 显式一次性（与裸 prompt 等价） |
| `--ambient` | 显式 Ambient |
| `-C <path>`、`--cwd <path>` | 把 `<path>` 作为代码库根目录（默认：`process.cwd()`） |
| `--vibe <name>` | 选择 vibe 包（默认：`default`） |
| `--seed <n>` | 固定 RNG 以复现输出 |
| `--sandboxed` | 禁用文件读取（heavy → 无） |
| `--no-color` | 纯文本输出 |
| `--version`、`-v` | 打印版本 |
| `--help`、`-h` | 帮助 |

---

## 7. 数据模型（高层）

下面是形状描述，不是实现细节。真实类型在代码中体现。

```ts
// 一个脚本化输出的原子单元。
type Beat =
  | { kind: 'chat',         text: string,   markdown?: boolean }
  | { kind: 'tool',         tool: ToolCall, render: ToolRender }
  | { kind: 'pause',        ms: number }
  | { kind: 'thinking',     label?: string,  ms: number }
  | { kind: 'ask',          question: string, fakeAnswer: string }
  | { kind: 'permission',   summary: string,  outcome: 'allow' | 'deny' }

type ToolCall =
  | { name: 'Read',   path: string }
  | { name: 'Grep',   pattern: string, glob?: string }
  | { name: 'Edit',   path: string, additions: number, removals: number }
  | { name: 'Bash',   cmd: string,  fakeOutput: string[] }
  | { name: 'Glob',   pattern: string }
  // …按需扩展

// 一段脚本化的弧；针对 context+state+vibe 展开为 beats。
type Scenario = {
  id: string                // 'debug-fix'、'explain-code' …
  match: (intent: Intent, ctx: RepoContext, state: SessionState) => number  // 评分
  expand: (ctx: RepoContext, state: SessionState, vibe: VibePack) => Beat[]
}

// 嗓音与语气。
type VibePack = {
  id: string
  openers:    Phrase[]
  fillers:    Phrase[]      // 流中填充语（如 "Looking at this…"）
  closers:    Phrase[]
  toolPreambles: Record<ToolCall['name'], Phrase[]>
  emphasis:   'plain' | 'enterprise' | 'doomer' | 'zen' | 'hype' | …
  jitter:     JitterCurve   // 与语气绑定的流式节奏（zen 慢且稀疏）
}

type Phrase = string | ((slots: Slots) => string)
type Slots  = { file?: string, symbol?: string, lang?: string, … }

// 单次会话内存。
type SessionState = {
  turns:     Turn[]
  seenFiles: Set<string>
  toolHistory: ToolCall[]
  vibe:      VibePack
  rng:       SeedableRNG
}

// Director 从输入推断的内容。
type Intent = {
  category: 'debug' | 'explain' | 'refactor' | 'add-feature' | 'review'
          | 'plan' | 'general'
  keywords: string[]
  fileHints: string[]   // 输入中提到的文件路径/名
}

// 懒加载的仓库事实。
type RepoContext = {
  cwd: string
  files: FileEntry[]            // path、size、ext、mtime
  git?: { branch, head, recentCommits, dirty }
  read: (path: string) => Promise<string | null>  // 受防护栏限制
  pickFiles: (n: number, opts?: PickOpts) => FileEntry[]
}
```

---

## 8. Director 与 Scenarios

### 8.1 意图分类（基于规则）

一个简单的关键词与模式匹配器。不用机器学习。

- 强关键词：`fix`、`bug`、`error` → `debug`
- `explain`、`what does`、`how does` → `explain`
- `refactor`、`clean up`、`extract` → `refactor`
- `add`、`implement`、`build` → `add-feature`
- `review`、`audit` → `review`
- `plan`、`design`、`architect` → `plan`
- 文件名提示：用户输入中匹配 `RepoContext.files` 中文件的 token 会成为 `fileHint`

如果都没有命中 → `general`（信息量低的兜底弧）。

### 8.2 场景库（v1 集合）

| Scenario | 触发条件 | Beats 草图 |
|---|---|---|
| `debug-fix` | `debug` 意图 | Read 可疑文件 → Grep 符号 → Read 相关文件 → Edit → Bash(test) → ✓ |
| `explain-code` | `explain` 意图 | Read 文件 → "这段代码是这样工作的……" 散文 → 引用行号 |
| `refactor` | `refactor` 意图 | Read → Grep usages → Edit（多文件） → Bash(test) → ✓ |
| `add-feature` | `add-feature` 意图 | 计划性散文 → Read 已有 → Edit（新文件） → Edit（接线） → Bash(test) → ✓ |
| `review` | `review` 意图 | Glob → Read 多个 → Markdown 项目化评审，附 file:line 引用 |
| `plan` | `plan` 意图 | Markdown 阶段性方案；不修改 |
| `general` | 兜底 / ambient | Read + 聊天的轻混合，不修改 |
| `failed-test-then-fix` | ambient 中随机出现 | Bash(test) → 红色输出 → Read → Edit → Bash(test) → ✓ |
| `cargo-cult-debug` | （只在 doomer vibe 下） | Edit、Bash、Edit、Bash……永远不收敛 |

场景通过 `match()` 给输入打分；Director 选最高分。状态化的微调：最近用过的场景会有小幅扣分，避免在 REPL/ambient 中重复同一段弧。

### 8.3 Beat 组装规则

- 每个场景以来自 `vibe.openers` 的聊天 beat 开场。
- 工具 beat 前后用 `vibe.toolPreambles[toolName]` 包裹。
- beat 之间的停顿由 vibe 调优过的分布采样决定。
- 收尾来自 `vibe.closers`，可选附一行假总结。
- 所有自由文本都过一遍 slot-filler，注入从 `RepoContext` 拉取的真实文件路径、符号名、计数。

---

## 9. Vibe 系统

### 9.1 v1 vibes

| Vibe | 语气 | 开场示例 |
|---|---|---|
| `default` | 中性，模仿真实 Claude Code | "I'll take a look at this." |
| `enterprise` | 公司化、滴水不漏、流程感强 | "Happy to help. Per our coding standards, let me first survey the affected modules." |
| `doomer` | 黯淡、认命式的称职 | "Alright. This codebase is cursed but I'll try." |
| `zen` | 极简、像禅宗公案、惜字如金 | "Reading." |
| `hype-bro` | 咖啡因过量、感叹号狂魔 | "OKAY LET'S GOOO. This is going to be SO clean." |

第六个 vibe `intern`（盲目自信、偶尔搞笑出错）作为延展目标——喜剧效果好但短语创作难度高。

### 9.2 Vibe pack 结构

一个 vibe 是一个 TS 模块导出 `VibePack`。每个 pack 提供 openers、closers、fillers、tool preambles 的短语池，加上一条 `JitterCurve`，让流式输出感觉与语气匹配（zen 慢且稀疏；hype-bro 急促短停）。

### 9.3 创作指南

- 每个短语池至少 ≥5 个变体，避免明显重复。
- Slot-fill 占位符用 `{file}`、`{symbol}`、`{count}`、`{lang}`。
- 避免出现具体日期、品牌名、真实人物。

---

## 10. 仓库上下文引擎与安全

### 10.1 读取范围

**代码库根目录**默认为 `process.cwd()`；可通过 `-C <path>` / `--cwd <path>`
覆盖。下面所有读取都限定在该根目录范围内。

- **始终：** 根目录列表（一层 + 最多深度 3 的轻递归）。
- **始终：** git 状态，通过 `git rev-parse`、`git log -10`、`git status --porcelain`。
- **按需：** 文件*内容*，仅当某个场景需要嵌入真实片段或"读取"某文件时。

### 10.2 安全防护栏

由 `context/safety.ts` 强制执行的硬性规则：

1. **路径包含。** 解析后的真实路径必须位于 `cwd` 之内。不允许通过 symlink 逃逸。解析后不得包含 `..`。
2. **密钥黑名单**（按 glob 拒绝，大小写不敏感）：
   - `.env*`、`*.pem`、`*.key`、`id_rsa*`、`*.crt`、`*.p12`、`*.pfx`
   - `**/.ssh/**`、`**/.aws/**`、`**/.gnupg/**`、`**/.config/gh/**`
   - `**/credentials*`、`**/secrets*`、`**/*token*`、`**/*password*`
   - `**/.netrc`、`**/.npmrc`、`**/.pypirc`、`**/.docker/config.json`
3. **感知 gitignore。** 任何被 `.gitignore` 忽略的路径都跳过。
4. **大小上限。** 跳过任何 > 100 KB 的文件。
5. **跳过二进制。** 通过扩展名白名单检测（`.ts .tsx .js .jsx .py .rb .go .rs .java .kt .c .h .cpp .hpp .cs .swift .md .json .yaml .yml .toml .html .css .scss .sql .sh`）和快速 null-byte 嗅探。
6. **总预算。** 单次会话累计读取内容 ≤ 500 KB。一旦达到，`read()` 在本会话剩余时间返回 `null`，引擎静默切换到纯虚构内容。
7. **只读。** 引擎中没有 `write`、`unlink`、`chmod`、`exec` 路径。代码库对用户文件没有任何写 API。
8. **内容不出进程。** 读取的内容只用于喂给 slot-filler 和渲染输出。绝不持久化、绝不传输。
9. **可关闭。** `--sandboxed` 完全禁用文件读取（降级为纯虚构输出）。
10. **首次运行确认。** 在某目录首次调用时打印一行提示："bluff-code 会读取此目录下的文件以让输出更真实。`--sandboxed` 可禁用。同意？[Y/n]"——确认结果存入 `~/.config/bluff-code/acks.json`。

### 10.3 缓存

- 文件读取按会话缓存（每个文件最多读一次）。
- 目录列表按会话缓存。

---

## 11. 会话状态

仅在**单次 REPL 会话内**有状态。一次性模式和 ambient 模式的多次调用之间不持久化状态。

我们追踪：

- **轮次历史。** 每轮的用户输入 + 发出的 beat。用于避免场景重复，并支持回调式散文（"如我在 `auth.ts` 中提到的……"）。
- **已读文件。** 我们已经假装"读过"的文件；下一轮不会无端再假装读一遍。
- **工具历史。** 假工具调用的序列；影响避免哪些场景。
- **Vibe。** 在会话内保持，除非用 `/vibe <name>` 切换。
- **Seed。** RNG 种子，用于复现。

状态仅存在于内存。v1 不持久化到磁盘。

---

## 12. 节奏与抖动

真实的流式输出占了喜剧效果的一半。token 发射时机是建模的，不是简单随机。

- **token 间延迟**从每个 vibe 各自的分布中采样（均值、标准差、偶发的长停顿尖峰）。
- **工具调用时长**：加载动画展示一个采样时长（Read：0.2–0.6s；Grep：0.4–1.2s；Bash：0.8–4s；Edit：0.3–0.7s）。
- **beat 间停顿**：按 vibe 偏置采样。
- **退格痕迹**（可选，默认关闭）：偶尔擦掉再重打一个词，模拟"自我修正"。

校准目标：感觉接近 Sonnet/Opus 大约 40 tok/s 平均速率，带真实抖动。

---

## 13. 工具调用拟态

### 13.1 视觉格式

精确镜像 Claude Code 的方框风格：

```
● Read(src/auth/login.ts)
  ⎿  Read 142 lines

● Grep(pattern: "validateSession", glob: "**/*.ts")
  ⎿  Found 4 matches in 3 files

● Edit(src/auth/login.ts)
  ⎿  Updated src/auth/login.ts with 7 additions and 2 removals

● Bash(npm test -- auth)
  ⎿  PASS  src/__tests__/login.test.ts
       ✓ accepts valid credentials (14 ms)
       ✓ rejects expired sessions (8 ms)
     Tests: 2 passed, 2 total
```

### 13.2 假副作用

- **Read**：发出一个真实的行数（来自该文件的缓存读取）。
- **Grep**：发出一个合理的匹配数；如果有文件内容可用，挑选真实包含该模式的文件；否则编造合理的文件名。
- **Edit**：发出"X additions, Y removals"；用小数字（1–15）。**绝不真的修改文件。**
- **Bash**：对已知命令（`npm test`、`cargo test`、`go test`、`pytest`、`tsc --noEmit`、`git status`、`ls`）发出脚本化输出。其余回退到几个通用输出之一。
- **Glob**：发出 `RepoContext` 中真实匹配的路径。

### 13.3 装饰性斜杠命令（仅 REPL）

- `/init`——假装扫描仓库，输出一个假的 `CLAUDE.md` 计划。
- `/plan`——进入假的"plan mode"，输出 markdown 计划和假的批准提示。
- `/cd <path>`——切换本会话剩余时间的代码库根目录（真的）。
- `/clear`——清空滚动条（真的）。
- `/vibe <name>`——切换 vibe 包（真的）。
- `/seed <n>`——重设 RNG（真的）。
- `/exit`——退出。

---

## 14. 待定问题

实现前或实现中需要解决的问题。带严重程度标签。

| # | 问题 | 严重程度 |
|---|---|---|
| Q1 | 裸 `bluff` 应该是 ambient（当前设计）还是打印帮助？ | 中 |
| Q2 | 是否支持 `~/.config/bluff-code/config.toml` 配置默认 vibe / seed / sandboxed？ | 低 |
| Q3 | REPL 会话状态是否跨调用持久化到磁盘？ | 低（默认否） |
| Q4 | 主题/配色：完全镜像 Claude Code 的色板，还是有所区分？ | 低 |
| Q5 | Scenarios 的创作格式——纯 TS 代码还是 YAML+TS 混合？ | 中 |
| Q6 | `intern` vibe v1 出还是延后？ | 低 |
| Q7 | Markdown 渲染库——`marked-terminal` 还是自研？ | 中 |
| Q8 | 是否完全照抄 Claude Code 的 `● ` 项目符号，还是做一个法律层面更舒服的"近似但不同"？ | 中 |
| Q9 | 首次运行确认提示——必要还是烦人？ | 中 |
| Q10 | 分发：仅 npm 包、Bun 单二进制，还是两者皆有？ | 低 |

---

## 15. 路线图

| 版本 | 范围 |
|---|---|
| **v0.1** | 脚手架（✅ 已完成） |
| **v0.2** | 一次性模式端到端，**默认 vibe**，仅 `general` 场景，**沙箱**（无 FS 读取）。验证渲染管线 + 节奏引擎。 |
| **v0.3** | 工具调用拟态：Read、Grep、Edit、Bash 块。新增 `debug-fix`、`explain-code`、`add-feature` 场景。 |
| **v0.4** | 仓库上下文引擎 + 安全防护栏。工具调用中使用真实文件路径。首次运行确认提示。 |
| **v0.5** | REPL 模式 + 会话状态。斜杠命令（`/clear`、`/vibe`、`/seed`、`/exit`）。 |
| **v0.6** | Vibe 包：`enterprise`、`doomer`、`zen`、`hype-bro`。每 vibe 独立的节奏曲线。 |
| **v0.7** | Ambient 模式。`failed-test-then-fix`、`cargo-cult-debug` 场景。 |
| **v0.8** | 装饰性斜杠命令 `/init`、`/plan`。打磨、抖动校准。 |
| **v1.0** | 文档、分发（npm + bun 二进制）、演示 gif、发布。 |

---

## 16. 不在 v1 范围内

- 真 LLM 兜底（无 `--real` 标志）。
- 任何形式的网络调用。
- 语音输入/输出。
- 图像生成或渲染。
- 真实的文件编辑或 shell 执行。
- 第三方场景的插件 / 扩展 API。
- 多用户 / 共享会话状态。
- 遥测、分析、错误上报。

---

## 17. 风险与缓解

| 风险 | 缓解措施 |
|---|---|
| 长会话中输出明显套路化 | 每个池 ≥5 个变体；重复场景的近期惩罚；可指定种子的 RNG |
| 读取用户文件可能在输出中暴露密钥 | 硬黑名单 + 路径包含 + 大小上限 + 预算上限（§10.2） |
| 被滥用于对抗性欺骗（面试作弊等） | 通过定位 + README 措辞引导；技术手段无法解决 |
| 与 Claude Code 的商标 / 品牌混淆 | README 免责声明；视觉接近但不完全相同；不主张关联 |
| 手写短语池的维护负担 | 场景由可组合的 beat 片段构成；vibe 间共享 fillers |

---

## 18. 术语表

- **Beat（节拍）** — 脚本化输出的原子单元（聊天、工具、停顿等）。
- **Scenario（场景）** — 一段脚本化的剧情弧，展开为 beat 序列。
- **Vibe** — 语音/语气包，控制短语选择和节奏。
- **Slot-fill（插槽填充）** — 用从仓库上下文拉取的真实值替换模板占位符（如 `{file}`）。
- **Ambient 模式** — 无输入的循环模式，专为咖啡店摸鱼用例设计。
- **Director（编排器）** — 把输入 + 状态转换为 beat 序列的组件。
