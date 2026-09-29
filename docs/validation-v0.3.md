# v0.3 验证范围

本次修改研究与交付规则，未更改渲染器、字号算法或视频代码。已通过 Skill 元数据校验，核对新增引用文件及评测 JSON。以下为创作者的桌面推演，不是独立 Agent 前向测试，也不是新增图片或读者盲测。

| 场景 | 路线核对 |
| --- | --- |
| short-absence、long-sentence-turn | 原创句不虚构作者；温度／缺席与期待／落空继续决定画面，解析从可见关系出发。 |
| long-full、excerpt-permitted | 研究及外部解析不挤占画内全文空间；节选授权与连续原文要求保留。 |
| paradox、irony、joy | 语义关系和指定风格保持优先；不因增加研究而全部采用历史绘画或悲伤色调。 |
| series-constraint | 系列约束优先，不强行引入时代画风破坏系列。 |
| video-overload | 全文与三秒阅读冲突仍需解决，解析不能代替画内文字的可读性。 |
| partial-intake | 四项选择尚缺时不生成；背景检索不被当成用户已经选择。 |
| author-era-distinction | 分开作品语气、古罗马视觉文化、后世题材画；中文版本不因故事核实而被标为已核实。 |
| specified-modern-style | 当代拼贴要求有效；可研究并舍弃古代媒介，仍交付外部解析。 |
| unknown-source-analysis | 以用户的“来历不明”为准，不从评测集中偷用“原创”身份；未知作者不做虚构生平。 |
| retrospective-analysis | 只补研究与解析，不重生图；新增背景不得伪装为先前提示词依据。 |

## 真实资料对照

核读大都会博物馆《Roman Painting》与庞贝考古公园 Antiquarium, sala I。前者支持第三风格壁画的时代及形式描述，后者支持纳西索斯题材在古罗马壁画中的表现；二者不足以证明先前生成的写实油画复原了奥维德时代风格。因此为既有作品补写解析时明确其为当代转译，并标明历史研究发生在创作之后。

- https://www.metmuseum.org/essays/roman-painting
- https://pompeiisites.org/boscoreale/antiquarium-sala-i/

本次未公开用户作品，也未将用户作品打包入 Skill。旧版本的 19 项渲染与规格测试结果保留为历史验证，不能当成本次新增研究规则的自动质量证明。
