# 文学意象转译 · Remotion 简介

64 秒，1920×1080，24 fps，H.264 MP4。暖白、宋体、慢显影，无旁白；原创建模的轻环境音，无鼓点。

## 预览与制作

```bash
npm ci
npm run studio
npm run typecheck
npm run render
```

`src/Film.tsx` 保存文案、版式和时间轴；`src/Artwork.tsx` 在每一帧按确定的时间绘制原作品着色器；`src/shaders.ts` 包含「涌」「暂歇」「伪天」的材料实现。所有运动依赖 Remotion 帧号，没有 CSS 动画或随机播放时间。

声音由 `scripts/make_audio.py` 以谐波合成，可重新运行。中文字体来自 Google Fonts 的 Noto Serif SC（SIL OFL，见 `public/FONT-LICENSE.txt`）；字体子集涵盖此片文案。增添新文案时需更新子集，或使用完整字体。

## 分镜

| 时间 | 内容 |
|---|---|
| 0–8.5s | 让文字，慢慢成为风景 |
| 7.5–16s | 查出处、读意象、成作品 |
| 15–27.5s | 涌：尺度与内部推动力 |
| 26.5–39s | 暂歇：压力松开，余热仍在 |
| 38–50.5s | 伪天：薄膜、挤压、局部搏动 |
| 49.5–64s | 三例同框；收藏与分享；Skill 调用 |

相邻段落有 1 秒重叠，以缓慢淡化过渡。作品内时间放慢至正常参考的 0.65 倍，画框只做约 1.8% 的推进。

## 文本来源

- 杜甫《旅夜书怀》：https://zh.wikisource.org/wiki/旅夜書懷
- 加缪《局外人》第一部第一章：https://www.fadedpage.com/books/20150715/html.php；用户中文摘抄的译本尚未确认。
- 「伪天」：用户摘抄，出处未确认。名称为作品标题，不冒充原文标题。

原案例、Skill 与此片的创作依据均来自当前项目。字体许可证随附；无外部音乐、图片或视频素材。

Remotion 使用和渲染文档：https://www.remotion.dev/docs/cli/render
