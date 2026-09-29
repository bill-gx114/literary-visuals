# 制作与导出

## 独立网页

构建工具只需 Python 3.9+ 标准库。生成的完整 HTML 内嵌文本、着色器和运行时，可离线用支持 WebGL 的浏览器打开，不需要服务器、账户、付费 API 或当前聊天应用。在线核对出处仍需执行 Skill 的 Agent 自身具备联网能力。

在 Skill 根目录运行示例：

```bash
python3 scripts/build_artwork.py --spec references/examples/surge.json --shader assets/shaders/surge.glsl --output output/surge.html
```

默认不覆盖已有文件；确实更新同一作品时使用 `--force`。制作新作品时在用户工作目录保存自己的 JSON 和 GLSL，不修改安装包中的参考作品。

## 将选择写入制作规格

先把用户选择存到 `request.json`，并按 `references/text-treatment.md` 保存完整文本与实际展示范围；再将可执行字段写入作品 JSON 的 `delivery`：

```json
{
  "delivery": {
    "formats": ["png", "mp4"],
    "ratio": "3:4",
    "text_mode": "both",
    "duration_seconds": 12,
    "fps": 24,
    "audio": "none"
  }
}
```

- `formats`：`png`、`mp4`、`html` 的非空组合，决定交付清单及网页可见的导出按钮。PNG 单独交付时预览默认静止；只选 HTML 时不展示额外导出按钮。
- `ratio`：`3:4`、`4:5`、`9:16`、`16:9`、`1:1` 或 `custom`。预设像素见 [生成前选择](intake.md)，构建器补全 `image_size` 和 `video_size`；两者必须等比。自定义时显式提供两个尺寸数组。
- `text_mode`：`with`、`without`、`both`。无字模式默认隐藏全部画内文字。双版模式展示独立按钮，文件名使用 `-with-text` / `-art`；两版共用同一参数与起始艺术时间。单版仍可在预览中临时切换显隐，导出以当前状态为准；Agent 最终交付必须符合用户选择。
- `duration_seconds`：3–60 的整数秒；`fps`：24 或 30。长于底座限制的项目用 Remotion 等已有工具制作，不擅自缩短。
- `audio`：此底座只支持 `none`。配乐、配音等选择须另用有能力的制作工具；构建器会拒绝不支持的音频选项，避免静默丢失。
- `image_size` / `video_size`：可覆盖预设像素，但必须保持选定比例；视频宽高须为偶数。没有 `delivery` 的旧规格保留 4:5、1600×2000 PNG、720×900 视频、12 秒和带字的兼容默认值。兼容默认值不代表新用户同意了这些选项。

构图必须针对最终比例设计。用 `min(width,height)` 约束字体尺度；横版中检查长竖排是否越界。对带字版留出排版区，无字版也须独立成立。不要把尺寸适配理解为将旧图机械拉伸。

## 作品规格

参照 `examples/*.json`。必需字段是 `title`、`slug`、`quote`、`intent`、`source.status`。另有：

- `source.label`、`source.context_note`、`source.urls`：来源说明与支持链接；未核实信息应明确区分。
- `caption`：印在收藏图上的简短署名。无法核实作者时省略或只写“文本意象试作”。
- `typography.position`：`top-left`、`bottom-left`、`top-right-vertical`。
- `typography.color`、`caption_color`：六位十六进制文字色，结合画面实测对比度。
- `full_text`：完整输入；新作品带字时应保留。`quote` 为实际显示的连续原文。
- `text_selection`：`{"mode":"full"}` 要求 `quote` 与 `full_text` 一致；`{"mode":"excerpt","approval":"explicit"}` 或 `delegated` 要求取得相应选句授权且为原文连续片段。旧规格可省略这两项以兼容历史案例，不能借兼容接口回避新作的文字约定。
- `typography.size`：`min(width,height)` 的比例，默认 0.0375，范围 0.032–0.065。不自动缩字；长文本先设计阅读区域，确实有冲突再处理全文/节选/分页选择。
- `typography.box`：归一化 `[x,y,width,height]`，原文的可用阅读区。横排默认 `[.09,.09,.82,.70]`，竖排默认 `[.09,.085,.82,.68]`；底部对齐只在该框内对齐。
- `typography.caption_box`：署名区域，默认 `[.09,.83,.82,.10]`。同样必须位于画布内。
- `typography.line_height`：字号倍数，1.35–2.2，默认 1.9。
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

网页图片导出采用 `delivery.image_size`，包含所选文字版本和参数。不包含控件。导出在当前艺术时间点定格；先暂停可精确选帧。画面和导出采用同一排版函数。

中文标点和英文词边界参与断行，保留显式段落。字体按规格固定；容量不足或与署名重叠时，预览显示警告，带字导出报错。不能把缺字图片当作成功；切换无字版仍可检查构图。这不是自动分页器，也不会擅自节选。

预留区示例（需与本次画面共同设计，不是长文固定模板）：

```json
{
  "typography": {
    "position": "bottom-left",
    "box": [0.08, 0.38, 0.84, 0.42],
    "caption_box": [0.08, 0.84, 0.84, 0.08],
    "size": 0.035,
    "line_height": 1.5,
    "color": "#30382f"
  }
}
```

构建器验证数值范围和文字约定；真实字体的行数与重叠由浏览器检查。允许较长 `quote` 不等于保证单张放得下，容量通过也不等于对比度或图文关系合格。使用其他排版器、图像生成路线或视频剪辑时同样检查可读性与原文。

浏览器字体会影响字形，当前包使用系统中文宋体回退，没有嵌入字体。跨设备要求完全相同排版时，另行取得合适字体并检查授权，或把最终 PNG/视频作为分享版本。

## 视频

视频按钮使用 `delivery.duration_seconds`、`video_size` 与 `fps` 录制无声画面，并显示实际配置的时长。保持页面可见；切入后台会取消并明确报告。采用浏览器支持的 MP4 或 WebM，扩展名与实际编码一致。视频录制时导出单独画布，控件和来源说明不进入视频。

浏览器不支持录制则保留 HTML 和 PNG，不虚构已生成的视频。默认不是无缝循环，不能称作循环视频，除非着色器和时间周期经过专门验证。

需要通用 MP4 时，可使用本包工具（需已有 FFmpeg）：

```bash
python3 scripts/convert_video.py output/recording.webm output/artwork.mp4
```

即使录出了 MP4，也可将其转为 H.264、yuv420p、faststart 以提高分享兼容性。输入输出必须不同，默认不覆盖文件。工具不自动安装 FFmpeg。没有 FFmpeg 时说明依赖缺失并保留原格式。

## 检查真实结果

遵循当前宿主的浏览器工具说明，打开生成网页，看真实画面和报错，测试控件。通过下载事件或核对实际下载文件取得结果后再报告成功，不把按钮状态当作文件已经保存的证明。

检查 PNG 尺寸和可见内容；视频可用已安装的 ffprobe 检查格式、时长、尺寸，抽取前后帧检查运动。对照 request.json 校验实际交付的格式及两种文字版本；自定义尺寸以真实文件头和视频流为准。窄屏至少看文字和控件是否溢出。换浏览器后的表现未经测试时不要宣称全平台兼容。
