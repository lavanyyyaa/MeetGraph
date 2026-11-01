import re
from typing import List, Dict, Any, Tuple

try:
    import spacy
    try:
        nlp = spacy.load("en_core_web_sm")
    except Exception:
        nlp = spacy.blank("en")
        if "sentencizer" not in nlp.pipe_names:
            nlp.add_pipe("sentencizer")
except Exception:
    nlp = None

def clean_transcript(raw_text: str) -> str:
    """Cleans extra whitespace, carriage returns, and normalized quotes."""
    if not raw_text:
        return ""
    text = raw_text.replace("\r\n", "\n").replace("\r", "\n")
    # Replace curly quotes
    text = text.replace("“", '"').replace("”", '"').replace("’", "'").replace("‘", "'")
    # Condense multiple blank lines
    text = re.sub(r'\n\s*\n+', '\n\n', text)
    return text.strip()

def segment_sentences(text: str) -> List[Dict[str, Any]]:
    """
    Splits transcript into ordered sentences, detecting speaker tags if present.
    Returns list of dicts with:
      - sentence_id: int
      - text: str
      - speaker: Optional[str]
      - raw_line: str
    """
    cleaned = clean_transcript(text)
    if not cleaned:
        return []

    lines = cleaned.split("\n")
    results: List[Dict[str, Any]] = []
    sent_idx = 0

    speaker_pattern = re.compile(r"^(?:\[?([A-Z][a-zA-Z\s]+)\]?|\b([A-Z][a-zA-Z]+)):")

    for line in lines:
        line = line.strip()
        if not line:
            continue

        speaker = None
        match = speaker_pattern.match(line)
        content = line
        if match:
            speaker = match.group(1) or match.group(2)
            speaker = speaker.strip()
            content = line[match.end():].strip()

        # Process with spaCy or regex fallback for sentence boundary detection
        if nlp is not None:
            doc = nlp(content)
            raw_sents = [s.text for s in doc.sents]
        else:
            # Deterministic boundary regex that respects abbreviations
            raw_sents = [s.strip() for s in re.split(r'(?<=[.!?])\s+', content) if s.strip()]

        for s_candidate in raw_sents:
            s_text = s_candidate.strip()
            # Remove leading bullets or list numbering
            s_text = re.sub(r"^(\d+[\.\)]|\-|\*|\•)\s*", "", s_text)
            if len(s_text) > 3:
                results.append({
                    "sentence_id": sent_idx,
                    "text": s_text,
                    "speaker": speaker,
                    "raw_line": line
                })
                sent_idx += 1

    return results
