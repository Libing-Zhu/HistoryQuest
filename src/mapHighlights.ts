import { chairPhoto } from "./media";
import type { Point } from "./mapData";
export type Highlight = {
  id: string;
  floor: string;
  region: string;
  name: string;
  short: string;
  anchor: Point;
  offset: Point;
  image: string;
  imageSource: string;
  sourceUrl?: string;
  note: string;
  openArtifact?: string;
  topicId?: string;
};
export const highlights: Highlight[] = [
  {
    id: "h-chair",
    floor: "1",
    region: "lobby",
    name: "物华号朱金百子大礼轿",
    short: "百子大礼轿",
    anchor: [290, 230],
    offset: [-5, -55],
    image: "../" + chairPhoto.image,
    imageSource: "小组现场照片",
    sourceUrl: "https://wenhui.whb.cn/zhuzhan/jqp/20220625/473527.html",
    note: "序厅范围参考：依据历史展陈报道，非当前精确展位；请现场核对。",
    openArtifact: "chair",
  },
  {
    id: "h-jade",
    floor: "2",
    region: "g1",
    name: "玉琮",
    short: "玉琮",
    anchor: [300, 235],
    offset: [-75, 70],
    image: "jade-guide.webp",
    imageSource: "用户提供馆方导览册：同件图像裁切",
    note: "导览册列于1号展区，并注明上海博物馆藏。借展及当前陈列状态待现场确认；不使用网上其他玉琮冒充。",
  },
  {
    id: "h-yuyuan",
    floor: "2",
    region: "g2",
    name: "豫园宴乐图",
    short: "豫园宴乐图",
    anchor: [725, 235],
    offset: [55, -55],
    image: "yuyuan-web.webp",
    imageSource: "文汇网《建筑可阅读｜走过四百余年的豫园》资料图",
    sourceUrl: "https://wenhui.whb.cn/zhuzhan/xinwen/20220107/442913.html",
    note: "按导览册归入2号展区。网络资料图与册中画面相符；具体柜位、是否展出原件需现场核实。",
  },
  {
    id: "h-chen",
    topicId: "chen-history",
    floor: "3",
    region: "g3",
    name: "陈化成像",
    short: "陈化成像",
    anchor: [500, 80],
    offset: [-20, -77],
    image: "chen-guide.webp",
    imageSource: "用户提供馆方导览册：同件图像裁切",
    sourceUrl:
      "https://whlyj.sh.gov.cn/cmsres/60/602f995e04104bab8fc479b39d07e94b/47e3f2fe6d3d38cb46fe39b303525d20.pdf",
    note: "导览册列于3号展区。官方一级文物目录另列“清 陈化成画像”；网络其他陈化成画像未确认同件，故不混用。",
  },
  {
    id: "h-bridge",
    topicId: "bridge-history",
    floor: "3",
    region: "g4",
    name: "外白渡桥铭牌",
    short: "外白渡桥铭牌",
    anchor: [780, 140],
    offset: [45, -60],
    image: "bridge-guide.webp",
    imageSource: "用户提供馆方导览册：同件图像裁切",
    sourceUrl:
      "https://www.shda.gov.cn/archives/gdxw/202601/t20260120_76430.html",
    note: "导览册列于4号展区。官方名录第644项列为1907年外白渡桥落成铜质铭牌；可从这件文物继续了解苏州河与城市交通。照片仍使用导览册同件裁切，位置仅表示所属区域。",
  },
  {
    id: "h-nomination",
    topicId: "nomination-history",
    floor: "3",
    region: "g5",
    name: "行书总统候选人提名斗方",
    short: "总统候选人提名斗方",
    anchor: [680, 235],
    offset: [20, 90],
    image: "nomination-guide.webp",
    imageSource: "用户提供馆方导览册：同件提名斗方图像裁切",
    sourceUrl: "https://www.jfdaily.com.cn/wx/detail.do?id=83893",
    note: "按导览册归入5号展区。检索到开馆报道可核对文物背景，但其旧图片链接已失效，因此使用导览册同件图像。",
  },
  {
    id: "h-manifesto",
    floor: "3",
    region: "g6",
    name: "《共产党宣言》早期中文译本",
    short: "《共产党宣言》",
    anchor: [300, 245],
    offset: [-45, 85],
    image: "manifesto-guide.webp",
    imageSource: "用户提供馆方导览册：所列9月版图像裁切",
    sourceUrl:
      "https://www.ccphistory.org.cn/shds/rlqzshjfqszn/content/e225fad9-b513-40c1-95ec-b9e93f894258.html",
    note: "导览册列于6号展区，注明一大会址纪念馆藏。上海党史网访谈区分1920年8月错版和9月正版；本点不将9月版称为错版，借展状态待确认。",
  },
  {
    id: "h-qipao",
    floor: "4",
    region: "g7",
    name: "民国旗袍",
    short: "民国旗袍",
    anchor: [550, 100],
    offset: [-25, -72],
    image: "qipao-guide.webp",
    imageSource: "用户提供馆方导览册：同件粉色无袖旗袍图像裁切",
    note: "导览册列于7号展区，英文册注明王水衷捐赠。检索到其他旗袍展图片，尚未确认同件，保留本件图像。",
  },
  {
    id: "h-record",
    floor: "4",
    region: "g8",
    name: "《义勇军进行曲》首版唱片",
    short: "《义勇军进行曲》唱片",
    anchor: [700, 235],
    offset: [70, -50],
    image: "record-guide.webp",
    imageSource: "用户提供馆方导览册：唱片图像裁切",
    sourceUrl:
      "https://whlyj.sh.gov.cn/yshd/20240731/25f12cf3a80441db8d1387c23d4c25d3.html",
    note: "导览册列于8号展区；文旅局文章可延伸阅读国歌与上海。网络其他馆展陈图不作为本馆当前柜位证据。",
  },
  {
    id: "h-discipline",
    floor: "4",
    region: "g9",
    name: "入城纪律",
    short: "入城纪律",
    anchor: [310, 235],
    offset: [-45, 80],
    image: "discipline-guide.webp",
    imageSource: "用户提供馆方导览册：同件图像裁切",
    sourceUrl: "https://www.shsmu.edu.cn/global/info/1005/1013.htm",
    note: "导览册列于9号展区。上海交通大学医学院参观报道亦提到本馆《入城纪律》；不以其他机构《入城手册》替代。",
  },
];
