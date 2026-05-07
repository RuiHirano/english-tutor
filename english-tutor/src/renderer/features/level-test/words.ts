export type CefrBand = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LevelWord {
  term: string;
  meaning: string;
  band: CefrBand;
}

export const LEVEL_WORDS: LevelWord[] = [
  // A1: 日常基礎
  { term: 'book', meaning: '本', band: 'A1' },
  { term: 'house', meaning: '家', band: 'A1' },
  { term: 'eat', meaning: '食べる', band: 'A1' },
  { term: 'mother', meaning: '母親', band: 'A1' },
  { term: 'tomorrow', meaning: '明日', band: 'A1' },
  { term: 'school', meaning: '学校', band: 'A1' },
  { term: 'happy', meaning: '幸せな', band: 'A1' },
  { term: 'breakfast', meaning: '朝食', band: 'A1' },
  { term: 'morning', meaning: '朝', band: 'A1' },
  { term: 'friend', meaning: '友達', band: 'A1' },

  // A2: 旅行・日常会話
  { term: 'vacation', meaning: '休暇', band: 'A2' },
  { term: 'decide', meaning: '決める', band: 'A2' },
  { term: 'neighbor', meaning: '近所の人', band: 'A2' },
  { term: 'borrow', meaning: '借りる', band: 'A2' },
  { term: 'busy', meaning: '忙しい', band: 'A2' },
  { term: 'invite', meaning: '招待する', band: 'A2' },
  { term: 'arrive', meaning: '到着する', band: 'A2' },
  { term: 'forget', meaning: '忘れる', band: 'A2' },
  { term: 'expensive', meaning: '高価な', band: 'A2' },
  { term: 'remember', meaning: '覚えている', band: 'A2' },

  // B1: 日常 + 抽象の入口
  { term: 'recommend', meaning: '推薦する', band: 'B1' },
  { term: 'available', meaning: '利用可能な', band: 'B1' },
  { term: 'opportunity', meaning: '機会', band: 'B1' },
  { term: 'reduce', meaning: '減らす', band: 'B1' },
  { term: 'environment', meaning: '環境', band: 'B1' },
  { term: 'experience', meaning: '経験', band: 'B1' },
  { term: 'nervous', meaning: '緊張した', band: 'B1' },
  { term: 'recently', meaning: '最近', band: 'B1' },
  { term: 'consider', meaning: '考慮する', band: 'B1' },
  { term: 'familiar', meaning: '見慣れた', band: 'B1' },

  // B2: ビジネス・社会
  { term: 'significant', meaning: '重要な', band: 'B2' },
  { term: 'encounter', meaning: '遭遇する', band: 'B2' },
  { term: 'manage', meaning: '何とか〜する／管理する', band: 'B2' },
  { term: 'demonstrate', meaning: '示す・実証する', band: 'B2' },
  { term: 'efficient', meaning: '効率的な', band: 'B2' },
  { term: 'inevitable', meaning: '避けられない', band: 'B2' },
  { term: 'priority', meaning: '優先事項', band: 'B2' },
  { term: 'ambiguous', meaning: '曖昧な', band: 'B2' },
  { term: 'collaborate', meaning: '協力する', band: 'B2' },
  { term: 'sufficient', meaning: '十分な', band: 'B2' },

  // C1: 学術・専門
  { term: 'substantial', meaning: '相当な', band: 'C1' },
  { term: 'undertake', meaning: '引き受ける・着手する', band: 'C1' },
  { term: 'scrutinize', meaning: '精査する', band: 'C1' },
  { term: 'pertinent', meaning: '適切な・関連した', band: 'C1' },
  { term: 'mitigate', meaning: '緩和する', band: 'C1' },
  { term: 'discrepancy', meaning: '食い違い', band: 'C1' },
  { term: 'compelling', meaning: '説得力のある', band: 'C1' },
  { term: 'comprehensive', meaning: '包括的な', band: 'C1' },
  { term: 'leverage', meaning: '〜を活用する', band: 'C1' },
  { term: 'streamline', meaning: '合理化する', band: 'C1' },

  // C2: 慣用・難語・微妙な含意
  { term: 'ubiquitous', meaning: '至る所にある', band: 'C2' },
  { term: 'bemused', meaning: '困惑した', band: 'C2' },
  { term: 'ostensibly', meaning: '表向きは', band: 'C2' },
  { term: 'quintessential', meaning: '典型的な', band: 'C2' },
  { term: 'circumvent', meaning: '回避する', band: 'C2' },
  { term: 'innocuous', meaning: '無害な', band: 'C2' },
  { term: 'a wild goose chase', meaning: '無駄足／徒労', band: 'C2' },
  { term: 'beat around the bush', meaning: '遠回しに言う', band: 'C2' },
  { term: 'serendipity', meaning: '偶然の発見', band: 'C2' },
  { term: 'penchant', meaning: '強い好み', band: 'C2' },
];

export const BANDS: CefrBand[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

export interface BandResult {
  band: CefrBand;
  known: number;
  total: number;
  ratio: number;
}

const KNOWN_THRESHOLD = 0.7;

/**
 * 各バンドで KNOWN_THRESHOLD 以上を知っていればクリアとみなす。
 * ユーザーのレベル = クリアした最高バンド。A1 もクリアできない場合は "A1未満" 扱い。
 */
export function estimateLevel(answers: Record<string, boolean>): {
  level: CefrBand | 'A1未満';
  perBand: BandResult[];
} {
  const perBand: BandResult[] = BANDS.map((band) => {
    const items = LEVEL_WORDS.filter((w) => w.band === band);
    const known = items.filter((w) => answers[w.term] === true).length;
    return { band, known, total: items.length, ratio: items.length === 0 ? 0 : known / items.length };
  });

  let highest: CefrBand | null = null;
  for (const r of perBand) {
    if (r.ratio >= KNOWN_THRESHOLD) highest = r.band;
    else break;
  }
  return { level: highest ?? 'A1未満', perBand };
}
