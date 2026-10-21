import { chairPhoto } from "./media";
export type Source = {
  id: string;
  title: string;
  url: string;
  publisher: string;
  checked: string;
  verification?: "provided" | "verified";
  note?: string;
};
export const sources: Source[] = [
  {
    id: "bridge-archive",
    title: "上海人的“外婆桥”——外白渡桥",
    url: "https://www.shda.gov.cn/archives/gdxw/202601/t20260120_76430.html",
    publisher: "上海市档案局（馆）",
    checked: "2026-10-16",
    note: "桥梁历史背景与档案图像；不是本馆当前展柜位置的证明。",
  },
  {
    id: "city-collection",
    title: "Shanghai History Museum｜馆藏介绍（英文）",
    url: "https://english.shanghai.gov.cn/en-MuseumsGalleries/20231229/9b40ec60928148cc89066195dedd4395.html",
    publisher: "上海市人民政府英文门户",
    checked: "2026-10-16",
    note: "页面注明资料来自上海市历史博物馆；用于斗方与铜炮背景，不据此认定当前展位。",
  },
  {
    id: "catalogue-context",
    title: "一级文物名录｜画像、斗方、铜炮与铭牌（PDF，第26–28页）",
    url: "https://whlyj.sh.gov.cn/cmsres/60/602f995e04104bab8fc479b39d07e94b/47e3f2fe6d3d38cb46fe39b303525d20.pdf#page=26",
    publisher: "上海市文化和旅游局",
    checked: "2026-10-16",
    note: "第618、628、642、644项；确认目录中的藏品信息，不代表借展或开放状态。",
  },
  {
    id: "craft",
    title: "瑞彩华轿：百子大礼轿的故事｜活动介绍",
    url: "https://www.jfdaily.com/sgh/detail?id=1711158",
    publisher: "上观新闻",
    checked: "2026-10-18",
    note: "媒体平台刊载的上历博活动介绍，支持工艺与人生仪礼背景；不是馆方官网直链。",
  },
  {
    id: "chair-wechat",
    title: "阅读公众号原文",
    url: "https://mp.weixin.qq.com/s/4DCPJGDhPLBbV2h74StNlw",
    publisher: "用户提供的公众号入口",
    checked: "2026-10-18",
    verification: "provided",
    note: "本次未能读取正文，账号和原始标题未核验；未作为正文史实依据。",
  },
  {
    id: "chair-wechat-video",
    title: "观看礼轿视频",
    url: "https://weixin.qq.com/sph/A9pAWrxMAU",
    publisher: "用户提供的视频号入口",
    checked: "2026-10-18",
    verification: "provided",
    note: "建议在微信中打开。未能读取画面、字幕或发布账号；此处为外部链接。",
  },
  {
    id: "museum",
    title: "上海市历史博物馆｜机构介绍",
    url: "https://whlyj.sh.gov.cn/zsdw/20151007/0022-30547.html",
    publisher: "上海市文化和旅游局",
    checked: "2026-10-16",
  },
  {
    id: "catalogue",
    title: "上海市一级文物藏品目录（PDF，第26页）",
    url: "https://whlyj.sh.gov.cn/cmsres/60/602f995e04104bab8fc479b39d07e94b/47e3f2fe6d3d38cb46fe39b303525d20.pdf",
    publisher: "上海市文化和旅游局",
    checked: "2026-10-18",
    note: "第617项列出1936年物华号朱金百子大礼轿；仅用于名称、年代及收藏单位核实。",
  },
  {
    id: "stamp",
    title: "大龙邮票｜藏品解读",
    url: "https://www.chnmuseum.cn/zp/zpml/gjwxbt/202203/t20220301_253958.shtml",
    publisher: "中国国家博物馆",
    checked: "2026-10-16",
    note: "跨馆历史背景阅读，不代表该文物正在上海市历史博物馆展出。",
  },
];
export type Artifact = {
  id: string;
  name: string;
  en: string;
  era: string;
  theme: string;
  image: string;
  alt: string;
  status: "verified" | "demo";
  caption: string;
  lead: string;
  observe: string;
  puzzleTitle?: string;
  question: string;
  options: string[];
  answer: number;
  explanation: string;
  fact: string;
  sourceIds: string[];
  story: string[];
  related: string[];
  video?: string;
  captions?: string;
};
export const artifacts: Artifact[] = [
  {
    id: "chair",
    name: "百子大礼轿",
    en: "A celebration, held in time",
    era: "1936",
    theme: "匠艺与生活",
    image: chairPhoto.image,
    alt: chairPhoto.alt,
    status: "verified",
    caption:
      "1936年物华号朱金百子大礼轿，上海市历史博物馆藏。图片为用户提供的现场实拍，保留展柜反光与真实色彩；可点击查看高清全图。",
    lead: "一顶礼轿，为什么值得我们停下来？",
    observe:
      "先看看层叠的轿顶、轿身与垂挂装饰，比较不同区域的线条、色彩和质感。再结合展签与下方工艺介绍，寻找传统技艺在礼轿上的表现。",
    puzzleTitle: "观察小谜题：辨认礼轿的装饰工艺",
    question:
      "结合礼轿的装饰细节与相关介绍，以下哪组工艺与资料中明确记载的组合一致？",
    options: [
      "A. 朱金木雕、金银彩绣、螺钿镶嵌",
      "B. 朱金木雕、金银彩绣、玻璃画",
      "C. 朱金木雕、金银彩绣、瓷板彩绘",
    ],
    answer: 1,
    explanation:
      "上观刊载的礼轿活动介绍明确提到朱金木雕、金银彩绣与玻璃画，因此应选B。可以结合照片与实物，比较木雕的立体线条、织绣的色彩和绘画的表现，继续寻找材料与装饰的关系。这道题匹配的是资料中的明确记载，并非对整件藏品全部工艺的完整鉴定。",
    fact: "上海市文旅局公布的一级文物藏品目录，将“1936年物华号朱金百子大礼轿”列于上海市历史博物馆名下。上观新闻刊载的礼轿活动介绍指出，其装饰结合朱金木雕、金银彩绣与玻璃画，是近代江南地区人生仪礼的物证。从层叠的轿顶看到轿身与底座，可以比较不同材料如何共同营造婚礼中的仪式感；进一步阅读好奇心中心的礼轿故事。",
    sourceIds: ["catalogue", "craft", "chair-wechat", "chair-wechat-video"],
    video: "chair-story-immersive-20261018.mp4",
    story: [
      "你好，我是物华号朱金百子大礼轿。你可以叫我，小百。",
      "我的年代，记在一九三六年。这是你能在官方藏品目录中核对的信息。",
      "别只看我的金光。我的装饰，汇集了朱金木雕、金银彩绣与玻璃画。",
      "这些细节，让我成为近代江南地区人生仪礼的一份物证。",
      "不过，别替我编一个没有证据的主人故事。具体经历，还要回到展签与文献中寻找。",
      "你最好奇的是匠人，婚礼，还是上海的变迁？把问题收藏，离馆后，继续寻找答案吧。",
    ],
    related: ["craft", "place", "evidence", "people"],
  },
  {
    id: "radio",
    name: "声音里的城市",
    en: "What did the city sound like?",
    era: "年代待核实",
    theme: "城市与传播",
    image: "radio.webp",
    alt: "小组现场照片：展陈中的带旋钮箱式设备，外观类似收音机",
    status: "demo",
    caption:
      "现场物品观察样例；暂称“收音设备”。正式名称、年代、用途及展位尚未核实。",
    lead: "在屏幕之前，人们怎样听见远方？",
    observe:
      "观察设备的正面、旋钮和刻度。不要触摸展品。请寻找展签中的名称和使用说明；照片本身不足以确认型号。",
    question: "从这张照片出发，哪一种做法更适合历史研究？",
    options: [
      "把相似设备的故事直接套用",
      "先记录可见特征，再查证名称与用途",
      "猜测它的第一位主人",
    ],
    answer: 1,
    explanation:
      "相似外观并不等于相同历史。先记录特征，再核对展签与可靠文献。这个样例尚未确认具体型号。",
    fact: "此物品的具体历史尚未核实。当前只提供观察方法。想了解本馆的叙事背景，可阅读文旅局机构介绍：基本陈列设有“古代上海”与“近代上海”。这不是对照片中设备的鉴定。",
    sourceIds: ["museum"],
    story: [
      "我暂时被称作“收音设备”。这只是根据现场照片给我的观察名称。",
      "你可以观察我的旋钮与箱体，记录你看见了什么。",
      "但请不要替我编造出厂年份、品牌或主人。先找到我的展签，再把我的故事补完整。",
    ],
    related: ["communication", "post", "evidence", "people"],
  },
  {
    id: "print",
    name: "纸上的城市想象",
    en: "A city, framed on paper",
    era: "年代待核实",
    theme: "视觉与日常",
    image: "print.webp",
    alt: "小组现场照片：带建筑图案与文字边框的纸质展品",
    status: "demo",
    caption:
      "纸质展品观察样例；名称、媒介、年代和用途待展签核实，不认定其为月份牌或广告。",
    lead: "一张图像，怎样塑造我们对城市的想象？",
    observe:
      "看看图像、文字与边框之间的位置关系。记下一个你想辨认的地名或文字，再用展签核对。",
    question: "仅凭这张现场照片，可以确定什么？",
    options: [
      "图像与文字在画面中的位置",
      "发行年份与印刷数量",
      "所有观众看到它后的感受",
    ],
    answer: 0,
    explanation:
      "画面布局可以观察；发行信息需要文献；观众感受需要调研。三类证据不能相互替代。",
    fact: "这件纸质展品的具体身份尚待核实。原型不把视觉推测写成史实。文旅局的机构介绍可用于理解博物馆的城市历史定位，不能代替单件文物的说明。",
    sourceIds: ["museum"],
    story: [
      "在这张现场照片里，我是一件有图像和文字的纸质展品。",
      "你可以从画面提出问题：谁绘制了这些建筑？文字写给谁看？",
      "这些问题还没有经核实的答案。把它们保存下来，下次找到展签时再继续。",
    ],
    related: ["visual", "place", "evidence"],
  },
];
export type Topic = {
  sections?: { title: string; text: string }[];
  observations?: string[];
  reflection?: string;
  id: string;
  type: "主题" | "人物" | "事件" | "地点" | "问题";
  title: string;
  summary: string;
  body: string;
  status: "verified" | "method" | "demo";
  sourceIds: string[];
  keywords: string[];
  related: string[];
};
export const topics: Topic[] = [
  {
    id: "bridge-history",
    type: "地点",
    title: "1907：从一块铭牌走向外白渡桥",
    summary: "把展柜里的文字，与苏州河上的城市空间联系起来。",
    body: "文旅局一级文物名录第644项列出本馆收藏的“1907年外白渡桥落成铜质铭牌”。上海市档案馆介绍，钢桥于1907年底竣工，1908年已有有轨电车线路经过，改善了苏州河两岸的联系。观察时可以先找铭牌上的年份与文字，再追问：桥梁怎样改变人的日常往来？离馆后可阅读档案照片，比较桥梁的不同时期。这里提供历史背景，未确认具体柜位或实时开放情况。",
    status: "verified",
    sourceIds: ["catalogue-context", "bridge-archive"],
    keywords: ["外白渡桥", "铭牌", "1907", "苏州河", "交通", "地点"],
    related: ["place", "evidence", "visual"],
  },
  {
    id: "chen-history",
    type: "人物",
    title: "陈化成：从画像追问吴淞防务",
    summary: "用画像和铜炮两类证据，认识同一位历史人物。",
    body: "一级文物名录第618项列有本馆收藏的“清 陈化成画像”，第642项列有“1841年江南提督陈化成督造的振远将军铜炮”。上海市政府馆藏介绍记载，铜炮曾安置于吴淞炮台，是研究鸦片战争时期军事设施的实物资料。可以比较：画像呈现怎样的人物形象，器物又提供什么证据？铜炮是关联阅读对象，本原型不据此新增未经核实的铜炮地图点，也不把画像创作年份写成1841年。",
    status: "verified",
    sourceIds: ["catalogue-context", "city-collection"],
    keywords: ["陈化成", "画像", "吴淞", "1841", "振远将军", "人物"],
    related: ["evidence", "bridge-history", "nomination-history"],
  },
  {
    id: "nomination-history",
    type: "事件",
    title: "1911：一张斗方留下的选举记录",
    summary: "一件书写文物，怎样成为历史事件的证据？",
    body: "一级文物名录第628项列有“1911年民国总统候选人提名及当选人斗方”。上海市政府英文馆藏介绍记载，1911年12月29日在南京举行临时大总统选举，袁希洛负责记录；会后应代表要求按原式抄写17份留存，本馆藏品为其中一份。面对斗方，可以区分“事件发生时的记录”与“为保存而抄写的文本”，再追问文献的形成和流传。其历史发生地为南京，不把它误写成在上海举行的选举。",
    status: "verified",
    sourceIds: ["catalogue-context", "city-collection"],
    keywords: ["1911", "辛亥革命", "孙中山", "袁希洛", "斗方", "选举", "事件"],
    related: ["chen-history", "evidence", "place"],
  },
  {
    id: "craft",
    type: "主题",
    title: "百子大礼轿：一场婚礼里的匠艺与上海生活",
    summary:
      "从层叠轿顶到木雕、彩绣与玻璃画，走近婚礼器物中的江南匠艺和上海城市记忆。",
    body: "一顶礼轿，既是婚礼中的器物，也能成为认识上海的入口。上海市历史博物馆收藏的这件百子大礼轿，把木雕、彩绣与玻璃画汇在一起。先从金色轿顶看到红色底座，再走近细节：不同材料怎样共同表达祝愿？一场婚礼又怎样留下城市生活的痕迹？",
    status: "verified",
    sourceIds: ["catalogue", "craft", "chair-wechat", "chair-wechat-video"],
    keywords: [
      "礼轿",
      "物华号",
      "工艺",
      "朱金木雕",
      "金银彩绣",
      "玻璃画",
      "婚礼",
      "海派文化",
      "1936",
    ],
    related: ["evidence", "people", "place"],
    sections: [
      {
        title: "01｜一件有名字、有年代的婚礼器物",
        text: "官方一级文物目录将它记为“1936年物华号朱金百子大礼轿”，收藏单位是上海市历史博物馆。花轿在传统婚礼中承担迎送新娘的用途，这是理解它的一般婚俗背景；目录所确认的，则是这件藏品的名称、年代与收藏归属。",
      },
      {
        title: "02｜先看轮廓，再看材料",
        text: "上观刊载的活动介绍将礼轿概括为轿架、轿顶、轿身与底座，并提到朱金木雕、金银彩绣和玻璃画。照片里，层叠的顶部、密集雕饰、垂挂装饰与红色底座形成鲜明对照。可以先寻找整体的重复和对称，再比较不同区域的光泽、纹理与色彩，不必急着数清每一层。",
      },
      {
        title: "03｜把祝愿做成看得见的仪式",
        text: "花轿把出行与婚礼礼仪连接起来。活动介绍指出，传统花轿具有吉祥和身份象征；放在婚嫁语境中，“百子”这个名称也可以引出对家庭延续与美好生活的祝愿。我们可以讨论这种理解，但不把它当作已核实的图案数量，也不据此推断具体新人的身份或经历。",
      },
      {
        title: "04｜从江南匠艺，读到上海",
        text: "这件礼轿让多种传统技艺出现在同一件婚礼器物上。活动介绍把它放在江南人生礼仪与海派文化的联系中，并回顾上海开埠后商贸发展、人口汇聚和婚俗融合的背景。观看时，可以沿着木雕、彩绣与玻璃画这些具体线索，思考城市怎样把不同手艺和审美带进生活。",
      },
      {
        title: "05｜今天，我们怎样留下重要时刻",
        text: "不妨把礼轿与今天的婚礼用品、家庭合影或纪念物放在一起想一想：我们会如何选择颜色、装饰和保存方式？一件物品的价值，来自制作的工夫，还是与人共享的记忆？这是面向当代生活的比较，不表示今天的做法直接源自这顶礼轿。",
      },
    ],
    observations: [
      "退后看：从轿顶、轿身到红色底座，找出一处反复出现的形状。",
      "放大看：选两处装饰，比较线条、色彩和表面质感；拍摄中的玻璃反光不等于材料本身。",
      "带着问题回到实物：试着寻找木雕、彩绣或玻璃画的对应位置，再与展签核对。",
    ],
    reflection:
      "如果让一件物品代表你心中的婚礼或家庭记忆，你会选择什么？为什么？没有标准答案，也可以把这个问题带回家。",
  },
  {
    id: "place",
    type: "地点",
    title: "南京西路325号",
    summary: "从参观地点，走近上海的城市记忆。",
    body: "上海市文旅局机构介绍列明，本馆地址为上海市黄浦区南京西路325号。可从这里继续了解博物馆的城市历史叙事。此地址不代表任何单件展品的制作地或原使用地。",
    status: "verified",
    sourceIds: ["museum"],
    keywords: ["上海", "地点", "建筑", "城市"],
    related: ["visual", "craft", "evidence"],
  },
  {
    id: "evidence",
    type: "问题",
    title: "我们怎么知道这是真的？",
    summary: "把“看见”“推测”和“查证”分开。",
    body: "看见：记录照片或实物可见的细节。推测：由细节提出一个可能的解释。查证：对照展签、藏品目录和可靠文献。遇到资料空缺时保留问题，比编造一个完整故事更有价值。",
    status: "method",
    sourceIds: [],
    keywords: ["史料", "真实性", "观察", "展签"],
    related: ["craft", "visual", "communication"],
  },
  {
    id: "people",
    type: "人物",
    title: "谁制作、使用和保存了它？",
    summary: "人物线索待馆方资料补全。",
    body: "本卡为明确标记的演示研究问题。尚未录入经核实的工匠、使用者或捐赠者资料，因此不显示虚构姓名与经历。你可以把这个问题留在收藏夹，之后查阅馆方研究资料。",
    status: "demo",
    sourceIds: [],
    keywords: ["人物", "工匠", "使用者", "捐赠"],
    related: ["craft", "evidence"],
  },
  {
    id: "communication",
    type: "主题",
    title: "城市里的信息如何流动？",
    summary: "从声音设备提出问题，沿传播主题自由探索。",
    body: "先查明照片中设备的身份，再研究声音传播与城市生活的关系。这里展示的是一种研究方向，不把特定广播事件、品牌或受众习惯套用到尚未鉴定的物品上。",
    status: "method",
    sourceIds: [],
    keywords: ["收音机", "声音", "广播", "传播"],
    related: ["post", "people", "evidence"],
  },
  {
    id: "post",
    type: "事件",
    title: "1878：从邮票看通信",
    summary: "跨馆延伸阅读，与眼前的物品建立新问题。",
    body: "据中国国家博物馆藏品解读，1878年在天津等城市（包括上海）试办大清邮政，随后印制大龙邮票。你可以比较：邮政与声音传播各自怎样连接人？这是一条跨馆阅读线索，不表示大龙邮票在本馆展出。",
    status: "verified",
    sourceIds: ["stamp"],
    keywords: ["邮票", "1878", "上海", "通信", "事件"],
    related: ["communication", "place", "evidence"],
  },
  {
    id: "visual",
    type: "主题",
    title: "谁在描绘一座城市？",
    summary: "从文字与图像的布局，开始阅读视觉史料。",
    body: "选择画面中的一个细节，提出可查证的问题：这是什么建筑？图像面向谁？文字提供了哪些信息？照片中的纸质物品尚未确认身份，请在查证后补充作者、年代与用途。",
    status: "method",
    sourceIds: [],
    keywords: ["图像", "纸张", "视觉", "广告", "城市"],
    related: ["place", "people", "evidence"],
  },
];
export const assetBase = `${import.meta.env.BASE_URL}media/`;

// Shared exact text for the single player and offline audio corpus.
export function topicNarration(topic: Topic): string {
  return (topic.sections ?? [])
    .map((section) => section.title.replace(/^\d+｜/, "") + "。" + section.text)
    .join("\n\n");
}
