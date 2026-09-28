# 文学意象转译 · Literary Visuals

把阅读中的触动，变成可以收藏和分享的视觉作品。

一个用于诗歌、小说、散文与摘抄的 Skill，附三个动态案例与一支使用 Remotion 制作的 64 秒简介短片。

[下载简介视频](https://github.com/bill-gx114/literary-visuals/releases/download/v0.1.0/literary-visuals-intro.mp4) · [下载 Skill](https://github.com/bill-gx114/literary-visuals/releases/download/v0.1.0/literary-visuals.zip) · [全部发行文件](https://github.com/bill-gx114/literary-visuals/releases/tag/v0.1.0)

![简介短片分镜](docs/storyboard.png)

## 创作方法

1. **查出处**：核对原作与上下文，区分已核实、译本未确认和出处未知。
2. **读意象**：理解情绪、尺度、材质与动作关系，避免把名词逐一配成图。
3. **成作品**：以构图和缓慢运动回应文本，提供独立 HTML、高清图片和短片。

## 三个案例

| 作品 | 文本 | 视觉表达 |
| --- | --- | --- |
| 涌 · 时间的切面 | 杜甫《旅夜书怀》 | 矿物层理、广阔色域与内部推动力 |
| 暂歇 | 加缪《局外人》 | 红土、灰绿、余热与短暂松弛 |
| 伪天 | 用户摘抄，出处未确认 | 人造薄膜、凝胶层片与低频搏动 |

案例是创作参考，新文字需要重新理解和设计。完整出处与解释见 [案例说明](skills/literary-visuals/references/cases.md)。

## 使用 Skill

下载 Release 中的 `literary-visuals.zip`，解压后将 `literary-visuals` 文件夹放入支持本地 Skill 的 Agent 技能目录。Codex 默认目录为 `~/.codex/skills/`。

> 使用 $literary-visuals，把这段文字转成适合收藏分享的动态作品：……

[完整 Skill 规范](skills/literary-visuals/SKILL.md) · [制作与导出说明](skills/literary-visuals/references/production.md)

可直接下载并在浏览器打开 `skills/literary-visuals/assets/previews/` 下的三份 HTML；网页内置图片和视频导出。GitHub 文件页展示源代码，不会直接运行 HTML。

## 修改简介视频

```bash
cd remotion-intro
npm ci
npm run studio
```

导出：

```bash
npm run typecheck
npm run render
```

成片为 1920×1080、24 fps、约 64 秒。暖白纸色、宋体、慢转场，无旁白；三个案例按帧绘制真实动态，配无鼓点的合成环境音。

分镜、字体和素材说明见 [Remotion 工程说明](remotion-intro/README.md)。依赖通过 lockfile 固定；仓库不包含 node_modules 或下载的浏览器。

## 文件结构

- `skills/literary-visuals/`：可安装的完整 Skill、规则、参考和制作工具。
- `remotion-intro/`：可编辑的视频工程、字体子集和原创合成音轨。
- `docs/storyboard.png`：简介分镜预览。
- Releases：视频、Skill 安装包、三个作品合集和 Remotion 工程压缩包。

## 验证与素材

已通过 Skill 元数据检查、TypeScript 检查与 Remotion 实际渲染。已检查输出视频的尺寸、时长、六个段落画面，并完成全片解码验证。HTML 示例已在当前浏览器验证；不承诺未经测试的跨平台表现。

中文字体为 Noto Serif SC，许可证随工程附带。环境音由 `scripts/make_audio.py` 合成，无外部音乐采样。文学摘抄保留出处状态；未确认的作者和译本不补造。
