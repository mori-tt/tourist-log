export interface Prefecture {
  id: number;
  code: string;
  name: string;
  nameEn: string;
  region: string;
}

export const prefectures: Prefecture[] = [
  {
    id: 1,
    code: "hokkaido",
    name: "北海道",
    nameEn: "Hokkaido",
    region: "北海道",
  },
  { id: 2, code: "aomori", name: "青森県", nameEn: "Aomori", region: "東北" },
  { id: 3, code: "iwate", name: "岩手県", nameEn: "Iwate", region: "東北" },
  { id: 4, code: "miyagi", name: "宮城県", nameEn: "Miyagi", region: "東北" },
  { id: 5, code: "akita", name: "秋田県", nameEn: "Akita", region: "東北" },
  {
    id: 6,
    code: "yamagata",
    name: "山形県",
    nameEn: "Yamagata",
    region: "東北",
  },
  {
    id: 7,
    code: "fukushima",
    name: "福島県",
    nameEn: "Fukushima",
    region: "東北",
  },
  { id: 8, code: "ibaraki", name: "茨城県", nameEn: "Ibaraki", region: "関東" },
  { id: 9, code: "tochigi", name: "栃木県", nameEn: "Tochigi", region: "関東" },
  { id: 10, code: "gunma", name: "群馬県", nameEn: "Gunma", region: "関東" },
  {
    id: 11,
    code: "saitama",
    name: "埼玉県",
    nameEn: "Saitama",
    region: "関東",
  },
  { id: 12, code: "chiba", name: "千葉県", nameEn: "Chiba", region: "関東" },
  { id: 13, code: "tokyo", name: "東京都", nameEn: "Tokyo", region: "関東" },
  {
    id: 14,
    code: "kanagawa",
    name: "神奈川県",
    nameEn: "Kanagawa",
    region: "関東",
  },
  {
    id: 15,
    code: "niigata",
    name: "新潟県",
    nameEn: "Niigata",
    region: "中部",
  },
  { id: 16, code: "toyama", name: "富山県", nameEn: "Toyama", region: "中部" },
  {
    id: 17,
    code: "ishikawa",
    name: "石川県",
    nameEn: "Ishikawa",
    region: "中部",
  },
  { id: 18, code: "fukui", name: "福井県", nameEn: "Fukui", region: "中部" },
  {
    id: 19,
    code: "yamanashi",
    name: "山梨県",
    nameEn: "Yamanashi",
    region: "中部",
  },
  { id: 20, code: "nagano", name: "長野県", nameEn: "Nagano", region: "中部" },
  { id: 21, code: "gifu", name: "岐阜県", nameEn: "Gifu", region: "中部" },
  {
    id: 22,
    code: "shizuoka",
    name: "静岡県",
    nameEn: "Shizuoka",
    region: "中部",
  },
  { id: 23, code: "aichi", name: "愛知県", nameEn: "Aichi", region: "中部" },
  { id: 24, code: "mie", name: "三重県", nameEn: "Mie", region: "関西" },
  { id: 25, code: "shiga", name: "滋賀県", nameEn: "Shiga", region: "関西" },
  { id: 26, code: "kyoto", name: "京都府", nameEn: "Kyoto", region: "関西" },
  { id: 27, code: "osaka", name: "大阪府", nameEn: "Osaka", region: "関西" },
  { id: 28, code: "hyogo", name: "兵庫県", nameEn: "Hyogo", region: "関西" },
  { id: 29, code: "nara", name: "奈良県", nameEn: "Nara", region: "関西" },
  {
    id: 30,
    code: "wakayama",
    name: "和歌山県",
    nameEn: "Wakayama",
    region: "関西",
  },
  {
    id: 31,
    code: "tottori",
    name: "鳥取県",
    nameEn: "Tottori",
    region: "中国",
  },
  {
    id: 32,
    code: "shimane",
    name: "島根県",
    nameEn: "Shimane",
    region: "中国",
  },
  {
    id: 33,
    code: "okayama",
    name: "岡山県",
    nameEn: "Okayama",
    region: "中国",
  },
  {
    id: 34,
    code: "hiroshima",
    name: "広島県",
    nameEn: "Hiroshima",
    region: "中国",
  },
  {
    id: 35,
    code: "yamaguchi",
    name: "山口県",
    nameEn: "Yamaguchi",
    region: "中国",
  },
  {
    id: 36,
    code: "tokushima",
    name: "徳島県",
    nameEn: "Tokushima",
    region: "四国",
  },
  { id: 37, code: "kagawa", name: "香川県", nameEn: "Kagawa", region: "四国" },
  { id: 38, code: "ehime", name: "愛媛県", nameEn: "Ehime", region: "四国" },
  { id: 39, code: "kochi", name: "高知県", nameEn: "Kochi", region: "四国" },
  {
    id: 40,
    code: "fukuoka",
    name: "福岡県",
    nameEn: "Fukuoka",
    region: "九州沖縄",
  },
  { id: 41, code: "saga", name: "佐賀県", nameEn: "Saga", region: "九州沖縄" },
  {
    id: 42,
    code: "nagasaki",
    name: "長崎県",
    nameEn: "Nagasaki",
    region: "九州沖縄",
  },
  {
    id: 43,
    code: "kumamoto",
    name: "熊本県",
    nameEn: "Kumamoto",
    region: "九州沖縄",
  },
  { id: 44, code: "oita", name: "大分県", nameEn: "Oita", region: "九州沖縄" },
  {
    id: 45,
    code: "miyazaki",
    name: "宮崎県",
    nameEn: "Miyazaki",
    region: "九州沖縄",
  },
  {
    id: 46,
    code: "kagoshima",
    name: "鹿児島県",
    nameEn: "Kagoshima",
    region: "九州沖縄",
  },
  {
    id: 47,
    code: "okinawa",
    name: "沖縄県",
    nameEn: "Okinawa",
    region: "九州沖縄",
  },
];

// 地方ごとの都道府県リストを取得する関数
export function getPrefecturesByRegion(): Record<string, Prefecture[]> {
  return prefectures.reduce((acc, prefecture) => {
    if (!acc[prefecture.region]) {
      acc[prefecture.region] = [];
    }
    acc[prefecture.region].push(prefecture);
    return acc;
  }, {} as Record<string, Prefecture[]>);
}

// 地方リストを取得
export function getRegions(): string[] {
  return [...new Set(prefectures.map((prefecture) => prefecture.region))];
}

// 都道府県コードから都道府県を取得
export function getPrefectureByCode(code: string): Prefecture | undefined {
  return prefectures.find((prefecture) => prefecture.code === code);
}
