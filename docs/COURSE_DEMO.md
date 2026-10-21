# IFB405TC 课堂展示支持

本项目读取了用户提供的 MarkingScheme CW1 Group。网页覆盖原型体验和实施衡量展示，不能替代作业要求的20分钟英文小组汇报、研究证据及AI Use & Verification Log。

## 建议解说

“HistoryQuest moves from artifact viewing to self-directed historical curiosity. Visitors choose any object, observe it, and can skip the puzzle. The story explains evidence and uncertainty, then offers people, events, places and questions instead of a next mission. Saved questions extend learning beyond the visit.”

## Audience Journey

- 参观前：馆方公众号/可信网页建立兴趣；低门槛H5入口。
- 馆内：自主选物 → 观察 → 可选谜题 → 史料解释与拟人叙事。
- 追问：游客选择人物、事件、地点或问题，进入知识卡和可靠资料。
- 离馆后：从收藏与个人问题返回，保持自愿持续学习。

目标受众为待研究验证的设计假设。不可用AI文本代替真实问卷与现场观察结论。

## Service Blueprint

前台：公众号入口、地图、观察、故事、好奇心中心与收藏。
后台：展品/展位核实、策展研究审校、视频配音字幕与版权、资料更新、链接可用性检查。
支持：馆方教育、研究、数字运营、志愿者和前端开发。现场人员应能解释示意地图边界、帮助跳过谜题、提供非手机替代资料及纠错渠道。

## Implementation

1. 内容准备：3件展品小范围试点，研究员核验、教育人员改写、开发实现；收集内容授权。
2. 试用：拟议邀请5–8位代表性参与者进行思考出声测试；不是已实施研究。
3. 评估：同一知识题前后测、卡片自主探索、官方资料访问意图、经同意的7日随访；根据发现调整。

## KPI定义

| 目标 | 口径 | 解释限制 |
| --- | --- | --- |
| 理解提升 | 同一知识题后测正确率 − 前测正确率（百分点） | 应控制题目难度与样本差异，不能用本原型谜题替代 |
| 主动探索 | 至少读1张相关卡的会话 / 打开故事的会话 | 未来经同意的匿名会话分析；本机点击数不能直接算总体转化 |
| 连接可信资料 | 点击官方链接会话 / 进入Hub会话 | 点击不证明完成阅读 |
| 离馆持续学习 | 7日内回访阅读的自愿参与者 / 同意随访者 | 需要同意流程及独立随访设计，当前不追踪跨设备 |

本地事件：artifact_open、observation_toggle、puzzle_answer、puzzle_skip、story_open、topic_read、official_link_open、save/unsave。由相应操作触发；刷新或直接哈希访问不会全部重复计数，因此只用于课堂示范，不用于正式运营分析。最多500条，记录本机时间；无会话/用户身份。

## AI Use & Verification Log建议条目

任务：网页原型与拟人叙事。工具：Codex与内置图像生成。用途：方案实现、代码、测试、角色设计、动画制作。采用：自由选择、证据分层、知识卡与收藏；修订：删除强制下一件展品、拒绝未核实的年代与人物。核实：原始照片、官方目录、权威资料、构建和交互检查。最终由小组记录自己的复核者、日期和剩余不确定性。
