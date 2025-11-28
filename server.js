const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs').promises;
const archiver = require('archiver');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Create necessary directories
const ensureDirectories = async () => {
  const dirs = ['uploads', 'downloads', 'public'];
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (err) {
      console.error(`Error creating ${dir}:`, err);
    }
  }
};

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// Check if Pandoc is installed
const checkPandoc = () => {
  return new Promise((resolve, reject) => {
    exec('pandoc --version', (error, stdout) => {
      if (error) {
        reject(new Error('Pandoc is not installed or not in PATH'));
      } else {
        resolve(stdout);
      }
    });
  });
};

// Build Pandoc command with comprehensive options
const buildPandocCommand = (inputPath, outputPath, fromFormat, toFormat, options = {}) => {
  let cmd = `pandoc "${inputPath}" -f ${fromFormat} -t ${toFormat} -o "${outputPath}"`;

  // Standalone document with proper headers
  if (['html', 'docx', 'odt', 'epub', 'pdf'].includes(toFormat)) {
    cmd += ' --standalone';
  }

  // Table of contents for supported formats
  if (options.toc && ['html', 'pdf', 'docx', 'epub'].includes(toFormat)) {
    cmd += ' --toc --toc-depth=6';
  }

  // Number sections
  if (options.numberSections) {
    cmd += ' --number-sections';
  }

  // Preserve formatting
  cmd += ' --preserve-tabs';

  // Handle images - extract and embed
  if (['docx', 'odt', 'epub'].includes(fromFormat)) {
    cmd += ' --extract-media=./uploads/media';
  }

  // For HTML output, add CSS and better formatting
  if (toFormat === 'html') {
    cmd += ' --self-contained --mathjax';
    if (options.css) {
      cmd += ' --css=style.css';
    }
  }

  // For PDF output, use appropriate engine
  if (toFormat === 'pdf') {
    cmd += ' --pdf-engine=pdflatex';
    // Handle complex tables and formatting
    cmd += ' --variable=geometry:margin=1in';
  }

  // For DOCX output, preserve styling
  if (toFormat === 'docx') {
    cmd += ' --reference-doc=reference.docx';
  }

  // Smart typography
  cmd += ' --smart';

  // Syntax highlighting for code blocks
  cmd += ' --highlight-style=pygments';

  // Handle line breaks properly
  cmd += ' --wrap=preserve';

  // Citations and bibliography
  if (options.bibliography) {
    cmd += ' --citeproc';
  }

  return cmd;
};

// Convert a single file
const convertFile = (inputPath, outputPath, fromFormat, toFormat, options) => {
  return new Promise((resolve, reject) => {
    const cmd = buildPandocCommand(inputPath, outputPath, fromFormat, toFormat, options);

    console.log('Executing:', cmd);

    exec(cmd, { maxBuffer: 10 * 1024 * 1024 }, (error, stdout, stderr) => {
      if (error) {
        console.error('Pandoc error:', stderr);
        reject(new Error(`Conversion failed: ${stderr || error.message}`));
      } else {
        resolve(outputPath);
      }
    });
  });
};

// API endpoint to check Pandoc availability
app.get('/api/check-pandoc', async (req, res) => {
  try {
    const version = await checkPandoc();
    res.json({
      available: true,
      version: version.split('\n')[0]
    });
  } catch (error) {
    res.json({
      available: false,
      error: error.message
    });
  }
});

// API endpoint to get supported formats
app.get('/api/formats', (req, res) => {
  const formats = {
    input: [
      { value: 'markdown', label: 'Markdown', extensions: ['.md', '.markdown'] },
      { value: 'html', label: 'HTML', extensions: ['.html', '.htm'] },
      { value: 'docx', label: 'Word (DOCX)', extensions: ['.docx'] },
      { value: 'odt', label: 'OpenDocument', extensions: ['.odt'] },
      { value: 'epub', label: 'EPUB', extensions: ['.epub'] },
      { value: 'latex', label: 'LaTeX', extensions: ['.tex'] },
      { value: 'rst', label: 'reStructuredText', extensions: ['.rst'] },
      { value: 'textile', label: 'Textile', extensions: ['.textile'] },
      { value: 'org', label: 'Org Mode', extensions: ['.org'] },
      { value: 'mediawiki', label: 'MediaWiki', extensions: ['.wiki'] },
      { value: 'rtf', label: 'Rich Text Format', extensions: ['.rtf'] },
      { value: 'json', label: 'Pandoc JSON', extensions: ['.json'] }
    ],
    output: [
      { value: 'markdown', label: 'Markdown', extension: '.md' },
      { value: 'html', label: 'HTML', extension: '.html' },
      { value: 'docx', label: 'Word (DOCX)', extension: '.docx' },
      { value: 'odt', label: 'OpenDocument', extension: '.odt' },
      { value: 'epub', label: 'EPUB', extension: '.epub' },
      { value: 'pdf', label: 'PDF', extension: '.pdf' },
      { value: 'latex', label: 'LaTeX', extension: '.tex' },
      { value: 'rst', label: 'reStructuredText', extension: '.rst' },
      { value: 'textile', label: 'Textile', extension: '.textile' },
      { value: 'org', label: 'Org Mode', extension: '.org' },
      { value: 'mediawiki', label: 'MediaWiki', extension: '.wiki' },
      { value: 'rtf', label: 'Rich Text Format', extension: '.rtf' },
      { value: 'plain', label: 'Plain Text', extension: '.txt' },
      { value: 'json', label: 'Pandoc JSON', extension: '.json' }
    ]
  };

  res.json(formats);
});

// Single file conversion endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { fromFormat, toFormat, options } = req.body;
    const parsedOptions = options ? JSON.parse(options) : {};

    const inputPath = req.file.path;
    const outputFilename = path.parse(req.file.originalname).name;
    const outputExt = getOutputExtension(toFormat);
    const outputPath = path.join('downloads', `${outputFilename}-${Date.now()}${outputExt}`);

    await convertFile(inputPath, outputPath, fromFormat, toFormat, parsedOptions);

    // Send the file
    res.download(outputPath, `${outputFilename}${outputExt}`, async (err) => {
      // Cleanup
      try {
        await fs.unlink(inputPath);
        await fs.unlink(outputPath);
      } catch (cleanupErr) {
        console.error('Cleanup error:', cleanupErr);
      }

      if (err) {
        console.error('Download error:', err);
      }
    });

  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Batch conversion endpoint
app.post('/api/convert-batch', upload.array('files', 50), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const { fromFormat, toFormat, options } = req.body;
    const parsedOptions = options ? JSON.parse(options) : {};

    const conversions = [];
    const timestamp = Date.now();

    // Convert all files
    for (const file of req.files) {
      const inputPath = file.path;
      const outputFilename = path.parse(file.originalname).name;
      const outputExt = getOutputExtension(toFormat);
      const outputPath = path.join('downloads', `${outputFilename}-${timestamp}${outputExt}`);

      try {
        await convertFile(inputPath, outputPath, fromFormat, toFormat, parsedOptions);
        conversions.push({
          original: file.originalname,
          converted: path.basename(outputPath),
          path: outputPath,
          success: true
        });
      } catch (error) {
        conversions.push({
          original: file.originalname,
          error: error.message,
          success: false
        });
      }
    }

    // Create ZIP file
    const zipPath = path.join('downloads', `converted-${timestamp}.zip`);
    const output = require('fs').createWriteStream(zipPath);
    const archive = archiver('zip', { zlib: { level: 9 } });

    output.on('close', async () => {
      // Send the ZIP file
      res.download(zipPath, `converted-documents.zip`, async (err) => {
        // Cleanup
        try {
          for (const file of req.files) {
            await fs.unlink(file.path);
          }
          for (const conv of conversions) {
            if (conv.success && conv.path) {
              await fs.unlink(conv.path);
            }
          }
          await fs.unlink(zipPath);
        } catch (cleanupErr) {
          console.error('Cleanup error:', cleanupErr);
        }

        if (err) {
          console.error('Download error:', err);
        }
      });
    });

    archive.on('error', (err) => {
      throw err;
    });

    archive.pipe(output);

    // Add successful conversions to ZIP
    for (const conv of conversions) {
      if (conv.success && conv.path) {
        archive.file(conv.path, { name: conv.converted });
      }
    }

    await archive.finalize();

  } catch (error) {
    console.error('Batch conversion error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to get output extension
const getOutputExtension = (format) => {
  const extensions = {
    markdown: '.md',
    html: '.html',
    docx: '.docx',
    odt: '.odt',
    epub: '.epub',
    pdf: '.pdf',
    latex: '.tex',
    rst: '.rst',
    textile: '.textile',
    org: '.org',
    mediawiki: '.wiki',
    rtf: '.rtf',
    plain: '.txt',
    json: '.json'
  };
  return extensions[format] || '.txt';
};

// Start server
const startServer = async () => {
  await ensureDirectories();

  try {
    const version = await checkPandoc();
    console.log('Pandoc detected:', version.split('\n')[0]);
  } catch (error) {
    console.warn('WARNING:', error.message);
    console.warn('Please install Pandoc from https://pandoc.org/installing.html');
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Pandoc GUI Server running on http://localhost:${PORT}`);
    console.log(`📝 Open your browser and navigate to the URL above\n`);
  });
};

startServer();
