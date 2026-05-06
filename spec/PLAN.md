# 英語学習システム 設計ドキュメント

## 1. 概要

第二言語習得（SLA）研究の知見に基づいた英語学習システム。Kiro CLIエージェントとして実装し、3〜4日サイクルで1つの教材を多角的に使い倒す学習フローを自動進行させる。学習履歴はSQLiteに保存し、Streamlitダッシュボードで可視化する。

### 設計の理論的背景

- **インプット仮説（Krashen）**：理解可能なインプット（i+1）を大量に浴びることが習得の鍵
- **アウトプット仮説（Swain）**：話す・書くことで「言えない部分」に気づき、習得が進む
- **インタラクション仮説（Long）**：意味交渉を伴う会話が習得を促進
- **間隔反復**：忘れかけたタイミングでの復習で長期記憶に定着
- **深い処理（Craik & Lockhart）**：同じ素材を多角的に処理するほど記憶に定着

## 2. 技術スタック

| レイヤー | 技術 |
|---------|------|
| エージェント基盤 | Kiro CLI / claude code |
| AI | Claude API（教材生成・問題生成・スピーキング評価） |
| 音声出力 | macOS say コマンド |
| 音声入力 | Kiro/claude code標準の音声入力機能 |
| データベース | SQLite |
| ダッシュボード | Streamlit |
| 言語 | Python |

## 3. 学習フロー

### 前提：パーソナライズ
学習者の目的（ビジネス・日常会話・旅行など）、レベル、興味分野を初期設定。教材生成時に反映する。

### サイクル構成（1素材を3日で使い倒す）

#### Day 1：導入とインプット

**1. 教材作成**
パーソナライズ設定に基づいてコア素材1本＋多聴用の別素材を数本生成。

**2. 語彙・文法・表現のインプット**
コア素材から重要項目を抽出して問題化。
- 意味選択（4択）
- 穴埋め
- 日本語→英語

復習プールから過去問題を最大25%混在。

**3. 多聴**
コア素材で全体把握（2〜3回）。
その後以下の問題を出題。
- 選択式の内容把握（4択）
- True/False


別素材および過去素材の多聴も実施 (1~2回)。
こちらは問題必要ない。


**4. 精聴・ディクテーション**
コア素材の細部を聞き取る。
- 部分ディクテーション
- 機能語ディクテーション
- 全文ディクテーション

復習プールから過去問題を最大25%混在。

#### Day 2：自動化とアウトプット

**5. シャドーイング**
スクリプトなしでコア素材を追いかけて発声。1素材につき3〜5回繰り返し。新素材の後に、復習プールから過去問題を1~2本追加。

**6. スピーキング**
- 日本語→英語の即答（パターンプラクティス）
- 音読＋暗唱（リプロダクション）

詰まった表現・直された表現をデータベースに記録 → 次素材で再出題。

**7. リテンションテスト**
指定表現を使った自由スピーチ。「today's expressions（〇〇、△△、××）を使って自分の経験を話して」形式。

#### Day 3：復習
- 語彙・表現の再テスト（間違えたもの中心）
- 精聴の弱点箇所のみ再聴
- シャドーイング2〜3回

#### Day 4：新素材へ移行
前のコア素材は復習プールに移行し、間隔反復で再登場する。

### 1日の学習時間目安
- Day 1：30〜45分
- Day 2：30〜45分
- Day 3：30〜45分
- 別素材の多聴：通勤中などのスキマ時間で毎日10〜15分

### 横断的な仕組み

#### 復習プール（間隔反復の管理基盤）
学習した語彙・問題・素材をすべて登録。間隔反復ロジック（1日→3日→1週間→2週間→1ヶ月）で次回出題日を管理。各工程で新規＋復習プールから出題する。

- 工程2の語彙：過去項目を最大25%混在
- 工程4の精聴：過去素材から最大25%混在
- 工程5のシャドーイング：新素材の後に過去素材1~2本追加
- 多聴：1ヶ月以上経った素材は「軽く聞き直し」枠で再登場

#### 言えなかった表現の回収サイクル
工程6・7で詰まった表現や直された表現 → DBに記録 → 次素材の工程6・7で再出題。Swainのアウトプット仮説に基づくサイクルの完結。

#### 自己モニタリング
- 正答率の推移グラフ
- 弱点傾向の分析（冠詞・前置詞・リスニングの弱形など）
- 累積学習時間・カバーした語彙数の可視化

## 4. システム構成

┌─────────────────────────────────────────────┐
│  ユーザー                                    │
└──────────┬──────────────────┬───────────────┘
           │                   │
           ▼                   ▼
┌──────────────────┐  ┌──────────────────────┐
│  Kiro CLI/claude │  │  Streamlit            │
│  english-tutor   │  │  ダッシュボード        │
│  エージェント      │  │                       │
└──────────┬───────┘  └──────────┬────────────┘
           │                      │
           └──────────┬───────────┘
                      ▼
           ┌──────────────────────┐
           │  SQLite              │
           │  (data/learning.db)  │
           └──────────────────────┘

### 役割分担
- **Kiro CLI/claude code（english-tutor）**：学習セッションの実行（教材生成・問題出題・採点・記録）
- **Streamlit**：学習履歴の可視化、進捗確認、復習プールの状態確認
- **SQLite**：すべてのデータを永続化

## 5. ディレクトリ構成

```
english-tutor/
├── README.md
├── pyproject.toml
├── CLAUDE.md                          # flow-controller の常駐指示（Day判定・工程順序・全体ルール）
│
├── .claude/
│   └── skills/
│       ├── start/SKILL.md             # /start：エントリポイント
│       ├── phase-vocab/SKILL.md       # 工程2：語彙・文法・表現インプット
│       ├── phase-listening/SKILL.md   # 工程3：多聴
│       ├── phase-dictation/SKILL.md   # 工程4：精聴・ディクテーション
│       ├── phase-shadowing/SKILL.md   # 工程5：シャドーイング
│       ├── phase-speaking/SKILL.md    # 工程6・7：スピーキング・リテンション
│       ├── phase-review/SKILL.md      # Day 3 復習工程
│       ├── material-new/SKILL.md      # 工程1：新素材生成の手順
│       └── question-generate/SKILL.md # 素材から問題化する手順
│
├── .kiro/
│   ├── agents/english-tutor.{json,md} # Kiro エージェント定義
│   └── skills/                        # .claude/skills と同内容
│
├── src/english_tutor/
│   ├── db/
│   │   ├── schema.sql                 # 初期スキーマ
│   │   └── connection.py
│   ├── flow/day_resolver.py           # 進行中サイクル → 当日メニュー構築
│   ├── review/spaced_rep.py           # 1d→3d→1w→2w→1m の間隔反復
│   └── audio/tts.py                   # macOS say ラッパー
│
├── dashboard/
│   ├── app.py                         # Streamlit エントリ
│   └── pages/                         # progress, weakness, review_pool, materials
│
├── config/
│   └── user.yaml                      # 学習者プロフィール（goal, level, interests）
│
├── data/                              # gitignore（.gitkeep のみ追跡）
│   ├── learning.db                    # SQLite 本体
│   └── audio/                         # say で生成した音声キャッシュ
│
├── tests/
├── spec/PLAN.md
└── study                              # 起動シェルスクリプト（Streamlit + Kiro 起動）
```

### 設計方針

- **メインスレッド = flow-controller**：`CLAUDE.md` に当日の進行ロジックを書き、`/start` で発火する
- **skill = 工程ごとの手順書**：ユーザーとの一問一答は skill 内で完結（subagent を使わない A 案）
- **DB アクセスは CLI 抽象を作らない**：
  - 単純な CRUD（解答記録・出題候補取得）→ skill から `sqlite3 data/learning.db -json "..."` を直接叩く
  - 複雑なロジック（Day判定・間隔反復スコア更新）→ `python -m english_tutor.flow.day` のように Python モジュールを直接実行
- **`.claude/skills` を正、`.kiro/skills` をシンボリックリンク**で同期

## 6. データベース設計

SQLite。スキーマは5テーブルでフラットに保つ。固定的な「Day1-3 サイクル」は持たず、`vocabulary_items` の習熟度・出現履歴から動的にスコアリングして、agent がその語彙を題材に新しい問題を都度生成する。

### テーブル一覧

| テーブル | 役割 |
|---|---|
| `user_profile` | 学習者設定（singleton 1行） |
| `materials` | 教材本体（script + 学習統計） |
| `vocabulary_items` | 学習対象（語彙・文法・表現）+ 出題統計。**スコアリングの主体** |
| `sessions` | 学習活動の記録（material × phase × 時刻） |
| `questions` | **過去のQ&A記録**（出題内容・解答・正誤）。出題統計は持たず、純粋な履歴ログ |

### テーブル間の関係

```
materials  1 ─── N  vocabulary_items   （素材から抽出された学習項目）
materials  1 ─── N  sessions           （どの素材を学習したか）
materials  1 ─── N  questions          （どの素材を題材にしたか）
sessions   1 ─── N  questions          （セッション内で出題したQ&A）
vocabulary_items 1 ─── N questions     （どの語彙を題材にしたか、語彙系のみ）
```

- **1セッション = 1素材 × 1フェーズ**。複数素材を続けて多聴したら複数セッション
- `cycles` テーブルは持たない。「今やるべきこと」は agent が `vocabulary_items` の due_score と sessions の履歴から推論する
- 同じ語彙でも毎回新しい問題文・出題形式で出題される（agent が都度生成）。`questions` は再利用されない記録用ログ

### スキーマ

```sql
CREATE TABLE user_profile (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  goal TEXT NOT NULL,
  level TEXT NOT NULL,            -- CEFR (A1〜C2)
  interests TEXT NOT NULL
);

CREATE TABLE materials (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  script TEXT NOT NULL,
  -- 統計 --
  total_appearances INTEGER NOT NULL DEFAULT 0,    -- 総学習回数（この素材を扱ったセッション数）
  last_appeared_at TEXT,                            -- 最後に学習した日時
  mastery_level INTEGER NOT NULL DEFAULT 0,        -- 習熟度（0:未学習 / 1:認識 / 2:使用 / 3:自動化）
  started_at TEXT,                                  -- 最初に学習を開始した日時
  ended_at TEXT,                                -- 学習を完了した日時
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vocabulary_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material_id INTEGER REFERENCES materials(id),
    term TEXT NOT NULL,                               -- 語・句・文法パターン
    meaning TEXT,
    type TEXT,                                         -- vocab / grammar / expression
    -- 統計 --
    total_appearances INTEGER NOT NULL DEFAULT 0,     -- 総出現回数
    last_appeared_at TEXT,                             -- 最後に出現した日時
    mastery_level INTEGER NOT NULL DEFAULT 0,         -- 習熟度（0:未学習 / 1:認識 / 2:使用 / 3:自動化）
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sessions (
  id INTEGER PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  phase TEXT NOT NULL,            -- vocab|listening|dictation|shadowing|speaking|review|extensive_listening
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  ended_at TEXT
);

CREATE TABLE questions (
  id INTEGER PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  material_id INTEGER NOT NULL REFERENCES materials(id),
  vocabulary_item_id INTEGER REFERENCES vocabulary_items(id),  -- 語彙系の場合のみ。listening/dictation 等は NULL
  phase TEXT NOT NULL,                                          -- vocab|listening|dictation|speaking
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  is_correct INTEGER NOT NULL,                                  -- 0/1
  feedback TEXT,
  asked_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_vocab_due ON vocabulary_items(type, last_appeared_at);
CREATE INDEX idx_questions_vocab ON questions(vocabulary_item_id, asked_at);
CREATE INDEX idx_questions_session ON questions(session_id);
CREATE INDEX idx_sessions_material ON sessions(material_id, started_at);
```

### 設計上の判断

#### 出題スコアリングは `vocabulary_items` 基準

出題候補の選定は `vocabulary_items` の習熟度と最終出現日時から計算する。`questions` は記録用なのでスコアリングには使わない：

```
interval_days = 2^mastery_level                              -- mastery 0:1d, 1:2d, 2:4d, 3:8d
days_elapsed  = julianday('now') - julianday(last_appeared_at)
due_score     = days_elapsed - interval_days                 -- >0 で出題対象、大きいほど優先
```

新規語彙（`last_appeared_at IS NULL`）は最大優先で扱う。

出題候補クエリ：

```sql
SELECT id, term, meaning, type, mastery_level, total_appearances,
  CASE
    WHEN last_appeared_at IS NULL THEN 1e9
    ELSE (julianday('now') - julianday(last_appeared_at)) - POWER(2, mastery_level)
  END AS due_score
FROM vocabulary_items
WHERE type = :type             -- 'vocab' | 'grammar' | 'expression'
ORDER BY due_score DESC
LIMIT :n;
```

#### agent が問題を都度生成し、Q&A を `questions` に記録

agent はスコアリングで選ばれた `vocabulary_items` を題材として、毎回新しい問題文と出題形式（4択／穴埋め／日→英／…）を Claude API で生成する。`questions` は再利用されない一回限りの記録：

```sql
-- 出題後、回答内容を記録
INSERT INTO questions
  (session_id, material_id, vocabulary_item_id, phase,
   question_text, correct_answer, user_answer, is_correct, feedback)
VALUES (...);

-- 同時に対象 vocabulary_item の統計を更新
UPDATE vocabulary_items
SET total_appearances = total_appearances + 1,
    last_appeared_at  = CURRENT_TIMESTAMP
WHERE id = :vocabulary_item_id;
```

`mastery_level` は単発の正誤で機械的に上下させず、agent が直近の `questions` 履歴を見て昇格／降格を判断（連続正解、出題形式の多様性、誤答の質などを考慮）。

#### Day 1/2/3 のリズムは agent が動的に推論

`cycles` テーブルを持たず、「今やるべき phase」は agent が以下から判断：

- 新素材：`vocabulary_items` で `last_appeared_at IS NULL` が大量 → 自然に集中学習（工程2〜4）
- 数日経過：vocab の `mastery_level` が上がり due_score が下がる → shadowing/speaking フェーズへ進む判断
- 1週間以上経過：due_score が高い項目が散在 → 復習中心
- shadowing/extensive_listening の実施判断：sessions 履歴を見て「最後に shadowing したのはいつか」「多聴回数」を確認

「Day 1/2/3」は強制ではなく、PLAN §3 の学習リズムに沿った agent の判断指針として残す。

#### 「詰まった表現」は `questions` から導出

専用テーブル `struggled_expressions` を作らず、`questions` のクエリで導出する。次素材生成時の入力：

```sql
-- 直近で失敗し、その後正解していない vocabulary_items
SELECT v.id, v.term, v.meaning, v.type
FROM vocabulary_items v
WHERE EXISTS (
  SELECT 1 FROM questions q
  WHERE q.vocabulary_item_id = v.id
    AND q.is_correct = 0
    AND NOT EXISTS (
      SELECT 1 FROM questions q2
      WHERE q2.vocabulary_item_id = v.id
        AND q2.is_correct = 1
        AND q2.asked_at > q.asked_at
    )
);
```

`vocabulary_item_id` で素材横断の同一表現を厳密に識別できる。文字列一致のような曖昧さはない。

#### リテンションは「1表現 = 1問題」

工程7「A を使って話して」のように1表現ごとに1問。`questions.vocabulary_item_id` で対象表現を指す、`phase = 'speaking'`、`question_text` にお題（テーマ等）、`correct_answer` に使うべき表現を入れる。これにより全工程が `questions` の単一モデルで処理可能。

#### 多聴セッションも記録

問題なしでも `sessions.phase = 'extensive_listening'` で記録し、累積時間と素材接触履歴を追える。`materials.total_appearances` / `last_appeared_at` も session 終了時に更新する。

