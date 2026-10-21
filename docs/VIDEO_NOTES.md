# 最新更新：85秒礼轿视频与首页顺序（2026-10-18）

礼轿故事已替换为用户提供的85秒沉浸配乐原片（1080p），原声完整保留，未叠加网页配乐，移除旧字幕绑定。现场资料模块在前，“离开博物馆”模块移至页脚前最后。双击“启动演示.command”打开最新dist。验证及备份见 docs/VIDEO_HOME_UPDATE_2026-10-18.md。

以下为历史版本记录，以本节为准。

## 2026-10-18 复核

原视频使用卡通角色而非旧模糊实拍，已检查生成代码与抽帧，未重新制作。新封面为本次提供的现场高清照片等比留边导出；正文新讲解独立于视频。用户提供的视频号链接作为外部阅读入口，不当作MP4或已读取的字幕来源。

# 拟人动画视频说明

主文件：`public/media/chair-story.mp4`，约43.96秒，1280×720，24fps，H.264视频 + AAC音频；faststart，支持浏览器边加载边播放。附中文字幕WebVTT和烧录字幕，完整台词见 `scripts/narration.json`，网页也提供全文。

角色为**艺术演绎**，不是文物三维扫描或展品结构复原。动作包括轻微摆动、眨眼和依据旁白音频能量开合的嘴，非真人口型捕捉。中文声音使用macOS系统Tingting合成，不仿冒任何真实个人或馆方讲解员。无背景音乐。用户点击“播放动画（有声）”才会打开声音，不自动播放。

## 台词与证据

| 信息 | 依据 |
| --- | --- |
| 名称与1936年年代 | 上海市文旅局一级文物目录第617项，链接见页面来源 |
| 朱金木雕、金银彩绣、玻璃画 | 上观《瑞彩华轿：百子大礼轿的故事》活动介绍，https://www.jfdaily.com/sgh/detail?id=1711158 |
| 近代江南人生仪礼物证 | 同一活动介绍 |
| “小百”称呼、与观众对话、提出问题 | 明确标记的教学创作，不作为史实 |
| 具体主人、使用经历 | 未在本视频虚构 |

没有把不同报道中互有差异的层数、高度、捐赠日期等写入旁白。动画保留礼轿的金色层顶、红色主体与彩色流苏特征，但不保证工艺细节准确。

## 生成方式与提示词

使用内置imagegen工具生成透明角色，以小组礼轿照片作形象参考；没有使用CLI/API fallback。角色文件已复制进项目 `public/media/chair-character.png`。

最终提示词：

> Use case: illustration-story. Asset type: a single transparent-background character asset for a 2D speaking puppet museum animation. Use the attached real photograph only as design reference for the overall identity of the Wuhua Baizi ceremonial sedan chair: preserve recognizable layered golden pagoda-like roof, red wooden body, delicate gold carved decorations and multicolored fringe. Create a charming refined 2D illustrated anthropomorphic version, suitable for university museum educational H5, sophisticated editorial animation style, warm gold and muted red, clean layered shapes, soft texture. Front-facing symmetrical full body centered in a square canvas, occupies central 70% width and 88% height, no crop. A small friendly face is integrated on the plain light-gold rectangular front body panel near the LOWER CENTER: two large expressive eyes, eyebrows; leave the lower half of that small face panel BLANK with NO mouth, since a moving mouth will be drawn there during animation. No hands, no legs, no humans, no surroundings. Stylization is clearly an imaginative character interpretation and must not look like an archival artifact photograph. No text, no labels, no watermarks. Genuinely transparent background.

## 重新生成视频（可选，网页运行无需此步骤）

`render_video.py` 是可复现的动画合成源文件；需要macOS系统Tingting中文语音、PingFang字体以及Python的Pillow、NumPy、imageio-ffmpeg。在项目目录运行 `python3 scripts/render_video.py`。中间音频写入忽略目录video-work；成品覆盖public/media中的视频、字幕和海报。其他系统可替换旁白音轨与字体路径。

修改台词后，需重新逐条核对来源，再重新生成视频与字幕，检查声音和画面长度一致。没有为尚未核实身份的两件观察样例编造有声历史视频。
