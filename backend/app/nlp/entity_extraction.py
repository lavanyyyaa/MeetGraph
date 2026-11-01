import re
from typing import List, Dict, Any, Optional, Tuple
from datetime import datetime, timedelta
try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = spacy.blank("en")
except Exception:
    nlp = None

WEEKDAYS = {
    "monday": 0, "tuesday": 1, "wednesday": 2, "thursday": 3,
    "friday": 4, "saturday": 5, "sunday": 6
}

DEADLINE_PATTERNS = [
    r"\bby\s+(?:the\s+end\s+of\s+day\s+|eod\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
    r"\bbefore\s+(?:next\s+)?(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
    r"\bdue\s+(?:on|by)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b",
    r"\bby\s+(tomorrow|next\s+week|end\s+of\s+the\s+week|eod)\b",
    r"\bby\s+([A-Z][a-z]{2,8}\s+\d{1,2}(?:st|nd|rd|th)?)\b",
    r"\bdue\s+date\s+is\s+([A-Za-z0-9\s]+?)(?:\.|$)",
    r"\bdeadline\s+is\s+([A-Za-z0-9\s]+?)(?:\.|$)"
]

def normalize_relative_weekday(weekday_name: str, base_date: Optional[datetime] = None) -> str:
    """Normalizes day name like 'Friday' to a concrete ISO date (YYYY-MM-DD)."""
    weekday_clean = weekday_name.lower().strip()
    if weekday_clean not in WEEKDAYS:
        return weekday_name

    ref = base_date or datetime.now()
    target_day = WEEKDAYS[weekday_clean]
    current_day = ref.weekday()

    days_ahead = target_day - current_day
    if days_ahead <= 0:  # Target day already happened this week, so project to next occurrence
        days_ahead += 7

    target_date = ref + timedelta(days=days_ahead)
    return target_date.strftime("%Y-%m-%d")

def extract_deadlines(sentence: str, base_date: Optional[datetime] = None) -> Tuple[Optional[str], Optional[str]]:
    """
    Extracts raw deadline string and normalized date if possible.
    Returns: (raw_deadline, normalized_deadline)
    """
    s_lower = sentence.lower()
    for pattern in DEADLINE_PATTERNS:
        match = re.search(pattern, s_lower, re.IGNORECASE)
        if match:
            raw_val = match.group(0).strip()
            # Try to grab the inner captured entity if present
            entity_val = match.group(1).strip() if match.groups() else raw_val

            if entity_val.lower() in WEEKDAYS:
                normalized = normalize_relative_weekday(entity_val, base_date)
                return raw_val, normalized
            elif "tomorrow" in entity_val.lower():
                ref = base_date or datetime.now()
                return raw_val, (ref + timedelta(days=1)).strftime("%Y-%m-%d")
            else:
                return raw_val, entity_val

    return None, None

def extract_people(doc_or_text) -> List[str]:
    """Extracts candidate person names using NER and capital patterns."""
    people = set()
    if hasattr(doc_or_text, "ents"):
        for ent in doc_or_text.ents:
            if ent.label_ == "PERSON":
                cleaned = ent.text.strip()
                # Filter out non-person words sometimes misclassified
                if len(cleaned) > 1 and cleaned.lower() not in {"ui", "api", "database", "schema", "backend", "frontend", "testing"}:
                    people.add(cleaned)

    # Heuristic for capitalized words followed by action verbs (e.g., 'Arjun is waiting', 'Riya will complete')
    text = doc_or_text.text if hasattr(doc_or_text, "text") else str(doc_or_text)
    matches = re.findall(r"\b([A-Z][a-z]+)\s+(?:will|is|can|needs|must|has)\b", text)
    for m in matches:
        if m.lower() not in {"this", "that", "there", "it", "they", "we", "he", "she", "testing", "friday", "wednesday", "monday", "tuesday", "thursday", "saturday", "sunday"}:
            people.add(m)

    return list(people)

ACTION_VERBS = [
    "complete", "finish", "integrate", "develop", "build", "finalize", "create",
    "test", "deploy", "design", "implement", "review", "fix", "prepare", "release"
]

def extract_task_candidates_from_sentence(
    sentence: str,
    speaker: Optional[str] = None,
    base_date: Optional[datetime] = None
) -> List[Dict[str, Any]]:
    """
    Analyzes a sentence for action items / tasks.
    Returns list of candidate task dictionaries.
    """
    doc = nlp(sentence) if nlp is not None else sentence
    people = extract_people(doc)
    raw_deadline, normalized_deadline = extract_deadlines(sentence, base_date)

    tasks: List[Dict[str, Any]] = []

    # Check for modal verbs or future intent
    # 1. Pattern: "[Person] will [verb] [object]" -> e.g. "Riya will complete the UI"
    pattern_will = re.search(r"\b([A-Z][a-z]+|\w+)\s+(?:will|is\s+going\s+to|shall)\s+([a-z]+(?:\s+[a-z0-9_-]+){1,5})", sentence, re.IGNORECASE)
    if pattern_will:
        subj = pattern_will.group(1).strip()
        action_phrase = pattern_will.group(2).strip()
        
        # Determine owner
        owner = "Unknown"
        if subj in people:
            owner = subj
        elif speaker:
            owner = speaker

        # Extract title cleanly
        # e.g., "complete the UI by Friday" -> task: "Complete the UI"
        action_clean = re.sub(r"\b(?:by|before|until|once|after|due)\b.*$", "", action_phrase, flags=re.IGNORECASE).strip()
        # Avoid bare start/begin phrases or testing which are handled elsewhere
        if len(action_clean) > 3 and action_clean.lower() not in {"begin", "start", "commence"} and subj.lower() not in {"testing", "tests", "it", "this"}:
            tasks.append({
                "title": action_clean.capitalize(),
                "description": f"{subj} will {action_clean}",
                "owner": owner,
                "deadline_raw": raw_deadline,
                "deadline": normalized_deadline,
                "status": "TODO",
                "source_sentence": sentence,
                "confidence": 0.90 if owner != "Unknown" else 0.80
            })

    # 2. Pattern: "[Subject] is waiting for [team/person] to [verb] [object]"
    # e.g. "Arjun is waiting for the database team to finalize the schema"
    pattern_waiting = re.search(r"\b([A-Z][a-z]+)\s+is\s+waiting\s+for\s+(?:the\s+)?([a-zA-Z\s]+?)\s+to\s+([a-z]+(?:\s+[a-z0-9_-]+){1,5})", sentence, re.IGNORECASE)
    if pattern_waiting:
        waiter = pattern_waiting.group(1).strip()
        target_entity = pattern_waiting.group(2).strip()
        action_phrase = pattern_waiting.group(3).strip()
        action_clean = re.sub(r"\b(?:by|before|until|once|after|due)\b.*$", "", action_phrase, flags=re.IGNORECASE).strip()

        # Database team finalizing schema is a prerequisite task!
        tasks.append({
            "title": f"{action_clean.capitalize()} ({target_entity})",
            "description": f"{target_entity} to {action_clean}",
            "owner": target_entity if len(target_entity.split()) <= 3 else "Database Team",
            "deadline_raw": raw_deadline,
            "deadline": normalized_deadline,
            "status": "TODO",
            "source_sentence": sentence,
            "confidence": 0.88
        })

    # 3. Pattern: "[Task/Activity] will begin once..." or "[Task] will start..."
    # e.g. "Testing will begin once the UI and API are ready."
    pattern_begin = re.search(r"\b([A-Z][a-zA-Z0-9_\s]{2,20})\s+will\s+(?:begin|start|commence)\b", sentence, re.IGNORECASE)
    if pattern_begin:
        task_name = pattern_begin.group(1).strip()
        if task_name.lower() not in {"it", "this", "that", "we"}:
            tasks.append({
                "title": f"{task_name.capitalize()} Phase",
                "description": f"{task_name} once prerequisites are ready",
                "owner": "QA Team" if "test" in task_name.lower() else "Unknown",
                "deadline_raw": raw_deadline,
                "deadline": normalized_deadline,
                "status": "TODO",
                "source_sentence": sentence,
                "confidence": 0.85
            })

    # 4. Pattern: "[Person] completes the [task]" or "[Person] cannot finish it until [Person] completes [task]"
    # e.g. "...until Arjun completes the API integration."
    pattern_until = re.search(r"\buntil\s+([A-Z][a-z]+)\s+(?:completes|finishes|delivers)\s+(?:the\s+)?([a-zA-Z0-9_\s]{2,30})", sentence, re.IGNORECASE)
    if pattern_until:
        owner_name = pattern_until.group(1).strip()
        task_desc = pattern_until.group(2).strip()
        task_clean = re.sub(r"[\.,]$", "", task_desc).strip()
        tasks.append({
            "title": f"Complete {task_clean}".title(),
            "description": f"{owner_name} completes {task_clean}",
            "owner": owner_name,
            "deadline_raw": None,
            "deadline": None,
            "status": "TODO",
            "source_sentence": sentence,
            "confidence": 0.92
        })

    # Deduplicate within sentence by title similarity
    unique_tasks = []
    seen = set()
    for t in tasks:
        key = t["title"].lower()
        if key not in seen:
            seen.add(key)
            unique_tasks.append(t)

    return unique_tasks
