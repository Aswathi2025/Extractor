"""
Resume parser utility.
Extracts raw text from PDF (via PyMuPDF) and DOCX (via python-docx) files.
Replaces the Node.js mammoth-based resumeParser.js.
"""
import io
import logging

logger = logging.getLogger(__name__)


def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extract plain text from a PDF or DOCX file buffer.

    :param file_bytes: Raw file bytes
    :param filename: Original file name (used to determine type)
    :returns: Extracted text string
    """
    filename_lower = filename.lower()

    if filename_lower.endswith('.pdf'):
        return _extract_from_pdf(file_bytes)
    elif filename_lower.endswith('.docx'):
        return _extract_from_docx(file_bytes)
    else:
        raise ValueError(f'Unsupported file type: {filename}. Only PDF and DOCX are supported.')


def _extract_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF using PyMuPDF (fitz)."""
    import fitz  # PyMuPDF
    doc = fitz.open(stream=file_bytes, filetype='pdf')
    text_parts = []
    for page in doc:
        text_parts.append(page.get_text())
    doc.close()
    return '\n'.join(text_parts)


def _extract_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX using python-docx."""
    from docx import Document
    doc = Document(io.BytesIO(file_bytes))
    paragraphs = [para.text for para in doc.paragraphs if para.text.strip()]
    return '\n'.join(paragraphs)
