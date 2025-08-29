import { useState, useRef } from 'react'
import { useUIStore } from '../stores/ui'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { FileUp, Upload, CheckCircle, AlertCircle } from 'lucide-react'

interface ImportResult {
  success: number
  failed: number
  errors: string[]
}

const CSVImport = () => {
  const { addNotification } = useUIStore()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.name.endsWith('.csv')) {
      addNotification({
        type: 'error',
        title: 'Invalid file type',
        message: 'Please select a CSV file.'
      })
      return
    }

    setIsUploading(true)
    setUploadProgress(0)
    setImportResult(null)

    try {
      // Simulate file processing with progress
      const formData = new FormData()
      formData.append('file', file)

      // Mock progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return prev
          }
          return prev + 10
        })
      }, 200)

      // Mock API call - replace with actual API endpoint
      await new Promise(resolve => setTimeout(resolve, 2000))
      
      // Mock successful result
      const mockResult: ImportResult = {
        success: Math.floor(Math.random() * 20) + 10,
        failed: Math.floor(Math.random() * 3),
        errors: [
          'Row 5: Missing required field "title"',
          'Row 12: Invalid priority value "urgent"'
        ].slice(0, Math.floor(Math.random() * 3))
      }

      setUploadProgress(100)
      setImportResult(mockResult)

      if (mockResult.success > 0) {
        addNotification({
          type: 'success',
          title: 'Import completed',
          message: `Successfully imported ${mockResult.success} tickets.`
        })
      }

      if (mockResult.failed > 0) {
        addNotification({
          type: 'warning',
          title: 'Some imports failed',
          message: `${mockResult.failed} tickets failed to import. Check the results below.`
        })
      }

    } catch (error) {
      addNotification({
        type: 'error',
        title: 'Import failed',
        message: 'Failed to process CSV file. Please try again.'
      })
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Import Tickets</h1>
        <p className="text-gray-600">Import processed tickets from CSV files.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileUp className="mr-2 h-5 w-5" />
            CSV Import
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-yellow-800 mb-2">CSV Format Requirements</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Required columns: title, description, status, priority</li>
              <li>• Optional columns: category, dueDate (YYYY-MM-DD format)</li>
              <li>• Status values: pending, open, in_progress, resolved, closed</li>
              <li>• Priority values: low, medium, high, critical</li>
            </ul>
          </div>

          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <FileUp className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Upload CSV File
            </h3>
            <p className="text-gray-600 mb-4">
              Select a CSV file to import tickets
            </p>
            <Button onClick={handleFileSelect} disabled={isUploading}>
              <Upload className="mr-2 h-4 w-4" />
              {isUploading ? 'Processing...' : 'Choose File'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Processing CSV file...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {importResult && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Import Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <span className="text-sm">
                      <strong>{importResult.success}</strong> tickets imported successfully
                    </span>
                  </div>
                  {importResult.failed > 0 && (
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-5 w-5 text-red-500" />
                      <span className="text-sm">
                        <strong>{importResult.failed}</strong> tickets failed to import
                      </span>
                    </div>
                  )}
                </div>

                {importResult.errors.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Import Errors:</h4>
                    <ul className="text-sm text-red-600 space-y-1">
                      {importResult.errors.map((error, index) => (
                        <li key={index}>• {error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default CSVImport
