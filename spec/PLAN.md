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

SQLite。スキーマは5テーブルでフラットに保つ。固定的な「Day1-3 サイクル」は持たず、questions の出題統計から動的にスコアリングして出題する。

### テーブル一覧

| テーブル | 役割 |
|---|---|
| `user_profile` | 学習者設定（singleton 1行） |
| `materials` | 教材本体（core / extensive） |
| `sessions` | 学習活動の記録（material × phase × 時刻） |
| `questions` | 問題 + 出題統計（ask_count, correct_count, last_asked_at） |
| `answers` | 解答記録（is_correct と feedback） |

### テーブル間の関係

```
materials  1 ─── N  sessions    （どの素材を学習したか）
materials  1 ─── N  questions   （素材から生成された問題）
sessions   1 ─── N  answers     （セッション内で解答した問題）
questions  1 ─── N  answers     （問題ごとの解答履歴）
```

- **1セッション = 1素材 × 1フェーズ**。複数素材を続けて多聴したら複数セッション
- `cycles` テーブルは持たない。「今やるべきこと」は agent が questions の `due_score` と sessions の履歴から推論する

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
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
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
  material_id INTEGER NOT NULL REFERENCES materials(id),
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  phase TEXT NOT NULL,            -- vocab|listening|dictation|speaking
  question_text TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  -- 統計 --
  total_attempts INTEGER NOT NULL DEFAULT 0,
  correct_attempts INTEGER NOT NULL DEFAULT 0,
  consecutive_correct INTEGER NOT NULL DEFAULT 0,
  last_attempted_at TEXT
);

CREATE TABLE answers (
  id INTEGER PRIMARY KEY,
  material_id INTEGER NOT NULL REFERENCES materials(id),
  session_id INTEGER NOT NULL REFERENCES sessions(id),
  question_id INTEGER NOT NULL REFERENCES questions(id),
  user_answer TEXT,
  is_correct INTEGER NOT NULL,    -- 0/1
  feedback TEXT,
  answered_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_questions_phase_last_asked ON questions(phase, last_asked_at);
CREATE INDEX idx_sessions_material ON sessions(material_id, started_at);
CREATE INDEX idx_answers_question ON answers(question_id);
```

### 設計上の判断

#### 出題は指数バックオフのスコアリング

固定の `next_review_at` を持たず、出題統計から動的に計算する：

```
fail_count    = ask_count - correct_count
interval_days = 2^(correct_count - fail_count)         -- 連続正解で指数的に伸び、失敗で縮む
                                                       -- (correct - fail) が負になれば 1日未満で再出題
days_elapsed  = julianday('now') - julianday(last_asked_at)
due_score     = days_elapsed - interval_days           -- >0 で出題対象、大きいほど優先
```

新規問題（`last_asked_at IS NULL`）は最大優先で扱う。

出題候補クエリ：

```sql
SELECT id, prompt, answer, options_json, ask_count, correct_count,
  CASE
    WHEN last_asked_at IS NULL THEN 1e9
    ELSE (julianday('now') - julianday(last_asked_at))
         - POWER(2, correct_count - (ask_count - correct_count))
  END AS due_score
FROM questions
WHERE phase = :phase
ORDER BY due_score DESC
LIMIT :n;
```

解答時の更新：

```sql
UPDATE questions
SET ask_count = ask_count + 1,
    correct_count = correct_count + :is_correct,
    last_asked_at = CURRENT_TIMESTAMP
WHERE id = :id;
```

#### Day 1/2/3 のリズムは agent が動的に推論

cycles テーブルを持たず、「今やるべき phase」は agent が以下から判断：

- 新素材：vocab/listening/dictation の questions が大量に新規（`last_asked_at IS NULL`）→ 自然に集中学習
- 数日経過：questions の正解率が上がり due_score が下がる → shadowing/speaking フェーズへ進む判断
- 1週間以上経過：due_score が高い問題が散在 → 復習中心
- shadowing/extensive_listening の実施判断：sessions 履歴を見て「最後に shadowing したのはいつか」「多聴回数」を確認

「Day 1/2/3」は強制ではなく、PLAN §3 の学習リズムに沿った agent の判断指針として残す。

#### 「詰まった表現」は `answers` から導出

#### 「詰まった表現」は `answers` から導出

専用テーブル `struggled_expressions` を作らず、`answers` のクエリで導出する。次素材生成時の入力：

```sql
-- 過去に失敗があり、その後成功していない表現
SELECT q.answer AS expression, q.prompt AS japanese, MAX(a.answered_at) AS last_failed_at
FROM questions q
JOIN answers a ON a.question_id = q.id
WHERE q.subtype IN ('ja_to_en','reproduction','retention_use')
  AND a.is_correct = 0
GROUP BY q.answer
HAVING NOT EXISTS (
  SELECT 1 FROM answers a2
  JOIN questions q2 ON q2.id = a2.question_id
  WHERE q2.answer = q.answer
    AND a2.is_correct = 1
    AND a2.answered_at > MAX(a.answered_at)
);
```

`q.answer` の文字列一致で素材横断の同一表現を識別する。questions 挿入時に正規化（trim、末尾ピリオド除去、lowercase）するルールを skill 側で揃える必要がある。

#### リテンションは「1表現 = 1問題」

工程7「A を使って話して」のように1表現ごとに1問。subtype = `retention_use`、answer に対象表現、prompt にお題（テーマ等）。これにより全工程が `questions` + `answers` の単一モデルで処理可能。

#### 多聴セッションも記録

問題なしでも `sessions.phase = 'extensive_listening'` で記録し、累積時間と素材接触履歴を追える。

