import re
from typing import List, Dict, Any, Optional, Tuple

DEPENDENCY_MARKERS = [
    ("cannot finish it until", "UNTIL"),
    ("cannot proceed until", "UNTIL"),
    ("cannot start until", "UNTIL"),
    ("waiting for", "WAITING_FOR"),
    ("depends on", "DEPENDS_ON"),
    ("contingent on", "DEPENDS_ON"),
    ("blocked by", "BLOCKED_BY"),
    ("once", "ONCE"),
    ("after", "AFTER"),
    ("before", "BEFORE"),
    ("prerequisite is", "PREREQUISITE")
]

def find_matching_task(query: str, tasks: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
    """
    Fuzzy/keyword matches a phrase (e.g., 'UI', 'API', 'schema', 'testing') to a task in tasks list.
    """
    q = query.lower().strip()
    if not q:
        return None

    # Exact title or description substring match
    best_task = None
    best_score = 0

    q_words = set(re.findall(r"[a-z0-9]+", q))
    # Exclude common stopwords
    stop_words = {"the", "a", "an", "and", "or", "to", "by", "for", "with", "is", "are", "will", "ready", "done", "finish", "complete"}
    content_words = q_words - stop_words

    for task in tasks:
        t_title = task["title"].lower()
        t_desc = (task.get("description") or "").lower()
        t_words = set(re.findall(r"[a-z0-9]+", t_title + " " + t_desc)) - stop_words
        
        # Check intersection
        common = content_words.intersection(t_words)
        score = len(common)
        
        # Bonus if full keyword is in title (e.g., "ui" in "Complete The Ui")
        for cw in content_words:
            if cw in t_title:
                score += 2

        if score > best_score and score >= 1:
            best_score = score
            best_task = task

    return best_task

def extract_dependencies_from_sentence(
    sentence: str,
    all_tasks: List[Dict[str, Any]],
    current_sentence_index: int,
    sentence_list: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    """
    Extracts dependencies linking candidate tasks.
    Edge convention:
      source_task DEPENDS_ON target_task
      (source cannot proceed until target is done; target is UPSTREAM PREREQUISITE).
    """
    dependencies: List[Dict[str, Any]] = []
    s_lower = sentence.lower()

    # Pattern 1: Pronoun / Task "cannot finish/proceed until [Person/Task] completes [Prerequisite]"
    # e.g., "However, she cannot finish it until Arjun completes the API integration."
    match_until = re.search(r"\b(?:(she|he|they|it|[a-zA-Z\s]+?))\s+cannot\s+(?:finish|complete|proceed|start)\s*(?:it)?\s+until\s+([a-zA-Z\s]+?)\s+(?:completes|finishes|delivers|builds)\s+(?:the\s+)?([a-zA-Z0-9_\s]+)", sentence, re.IGNORECASE)
    if match_until:
        subj = match_until.group(1).strip().lower()
        upstream_owner = match_until.group(2).strip()
        upstream_task_keyword = match_until.group(3).strip()

        # Find downstream task (e.g. if 'she', look for task owned by female/previous sentence person)
        downstream_task = None
        if subj in {"she", "he", "they", "it"} and current_sentence_index > 0:
            # Look at previous sentence tasks
            prev_sent_text = sentence_list[current_sentence_index - 1]["text"]
            for t in all_tasks:
                if t["source_sentence"] == prev_sent_text:
                    downstream_task = t
                    break
        else:
            downstream_task = find_matching_task(subj, all_tasks)

        # Find upstream task (e.g. API integration)
        upstream_task = find_matching_task(upstream_task_keyword, all_tasks)
        if not upstream_task and upstream_owner:
            for t in all_tasks:
                if t.get("owner", "").lower() == upstream_owner.lower():
                    upstream_task = t
                    break

        if downstream_task and upstream_task and downstream_task["id"] != upstream_task["id"]:
            dependencies.append({
                "source_task_id": downstream_task["id"],
                "target_task_id": upstream_task["id"],
                "relation_type": "DEPENDS_ON",
                "evidence_sentence": sentence,
                "confidence": 0.95
            })

    # Pattern 2: "[Person/Task] is waiting for [Other] to [Prerequisite]"
    # e.g., "Arjun is waiting for the database team to finalize the schema by Wednesday."
    match_waiting = re.search(r"\b([A-Z][a-z]+|[a-zA-Z\s]+?)\s+is\s+waiting\s+for\s+(?:the\s+)?([a-zA-Z\s]+?)\s+to\s+([a-zA-Z0-9_\s]+)", sentence, re.IGNORECASE)
    if match_waiting:
        waiter = match_waiting.group(1).strip()
        upstream_entity = match_waiting.group(2).strip()
        upstream_action = match_waiting.group(3).strip()

        # Downstream task is waiter's task
        downstream_task = None
        for t in all_tasks:
            if t.get("owner", "").lower() == waiter.lower():
                downstream_task = t
                break

        # Upstream task is the prerequisite action (e.g., finalize schema)
        upstream_task = find_matching_task(upstream_action, all_tasks)
        if not upstream_task:
            upstream_task = find_matching_task(upstream_entity, all_tasks)

        if downstream_task and upstream_task and downstream_task["id"] != upstream_task["id"]:
            dependencies.append({
                "source_task_id": downstream_task["id"],
                "target_task_id": upstream_task["id"],
                "relation_type": "DEPENDS_ON",
                "evidence_sentence": sentence,
                "confidence": 0.92
            })

    # Pattern 3: "[Downstream Task] will begin/start once [Prereq1] and [Prereq2] are ready/done/finished"
    # e.g., "Testing will begin once the UI and API are ready."
    match_once = re.search(r"\b([A-Za-z0-9_\s]+?)\s+will\s+(?:begin|start|commence)\s+(?:once|after)\s+(?:the\s+)?([a-zA-Z0-9_,\s]+?)\s+are\s+(?:ready|done|completed|finished)", sentence, re.IGNORECASE)
    if match_once:
        downstream_keyword = match_once.group(1).strip()
        prereqs_phrase = match_once.group(2).strip()

        downstream_task = find_matching_task(downstream_keyword, all_tasks)
        
        # Split prerequisites on "and", ",", "&"
        prereq_items = re.split(r"\s+and\s+|,\s*", prereqs_phrase)
        for item in prereq_items:
            item_clean = item.strip()
            if not item_clean:
                continue
            upstream_task = find_matching_task(item_clean, all_tasks)
            if downstream_task and upstream_task and downstream_task["id"] != upstream_task["id"]:
                dependencies.append({
                    "source_task_id": downstream_task["id"],
                    "target_task_id": upstream_task["id"],
                    "relation_type": "DEPENDS_ON",
                    "evidence_sentence": sentence,
                    "confidence": 0.94
                })

    # Pattern 4: "[Task A] depends on [Task B]" or "[Task A] is blocked by [Task B]"
    match_direct = re.search(r"\b([A-Za-z0-9_\s]+?)\s+(?:depends\s+on|is\s+blocked\s+by|requires)\s+([A-Za-z0-9_\s]+)", sentence, re.IGNORECASE)
    if match_direct and not match_until and not match_waiting and not match_once:
        t_down = find_matching_task(match_direct.group(1), all_tasks)
        t_up = find_matching_task(match_direct.group(2), all_tasks)
        if t_down and t_up and t_down["id"] != t_up["id"]:
            dependencies.append({
                "source_task_id": t_down["id"],
                "target_task_id": t_up["id"],
                "relation_type": "DEPENDS_ON",
                "evidence_sentence": sentence,
                "confidence": 0.88
            })

    # Deduplicate dependencies
    unique_deps = []
    seen = set()
    for d in dependencies:
        key = (d["source_task_id"], d["target_task_id"])
        if key not in seen:
            seen.add(key)
            unique_deps.append(d)

    return unique_deps
