#!/usr/bin/env python3
"""Convert PDF to DOCX using pdf2docx."""
import sys
from pdf2docx import Converter

def convert(pdf_path, docx_path):
    cv = Converter(pdf_path)
    cv.convert(docx_path)
    cv.close()

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: pdf2docx_convert.py <input.pdf> <output.docx>", file=sys.stderr)
        sys.exit(1)
    convert(sys.argv[1], sys.argv[2])
