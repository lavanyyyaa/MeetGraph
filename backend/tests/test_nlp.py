import pytest
from app.nlp.cleaner import clean_transcript, segment_sentences
from app.nlp.entity_extraction import extract_deadlines, extract_people, extract_task_candidates_from_sentence
from app.nlp.pipeline import NLPPipeline

def test_clean_transcript_and_segmentation():
    raw = "Riya: Will complete UI by Friday.\nArjun: Testing will begin soon."
    cleaned = clean_transcript(raw)
    sentences = segment_sentences(cleaned)
    assert len(sentences) >= 2
    assert any("complete UI" in s["text"] or "complete ui" in s["text"].lower() for s in sentences)

def test_extract_deadlines():
    sent = "Riya will complete the UI by Friday."
    raw_dl, norm_dl = extract_deadlines(sent)
    assert raw_dl is not None
    assert "friday" in raw_dl.lower()
    assert norm_dl is not None

def test_nlp_pipeline_on_canonical_transcript():
    transcript = (
        "Riya will complete the UI by Friday. "
        "However, she cannot finish it until Arjun completes the API integration. "
        "Arjun is waiting for the database team to finalize the schema by Wednesday. "
        "Testing will begin once the UI and API are ready."
    )
    pipeline = NLPPipeline()
    result = pipeline.process_transcript(transcript)

    tasks = result["tasks"]
    deps = result["dependencies"]

    # Verify task extractions
    titles = [t["title"].lower() for t in tasks]
    assert any("ui" in t for t in titles)
    assert any("api" in t for t in titles)
    assert any("schema" in t for t in titles)
    assert any("testing" in t for t in titles)

    # Verify evidence sentence preservation
    for t in tasks:
        assert t["source_sentence"] in transcript
        assert t["id"] is not None

    # Verify dependencies
    assert len(deps) >= 3
    # Check that evidence sentences are preserved on dependencies
    for d in deps:
        assert len(d["evidence_sentence"]) > 5
        assert d["relation_type"] == "DEPENDS_ON"
