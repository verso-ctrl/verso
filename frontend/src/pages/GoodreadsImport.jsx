import React, { useState, useRef } from 'react';
import { 
  Upload, FileText, CheckCircle, AlertCircle, BookOpen, 
  Star, Clock, Heart, ArrowRight, Download, X, Loader2
} from 'lucide-react';
import { importAPI } from '../services/api';
import { useToast } from '../components/Toast';
import { Link } from 'react-router-dom';

function GoodreadsImport() {
  const toast = useToast();
  const fileInputRef = useRef(null);
  
  const [file, setFile] = useState(null);
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState(null);
  const [importResult, setImportResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('upload'); // 'upload', 'preview', 'importing', 'complete'

  const handleFileSelect = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    
    if (!selectedFile.name.endsWith('.csv')) {
      toast.error('Please select a CSV file');
      return;
    }
    
    setFile(selectedFile);
    
    // Read file content
    const reader = new FileReader();
    reader.onload = async (event) => {
      const content = event.target?.result;
      if (typeof content === 'string') {
        setCsvContent(content);
        await loadPreview(content);
      }
    };
    reader.onerror = () => {
      toast.error('Failed to read file');
    };
    reader.readAsText(selectedFile);
  };

  const loadPreview = async (content) => {
    setLoading(true);
    setStep('preview');
    
    try {
      const response = await importAPI.previewGoodreads(content);
      setPreview(response.data);
    } catch (error) {
      console.error('Preview error:', error);
      toast.error('Failed to parse CSV file. Make sure it\'s a valid Goodreads export.');
      setStep('upload');
      setFile(null);
    }
    
    setLoading(false);
  };

  const handleImport = async () => {
    if (!csvContent) return;
    
    setStep('importing');
    setLoading(true);
    
    try {
      const response = await importAPI.importGoodreads(csvContent);
      setImportResult(response.data);
      setStep('complete');
      
      // Refresh global data
      if (window.refreshPoints) window.refreshPoints();
      if (window.refreshReadingGoal) window.refreshReadingGoal();
      if (window.refreshStats) window.refreshStats();
      
      toast.success(`Successfully imported ${response.data.imported} books!`);
    } catch (error) {
      console.error('Import error:', error);
      toast.error('Import failed. Please try again.');
      setStep('preview');
    }
    
    setLoading(false);
  };

  const resetImport = () => {
    setFile(null);
    setCsvContent('');
    setPreview(null);
    setImportResult(null);
    setStep('upload');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-up">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-serif font-bold text-ink-900 dark:text-cream-100 flex items-center gap-3">
          <Upload className="h-8 w-8 text-primary-500" />
          Import from Goodreads
        </h1>
        <p className="text-ink-500 dark:text-ink-400 mt-1">
          Bring your reading history from Goodreads to Verso
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center justify-center gap-2">
        {['upload', 'preview', 'complete'].map((s, idx) => (
          <React.Fragment key={s}>
            <div className={`flex items-center gap-2 ${
              step === s || (step === 'importing' && s === 'preview')
                ? 'text-primary-600 dark:text-primary-400'
                : step === 'complete' || (step === 'preview' && s === 'upload') || (step === 'importing' && s === 'upload')
                  ? 'text-sage-600 dark:text-sage-400'
                  : 'text-ink-400 dark:text-ink-600'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step === s || (step === 'importing' && s === 'preview')
                  ? 'bg-primary-100 dark:bg-primary-900/50'
                  : step === 'complete' || (step === 'preview' && s === 'upload') || (step === 'importing' && s === 'upload')
                    ? 'bg-sage-100 dark:bg-sage-900/50'
                    : 'bg-cream-200 dark:bg-ink-700'
              }`}>
                {(step === 'complete' && s !== 'complete') || (step === 'preview' && s === 'upload') || (step === 'importing' && s === 'upload') ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  idx + 1
                )}
              </div>
              <span className="text-sm font-medium hidden sm:inline">
                {s === 'upload' ? 'Upload' : s === 'preview' ? 'Preview' : 'Done'}
              </span>
            </div>
            {idx < 2 && (
              <div className={`w-12 h-0.5 ${
                (step === 'preview' && idx === 0) || (step === 'importing' && idx === 0) || step === 'complete'
                  ? 'bg-sage-400'
                  : 'bg-cream-300 dark:bg-ink-700'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* Step Content */}
      {step === 'upload' && (
        <UploadStep 
          fileInputRef={fileInputRef}
          onFileSelect={handleFileSelect}
        />
      )}

      {step === 'preview' && preview && (
        <PreviewStep
          preview={preview}
          file={file}
          loading={loading}
          onImport={handleImport}
          onCancel={resetImport}
        />
      )}

      {step === 'importing' && (
        <div className="card p-12 text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-cream-300 dark:border-ink-700 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            <BookOpen className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 text-primary-600" />
          </div>
          <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
            Importing Your Books...
          </h2>
          <p className="text-ink-500 dark:text-ink-400">
            This may take a moment depending on how many books you have
          </p>
        </div>
      )}

      {step === 'complete' && importResult && (
        <CompleteStep
          result={importResult}
          onImportMore={resetImport}
        />
      )}

      {/* Instructions */}
      {step === 'upload' && (
        <div className="card p-5 bg-cream-50 dark:bg-ink-900/50 border border-cream-200 dark:border-ink-700">
          <h3 className="font-semibold text-ink-900 dark:text-cream-100 mb-3">
            How to export from Goodreads:
          </h3>
          <ol className="space-y-2 text-sm text-ink-600 dark:text-ink-300">
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
              <span>Go to <strong>goodreads.com</strong> and sign in</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
              <span>Click <strong>My Books</strong> in the navigation</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
              <span>Click <strong>Import and Export</strong> (below the cover gallery)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
              <span>Click <strong>Export Library</strong> and wait for the CSV to be ready</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="w-5 h-5 bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">5</span>
              <span>Download the CSV file and upload it here</span>
            </li>
          </ol>
        </div>
      )}
    </div>
  );
}

function UploadStep({ fileInputRef, onFileSelect }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragIn = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragOut = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = e.dataTransfer?.files;
    if (files && files.length > 0) {
      const fakeEvent = { target: { files } };
      onFileSelect(fakeEvent);
    }
  };

  return (
    <div
      className={`card p-12 border-2 border-dashed transition-all ${
        isDragging
          ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
          : 'border-cream-300 dark:border-ink-600'
      }`}
      onDragEnter={handleDragIn}
      onDragLeave={handleDragOut}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <div className="text-center">
        <div className="w-16 h-16 bg-cream-200 dark:bg-ink-700 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="h-8 w-8 text-ink-400 dark:text-ink-500" />
        </div>
        <h2 className="text-xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
          Upload Your Goodreads Export
        </h2>
        <p className="text-ink-500 dark:text-ink-400 mb-6">
          Drag and drop your CSV file here, or click to browse
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv"
          onChange={onFileSelect}
          className="hidden"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          className="btn-primary inline-flex items-center gap-2"
        >
          <Upload className="h-5 w-5" />
          Select CSV File
        </button>
      </div>
    </div>
  );
}

function PreviewStep({ preview, file, loading, onImport, onCancel }) {
  return (
    <div className="space-y-4">
      {/* File Info */}
      <div className="card p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-sage-100 dark:bg-sage-900/50 rounded-xl flex items-center justify-center">
            <FileText className="h-5 w-5 text-sage-600 dark:text-sage-400" />
          </div>
          <div>
            <p className="font-medium text-ink-900 dark:text-cream-100">{file?.name}</p>
            <p className="text-sm text-ink-500 dark:text-ink-400">
              {preview.total} books found
            </p>
          </div>
        </div>
        <button onClick={onCancel} className="btn-icon">
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Preview Stats */}
      <div className="card p-5">
        <h3 className="font-semibold text-ink-900 dark:text-cream-100 mb-4">
          Import Preview
        </h3>
        
        {/* Status Breakdown */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-4 bg-sage-50 dark:bg-sage-900/30 rounded-xl text-center">
            <CheckCircle className="h-6 w-6 text-sage-600 dark:text-sage-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-sage-700 dark:text-sage-300">
              {preview.by_status.read || 0}
            </p>
            <p className="text-sm text-sage-600 dark:text-sage-400">Read</p>
          </div>
          <div className="p-4 bg-ocean-50 dark:bg-ocean-900/30 rounded-xl text-center">
            <Clock className="h-6 w-6 text-ocean-600 dark:text-ocean-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-ocean-700 dark:text-ocean-300">
              {preview.by_status.currently_reading || 0}
            </p>
            <p className="text-sm text-ocean-600 dark:text-ocean-400">Reading</p>
          </div>
          <div className="p-4 bg-wine-50 dark:bg-wine-900/30 rounded-xl text-center">
            <Heart className="h-6 w-6 text-wine-600 dark:text-wine-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-wine-700 dark:text-wine-300">
              {preview.by_status.want_to_read || 0}
            </p>
            <p className="text-sm text-wine-600 dark:text-wine-400">Want to Read</p>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="flex items-center gap-4 text-sm text-ink-500 dark:text-ink-400 mb-6">
          <span className="flex items-center gap-1">
            <Star className="h-4 w-4 text-primary-500" />
            {preview.with_ratings} rated
          </span>
          <span className="flex items-center gap-1">
            <FileText className="h-4 w-4 text-primary-500" />
            {preview.with_reviews} reviewed
          </span>
        </div>

        {/* Sample Books */}
        {preview.sample_books.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-ink-700 dark:text-cream-300 mb-3">
              Sample books to import:
            </h4>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {preview.sample_books.map((book, idx) => (
                <div 
                  key={idx}
                  className="flex items-center gap-3 p-2 bg-cream-50 dark:bg-ink-800/50 rounded-lg"
                >
                  <BookOpen className="h-4 w-4 text-ink-400 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink-900 dark:text-cream-100 truncate">
                      {book.title}
                    </p>
                    <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
                      {book.author}
                    </p>
                  </div>
                  {book.rating && (
                    <div className="flex items-center gap-0.5">
                      <Star className="h-3 w-3 star-filled" />
                      <span className="text-xs text-ink-500">{book.rating}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Errors */}
        {preview.errors.length > 0 && (
          <div className="mt-4 p-3 bg-wine-50 dark:bg-wine-900/30 rounded-lg">
            <p className="text-sm font-medium text-wine-700 dark:text-wine-300 mb-1">
              Some rows couldn't be parsed:
            </p>
            <ul className="text-xs text-wine-600 dark:text-wine-400">
              {preview.errors.map((err, idx) => (
                <li key={idx}>{err}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={onImport}
          disabled={loading}
          className="flex-1 btn-primary flex items-center justify-center gap-2 py-3"
        >
          {loading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Import {preview.total} Books
            </>
          )}
        </button>
        <button
          onClick={onCancel}
          disabled={loading}
          className="btn-secondary"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function CompleteStep({ result, onImportMore }) {
  return (
    <div className="card p-8 text-center">
      <div className="w-20 h-20 bg-sage-100 dark:bg-sage-900/50 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="h-10 w-10 text-sage-600 dark:text-sage-400" />
      </div>
      
      <h2 className="text-2xl font-serif font-bold text-ink-900 dark:text-cream-100 mb-2">
        Import Complete!
      </h2>
      <p className="text-ink-500 dark:text-ink-400 mb-6">
        Your Goodreads library has been imported successfully
      </p>
      
      {/* Results */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 bg-sage-50 dark:bg-sage-900/30 rounded-xl">
          <p className="text-3xl font-bold text-sage-700 dark:text-sage-300">
            {result.imported}
          </p>
          <p className="text-sm text-sage-600 dark:text-sage-400">Imported</p>
        </div>
        <div className="p-4 bg-cream-100 dark:bg-ink-800 rounded-xl">
          <p className="text-3xl font-bold text-ink-700 dark:text-cream-300">
            {result.skipped}
          </p>
          <p className="text-sm text-ink-500 dark:text-ink-400">Already Existed</p>
        </div>
        <div className="p-4 bg-wine-50 dark:bg-wine-900/30 rounded-xl">
          <p className="text-3xl font-bold text-wine-700 dark:text-wine-300">
            {result.errors.length}
          </p>
          <p className="text-sm text-wine-600 dark:text-wine-400">Errors</p>
        </div>
      </div>

      {/* Errors if any */}
      {result.errors.length > 0 && (
        <div className="mb-6 p-4 bg-wine-50 dark:bg-wine-900/30 rounded-xl text-left max-h-32 overflow-y-auto">
          <p className="text-sm font-medium text-wine-700 dark:text-wine-300 mb-2">
            Some books couldn't be imported:
          </p>
          <ul className="text-xs text-wine-600 dark:text-wine-400 space-y-1">
            {result.errors.slice(0, 10).map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
            {result.errors.length > 10 && (
              <li>...and {result.errors.length - 10} more</li>
            )}
          </ul>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to="/library" className="btn-primary inline-flex items-center justify-center gap-2">
          View Library
          <ArrowRight className="h-4 w-4" />
        </Link>
        <Link to="/statistics" className="btn-secondary inline-flex items-center justify-center gap-2">
          See Statistics
        </Link>
        <button onClick={onImportMore} className="btn-ghost">
          Import Another File
        </button>
      </div>
    </div>
  );
}

export default GoodreadsImport;
