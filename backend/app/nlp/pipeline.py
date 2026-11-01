import uuid
from typing import Dict, Any, List, Optional
from datetime import datetime
from .cleaner import segment_sentences, clean_transcript
from .entity_extraction import extract_task_candidates_from_sentence, extract_deadlines, extract_people
from .dependency_extraction import extract_dependencies_from_sentence

class NLPPipeline:
    """
    End-to-end NLP processing pipeline:
    1. Transcript cleaning and sentence segmentation
    2. Candidate action item and entity extraction (people, deadlines, tasks)
    3. Cross-sentence relation and dependency extraction
    4. Evidence sentence linkage
    5. Blockers and decision point detection
    """

    def __init__(self):
        pass

    def process_transcript(
        self,
        transcript_text: str,
        meeting_id: Optional[str] = None,
        base_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        meeting_id = meeting_id or f"meet_{uuid.uuid4().hex[:8]}"
        sentences = segment_sentences(transcript_text)

        all_tasks: List[Dict[str, Any]] = []
        task_id_counter = 1

        # Phase 1: Extract all candidate tasks across sentences
        for s in sentences:
            s_text = s["text"]
            speaker = s.get("speaker")
            candidates = extract_task_candidates_from_sentence(s_text, speaker=speaker, base_date=base_date)
            for c in candidates:
                c["id"] = f"{meeting_id}_t{task_id_counter}"
                c["meeting_id"] = meeting_id
                all_tasks.append(c)
                task_id_counter += 1

        # Phase 2: Extract dependencies between extracted tasks
        all_dependencies: List[Dict[str, Any]] = []
        dep_id_counter = 1
        for idx, s in enumerate(sentences):
            s_text = s["text"]
            deps = extract_dependencies_from_sentence(
                sentence=s_text,
                all_tasks=all_tasks,
                current_sentence_index=idx,
                sentence_list=sentences
            )
            for d in deps:
                d["id"] = f"{meeting_id}_dep{dep_id_counter}"
                d["meeting_id"] = meeting_id
                all_dependencies.append(d)
                dep_id_counter += 1

        # Phase 3: Blockers & Decisions Extraction
        blockers = []
        decisions = []
        for s in sentences:
            s_text = s["text"]
            s_low = s_text.lower()
            if any(b in s_low for b in ["waiting for", "cannot finish", "blocked by", "pending on"]):
                blockers.append({
                    "evidence": s_text,
                    "speaker": s.get("speaker")
                })
            if any(d in s_low for d in ["decided", "agreed", "consensus", "decision:", "resolved"]):
                decisions.append({
                    "evidence": s_text,
                    "speaker": s.get("speaker")
                })

        # Phase 4: Identify all unique people & deadlines
        people_set = set()
        for t in all_tasks:
            if t.get("owner") and t["owner"] not in {"Unknown", "QA Team"}:
                people_set.add(t["owner"])

        return {
            "meeting_id": meeting_id,
            "sentence_count": len(sentences),
            "sentences": sentences,
            "tasks": all_tasks,
            "dependencies": all_dependencies,
            "blockers": blockers,
            "decisions": decisions,
            "people": list(people_set)
        }
