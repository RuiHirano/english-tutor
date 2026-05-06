---
name: phase-speaking
description: 工程6・7 — スピーキング（日→英即答／音読＋暗唱）とリテンションテスト（1表現につき1問）。
---

# phase-speaking（工程6・7）

## サブフェーズ

### 6a. 日→英 即答（パターンプラクティス）

1. 候補を取得：`python -m english_tutor.flow.due --type expression --limit 6` と `--type vocab --limit 4`
2. 各項目について、その term を使うべき短い日本語の文を提示する。日本語の prompt は読み上げるか表示のみでも可
3. ユーザーの発話／入力を待つ。採点：目標構造を使えたか／意味が伝わったか。言い換えも許容
4. 日本語でフィードバック＋模範解答を添える
5. `flow.record` で記録（`phase: "speaking"`、`vocabulary_item_id` を設定）

### 6b. 音読＋暗唱（リプロダクション）

1. コア素材の `script` から 2〜3 文を選ぶ
2. その文を表示してユーザーに音読させる（1 回）
3. 表示を隠し、記憶から再現させる
4. 正確性 + 自然さで採点。`flow.record` に `phase: "speaking"` で記録。文中の特定の term で詰まったらその `vocabulary_item_id` を紐付ける

### 7. リテンションテスト

未解決のミス項目（`python -m english_tutor.flow.mistakes --limit 5`）について、**1 表現につき 1 問** を出題する：

1. 日本語でお題を出す：「『<term>』を使って自分の経験を話して」
2. ユーザーの自由発話を待つ
3. 判定：その term が自然に使われたか／意味が伝わったか
4. 自然に使えていれば `is_correct: 1` で記録（recovery シグナル）。これが「言えなかった表現の回収」サイクルの完結
5. 使えなかった／不自然なら、模範的な使い方を1つ示してから `is_correct: 0` で記録

## 記録の形（全サブフェーズ共通）

ヒアドキュメント形式を厳守。`echo` や `python3 -c` は使わない：

```bash
python3 << 'PYEOF'
import subprocess, json, sys
data = {
  "session_id": <S>, "material_id": <M>,
  "vocabulary_item_id": <V>, "phase": "speaking",
  "question_text": "...", "correct_answer": "...",
  "user_answer": "...", "is_correct": 0|1,
  "feedback": "..."
}
p = subprocess.run(
    [sys.executable, "-m", "english_tutor.flow.record"],
    input=json.dumps(data), text=True, capture_output=True)
if p.returncode != 0:
    print(p.stderr)
else:
    print(p.stdout)
PYEOF
```
