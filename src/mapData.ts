// Redrawn from the user's photographed Shanghai History Museum visitor guide.
// Coordinates are normalized for an accessible schematic, not a measured CAD plan.
export type Point = [number, number];
export type Region = {
  id: string;
  number?: string;
  title: string;
  subtitle: string;
  points: Point[];
  label: Point;
  description: string;
  reference?: string;
  related?: string[];
};
export type Floor = {
  id: string;
  label: string;
  title: string;
  en: string;
  color: string;
  regions: Region[];
  services: string[];
};
export const footprint: Point[] = [
  [20, 190],
  [45, 190],
  [45, 145],
  [110, 145],
  [110, 95],
  [180, 95],
  [180, 25],
  [440, 25],
  [440, 10],
  [510, 10],
  [510, 25],
  [690, 25],
  [690, 55],
  [790, 55],
  [790, 105],
  [850, 105],
  [850, 145],
  [900, 145],
  [900, 300],
  [535, 300],
  [535, 315],
  [440, 315],
  [440, 300],
  [20, 300],
];
export const floors: Floor[] = [
  {
    id: "1",
    label: "1F",
    title: "序厅与特展厅",
    en: "Lobby & Special Exhibition Hall",
    color: "#cbb3ba",
    services: [
      "电梯",
      "楼梯",
      "扶梯",
      "服务中心",
      "导览租借",
      "AR眼镜租借",
      "寄存处",
      "卫生间",
      "无障碍卫生间",
      "母婴设施",
      "饮水处",
    ],
    regions: [
      {
        id: "lobby",
        title: "序厅",
        subtitle: "Lobby",
        points: [
          [180, 105],
          [340, 105],
          [340, 165],
          [440, 165],
          [440, 290],
          [180, 290],
        ],
        label: [300, 210],
        description:
          "导览册中序厅位于东楼一层左侧，服务中心与导览租借位于其左侧公共服务区。可先在服务中心了解展览，再按自己的兴趣选择楼层。",
        related: ["chair"],
      },
      {
        id: "special",
        title: "特展厅",
        subtitle: "Special Exhibition Hall",
        points: [
          [600, 105],
          [655, 105],
          [655, 160],
          [850, 160],
          [850, 290],
          [600, 290],
        ],
        label: [740, 225],
        description:
          "位于东楼一层右侧。这里仅重绘特展厅空间，不把历史活动信息当作当前正在展出的内容；具体展览与开放安排以馆方现场公告为准。",
      },
    ],
  },
  {
    id: "M",
    label: "M",
    title: "夹层 · 公共服务区",
    en: "Mezzanine · Public Services",
    color: "#b9c5bc",
    services: ["电梯", "楼梯", "扶梯", "卫生间", "无障碍卫生间", "饮水处"],
    regions: [
      {
        id: "mezzanine",
        title: "公共服务区",
        subtitle: "Mezzanine",
        points: [
          [180, 30],
          [850, 30],
          [850, 110],
          [650, 110],
          [650, 270],
          [440, 270],
          [440, 115],
          [180, 115],
        ],
        label: [540, 185],
        description:
          "中文导览册在一层与二层之间单列M夹层，标示为观众服务空间。按册中环绕中部空间的关系重绘，不作为额外展厅，也不添加未标出的店铺。",
      },
    ],
  },
  {
    id: "2",
    label: "2F",
    title: "古代上海",
    en: "Ancient Shanghai",
    color: "#cbb472",
    services: ["电梯", "楼梯", "扶梯", "卫生间", "无障碍卫生间", "饮水处"],
    regions: [
      {
        id: "g1",
        number: "1",
        title: "海上初曙 · 远古华章",
        subtitle: "Early Glories of Ancient Shanghai",
        points: [
          [180, 165],
          [510, 165],
          [510, 215],
          [455, 215],
          [455, 290],
          [180, 290],
        ],
        label: [320, 230],
        description:
          "导览册以马家浜、崧泽、良渚以及钱山漾、广富林、马桥等时期串起上海的早期故事。",
        reference:
          "导览册举例：玉琮（上海博物馆藏）。这是册中所列重点文物，不表示本原型已确认其当前借展状态或具体柜位。",
      },
      {
        id: "g2",
        number: "2",
        title: "云间溢彩 · 沪滨扬帆",
        subtitle: "Shanghai’s Rise by the River",
        points: [
          [550, 165],
          [850, 165],
          [850, 290],
          [620, 290],
          [620, 220],
          [550, 220],
        ],
        label: [727, 230],
        description:
          "从青龙港到上海港，导览册以水路、港口和城镇发展介绍古代上海。空间位于二层右侧，与左侧的1号展区相对应。",
        reference: "导览册重点文物：豫园宴乐图。具体柜位未标出。",
      },
    ],
  },
  {
    id: "3",
    label: "3F",
    title: "近代上海 · 开埠与转型",
    en: "Modern Shanghai · Galleries 3–6",
    color: "#c49a73",
    services: ["电梯", "楼梯", "扶梯", "卫生间", "无障碍卫生间", "饮水处"],
    regions: [
      {
        id: "g3",
        number: "3",
        title: "上海开埠 · 国中之国",
        subtitle: "Shanghai’s Opening as a Treaty Port",
        points: [
          [430, 30],
          [590, 30],
          [590, 95],
          [480, 95],
          [480, 150],
          [430, 150],
        ],
        label: [505, 72],
        description:
          "介绍上海被迫开埠、租界设立与城市格局变化。按导览册位置，3号区位于三层上侧中部。",
        reference: "导览册重点文物：陈化成像；未标明具体展柜位置。",
      },
      {
        id: "g4",
        number: "4",
        title: "中西交汇 · 城市转型",
        subtitle: "Convergence of East and West",
        points: [
          [590, 30],
          [675, 30],
          [675, 90],
          [830, 90],
          [830, 270],
          [770, 270],
          [770, 175],
          [520, 175],
          [520, 125],
          [590, 125],
        ],
        label: [731, 132],
        description:
          "从城市建设与管理的变化，理解上海由传统县城向近代城市的转型。按导览册重绘为三层上部向右侧延展的展区。",
        reference: "导览册重点文物：外白渡桥铭牌。",
        related: ["print"],
      },
      {
        id: "g5",
        number: "5",
        title: "辛亥革命 · 上海光复",
        subtitle: "The 1911 Revolution",
        points: [
          [520, 175],
          [770, 175],
          [770, 270],
          [585, 270],
          [585, 220],
          [520, 220],
        ],
        label: [678, 221],
        description:
          "导览册以1911年上海响应武昌起义、成立沪军都督府为这一部分的历史线索。位于三层右下侧，与4号区相邻。",
        reference: "导览册重点文物：行书总统候选人提名斗方。",
      },
      {
        id: "g6",
        number: "6",
        title: "中共创建 · 开天辟地",
        subtitle: "The Founding of the Communist Party of China",
        points: [
          [180, 155],
          [480, 155],
          [480, 215],
          [420, 215],
          [420, 290],
          [180, 290],
        ],
        label: [313, 225],
        description:
          "导览册介绍中国共产党在上海成立以及此后党中央在上海开展工作的历史。位于三层左下侧。",
        reference:
          "导览册标注：1920年9月版《共产党宣言》（上海中共一大会址纪念馆藏）。借展与当前陈列状态需另行核实。",
      },
    ],
  },
  {
    id: "4",
    label: "4F",
    title: "近代上海 · 都市与新生",
    en: "Modern Shanghai · Galleries 7–9",
    color: "#ba8170",
    services: ["电梯", "楼梯", "扶梯", "卫生间", "无障碍卫生间", "饮水处"],
    regions: [
      {
        id: "g7",
        number: "7",
        title: "经济中心 · 远东都会",
        subtitle: "Economic Hub: Metropolis of the Far East",
        points: [
          [180, 95],
          [425, 95],
          [425, 30],
          [690, 30],
          [690, 90],
          [745, 90],
          [745, 165],
          [530, 165],
          [530, 215],
          [480, 215],
          [480, 165],
          [180, 165],
        ],
        label: [555, 102],
        description:
          "导览册围绕1920年代至1930年代中期的经济、文化与城市生活展开，同时呈现贫富差距与社会矛盾。位于四层上侧。",
        reference: "导览册重点文物：民国旗袍。",
        related: ["radio", "print"],
      },
      {
        id: "g8",
        number: "8",
        title: "同心戮力 · 抗击日寇",
        subtitle: "United in Resistance",
        points: [
          [530, 165],
          [790, 165],
          [790, 255],
          [845, 255],
          [845, 290],
          [605, 290],
          [605, 250],
          [530, 250],
        ],
        label: [700, 223],
        description: "导览册讲述淞沪抗战及全民族抗战中的上海。位于四层右下侧。",
        reference: "导览册重点文物：《义勇军进行曲》首版唱片。",
      },
      {
        id: "g9",
        number: "9",
        title: "争取民主 · 都市新生",
        subtitle: "Shanghai’s Rebirth",
        points: [
          [180, 165],
          [480, 165],
          [480, 250],
          [420, 250],
          [420, 290],
          [180, 290],
        ],
        label: [320, 223],
        description:
          "导览册以抗战胜利后上海的民主爱国运动及1949年5月27日上海解放等历史为线索。位于四层左下侧。",
        reference: "导览册重点文物：入城纪律。",
      },
    ],
  },
  {
    id: "5",
    label: "5F",
    title: "屋顶花园",
    en: "Roof Garden",
    color: "#a4b5b6",
    services: ["电梯", "楼梯", "餐饮区"],
    regions: [
      {
        id: "garden",
        title: "屋顶花园",
        subtitle: "Roof Garden",
        points: [
          [180, 30],
          [850, 30],
          [850, 105],
          [900, 105],
          [900, 290],
          [645, 290],
          [645, 270],
          [440, 270],
          [440, 290],
          [180, 290],
        ],
        label: [350, 170],
        description:
          "导览册将五层标为屋顶花园，中文立体导览同时标有餐饮符号。仅还原其空间关系，不绘制未经资料支持的植物、座椅或当前店铺布局。",
      },
      {
        id: "dining",
        title: "餐饮区",
        subtitle: "Dining · per visitor guide",
        points: [
          [470, 90],
          [630, 90],
          [630, 250],
          [470, 250],
        ],
        label: [552, 172],
        description:
          "位置依据中文导览册五层餐饮符号重绘。餐饮经营、开放状态和实际边界以现场为准，不提供未经核实的餐厅品牌或预约链接。",
      },
    ],
  },
];
export const regionById = (id: string) =>
  floors.flatMap((f) => f.regions).find((r) => r.id === id);
