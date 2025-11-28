# Pandoc GUI - Universal Document Converter

A modern, browser-based GUI for Pandoc that runs locally with comprehensive formatting support. Convert between multiple document formats with an intuitive interface.

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node](https://img.shields.io/badge/node-%3E%3D14.0.0-green.svg)

## Features

### ✨ Comprehensive Format Support

- **Input Formats**: Markdown, HTML, DOCX, ODT, EPUB, LaTeX, reStructuredText, Textile, Org Mode, MediaWiki, RTF, and more
- **Output Formats**: All input formats plus PDF, plain text, and Pandoc JSON

### 🎯 Advanced Formatting Features

- ✅ **Clean Paragraph Formatting** - Preserves document structure
- ✅ **Numbered and Bullet Lists** - Maintains list hierarchy
- ✅ **Nested Lists & Indents** - Proper indentation handling
- ✅ **Heading Structures (H1-H6)** - Complete heading support
- ✅ **Table Conversion** - Complex table formatting
- ✅ **Footnotes & Endnotes** - Academic citation support
- ✅ **Image Processing** - Embedded and linked images
- ✅ **Text Styling** - Bold, italics, underline, strikethrough
- ✅ **Hyperlinks & Anchor Text** - URL and internal links
- ✅ **Line Breaks & Spacing** - Precise spacing control
- ✅ **Text Boxes Handling** - Special content blocks
- ✅ **Inline Comments** - Comment preservation
- ✅ **Batch Processing** - Convert multiple files at once
- ✅ **ZIP Download** - Bulk export functionality

### 🚀 Modern Interface

- Browser-based GUI (works on all platforms)
- Drag-and-drop file upload
- Single file or batch processing modes
- Real-time conversion progress
- Responsive design for mobile and desktop

## Prerequisites

### 1. Install Pandoc

Pandoc must be installed on your system:

**macOS:**
```bash
brew install pandoc
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install pandoc
```

**Linux (Fedora):**
```bash
sudo dnf install pandoc
```

**Windows:**
Download from [pandoc.org/installing.html](https://pandoc.org/installing.html)

### 2. Install Node.js

Download and install Node.js (v14 or higher) from [nodejs.org](https://nodejs.org/)

Verify installation:
```bash
node --version
npm --version
```

## Installation

1. **Clone or download this repository:**
```bash
git clone https://github.com/your-username/PandaDoc-GUI.git
cd PandaDoc-GUI
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the server:**
```bash
npm start
```

4. **Open your browser:**
Navigate to [http://localhost:3000](http://localhost:3000)

## Usage

### Single File Conversion

1. Click "Single File" mode (default)
2. Drop a file or click to browse
3. Select input format (or leave as auto-detect)
4. Choose output format
5. Configure options if needed (TOC, numbering, etc.)
6. Click "Convert Document"
7. Download starts automatically

### Batch Processing

1. Click "Batch Processing" mode
2. Drop multiple files or click to browse
3. Select formats and options
4. Click "Convert Document"
5. All files are converted and downloaded as a ZIP

### Conversion Options

- **Table of Contents**: Generate a TOC for your document
- **Number Sections**: Automatically number all headings
- **Bibliography**: Enable citation and bibliography processing
- **CSS Styling**: Enhanced styling for HTML output

## Supported Conversions

Common conversion paths:

- **Markdown → HTML/PDF/DOCX** - Blog posts, documentation
- **DOCX → Markdown** - Word documents to plain text
- **HTML → Markdown/PDF** - Web content to documents
- **LaTeX → PDF/DOCX** - Academic papers
- **EPUB → PDF/DOCX** - E-books to printable formats

## Advanced Usage

### For PDF Output

PDF generation requires LaTeX. Install it for your platform:

**macOS:**
```bash
brew install --cask mactex-no-gui
```

**Linux:**
```bash
sudo apt-get install texlive-latex-base texlive-fonts-recommended
```

### Custom Templates

You can add custom Pandoc templates by placing them in the project directory and modifying `server.js` to reference them.

### API Endpoints

The server exposes REST API endpoints:

- `GET /api/check-pandoc` - Check Pandoc availability
- `GET /api/formats` - Get supported formats
- `POST /api/convert` - Convert single file
- `POST /api/convert-batch` - Batch convert files

## Development

### Development Mode with Auto-Restart

```bash
npm run dev
```

This uses nodemon to automatically restart the server when files change.

### Project Structure

```
PandaDoc-GUI/
├── server.js           # Express backend
├── package.json        # Dependencies
├── public/            # Frontend files
│   ├── index.html     # Main UI
│   ├── styles.css     # Styling
│   └── app.js         # Client-side JavaScript
├── uploads/           # Temporary upload directory (auto-created)
└── downloads/         # Temporary download directory (auto-created)
```

## Troubleshooting

### "Pandoc not installed" error
- Ensure Pandoc is installed: `pandoc --version`
- Make sure Pandoc is in your system PATH
- Restart the server after installing Pandoc

### PDF conversion fails
- Install LaTeX (see Advanced Usage section)
- Try converting to HTML first to verify other conversions work

### Large file issues
- Default file size limit is 100MB
- Adjust `maxBuffer` in server.js for larger files
- For very large files, use command-line Pandoc directly

### Port already in use
- Change the port in server.js: `const PORT = 3001;`
- Or set environment variable: `PORT=3001 npm start`

## Configuration

### Change Server Port

Set the `PORT` environment variable:
```bash
PORT=8080 npm start
```

Or edit `server.js`:
```javascript
const PORT = process.env.PORT || 8080;
```

### File Size Limits

Edit the multer configuration in `server.js`:
```javascript
limits: { fileSize: 200 * 1024 * 1024 } // 200MB
```

## Contributing

Contributions are welcome! Please feel free to submit pull requests or open issues for bugs and feature requests.

## License

MIT License - see LICENSE file for details

## Credits

- Powered by [Pandoc](https://pandoc.org/) - Universal document converter by John MacFarlane
- Pandoc source code: [github.com/jgm/pandoc](https://github.com/jgm/pandoc)

## Related Projects

- [Pandoc](https://pandoc.org/) - The command-line tool this GUI wraps
- [Pandoc Documentation](https://pandoc.org/MANUAL.html) - Complete Pandoc manual

## Support

For issues related to:
- **This GUI**: Open an issue in this repository
- **Pandoc itself**: See [Pandoc's GitHub](https://github.com/jgm/pandoc/issues)
- **Document conversion questions**: Check [Pandoc documentation](https://pandoc.org/MANUAL.html)

---

**Note**: This is a GUI wrapper around Pandoc. All document conversion is performed by Pandoc locally on your machine. No files are uploaded to external servers.
