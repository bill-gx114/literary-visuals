# 制作与导出

## 独立网页

构建工具只需 Python 3.9+ 标准库。生成的完整 HTML 内嵌文本、着色器和运行时，可离线用支持 WebGL 的浏览器打开，不需要服务器、账户、付费 API 或当前聊天应用。在线核对出处仍需执行 Skill 的 Agent 自身具备联网能力。

在 Skill 根目录运行示例：

```bash
python3 scripts/build_artwork.py --spec references/examples/surge.json --shader assets/shaders/surge.glsl --output output/surge.html
```

默认不覆盖已有文件；确实更新同一作品时使用 `--force`。制作新作品时在用户工作目录保存自己的 JSON 和 GLSL，不修改安装包中的参考作品。

## 作品规格

参照 `examples/*.json`。必需字段是 `title`、`slug`、`quote`、`intent`、`source.status`。另有：

- `source.label`、`source.context_note`、`source.urls`：来源说明与支持链接；未核实信息应明确区分。
- `caption`：印在收藏图上的简短署名。无法核实作者时省略或只写“文本意象试作”。
- `typography.position`：`top-left`、`bottom-left`、`top-right-vertical`。
- `typography.color`、`caption_color`：六位十六进制文字色，结合画面实测对比度。
- `typography.size`：画幅宽度的比例，默认 0.0375。长摘抄宜选取短句显示，完整输入可放在研究记录中，不强塞画面。
- `parameter`：`label`、`uniform`（`force` 或 `evening`）、`default`（0–1）。
- `uniforms`：可固定设置 `mode`、`force`、`evening`。
- `start_time`：初始艺术时间，秒。
- `accessibility`：准确描述实际画面的替代文本。

## 着色器接口

GLSL ES 1.00 fragment shader，包含 `precision highp float;`、`void main()` 和 `gl_FragColor`。可读 uniform：

```glsl
uniform vec2 res;
uniform float time;
uniform float force;
uniform float evening;
uniform int mode;
```

不需要全部使用。`res` 为实际绘制尺寸，`time` 为秒，`force`/`evening` 为 0–1。图像坐标可用 `vec2(gl_FragCoord.x/res.x,1.-gl_FragCoord.y/res.y)`。不要依赖帧数递增，否则导出时动作速度可能改变。纹理尽量与归一化坐标绑定；微粒可随分辨率细化。新材料可以自由重写 shader；三个参考不是能力上限。

## 图片

网页“保存高清图片”导出 1600×2000 PNG，包含当前文字可见状态和参数。不包含控件。导出在当前艺术时间点定格；先暂停可精确选帧。画面和导出采用同一排版函数。

浏览器字体会影响字形，当前包使用系统中文宋体回退，没有嵌入字体。跨设备要求完全相同排版时，另行取得合适字体并检查授权，或把最终 PNG/视频作为分享版本。

## 视频

“导出 12 秒视频”录制约 12 秒、720×900 的无声动态画面。保持页面可见；切入后台会取消并明确报告。采用浏览器支持的 MP4 或 WebM，扩展名与实际编码一致。视频录制时导出单独画布，控件和来源说明不进入视频。

浏览器不支持录制则保留 HTML 和 PNG，不虚构已生成的视频。默认不是无缝循环，不能称作循环视频，除非着色器和时间周期经过专门验证。

需要通用 MP4 时，可使用本包工具（需已有 FFmpeg）：

```bash
python3 scripts/convert_video.py output/recording.webm output/artwork.mp4
```

即使录出了 MP4，也可将其转为 H.264、yuv420p、faststart 以提高分享兼容性。输入输出必须不同，默认不覆盖文件。工具不自动安装 FFmpeg。没有 FFmpeg 时说明依赖缺失并保留原格式。

## 检查真实结果

遵循当前宿主的浏览器工具说明，打开生成网页，看真实画面和报错，测试控件。通过下载事件或核对实际下载文件取得结果后再报告成功，不把按钮状态当作文件已经保存的证明。

检查 PNG 尺寸和可见内容；视频可用已安装的 ffprobe 检查格式、时长、尺寸，抽取前后帧检查运动。窄屏至少看文字和控件是否溢出。换浏览器后的表现未经测试时不要宣称全平台兼容。
