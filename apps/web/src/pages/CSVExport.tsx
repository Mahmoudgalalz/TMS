import { useState } from 'react'
import { csvApi } from '../services/api'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileDown, Download } from 'lucide-react'

const CSVExport = () => {
  const [isExporting, setIsExporting] = useState(false)

  const handleExport = async () => {
    setIsExporting(true)
    try {
      // Call export API without any parameters to get PENDING tickets by default
      const response = await csvApi.exportTickets()
      console.log('Export response:', response)
      
      const fileName = response.data?.fileName
      if (!fileName) {
        throw new Error('No filename received from export API')
      }
      
      // Download the file
      const downloadResponse = await csvApi.downloadCsv(fileName)
      const blob = new Blob([downloadResponse.data], { type: 'text/csv' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = fileName
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      alert('Export completed successfully!')
    } catch (error: any) {
      console.error('Export failed:', error)
      alert(`Export failed: ${error.response?.data?.message || error.message}`)
    } finally {
      setIsExporting(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Export Pending Tickets</h1>
        <p className="text-gray-600">Export all pending tickets to CSV for external processing.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileDown className="mr-2 h-5 w-5" />
            CSV Export
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-sm font-medium text-blue-800 mb-2">Export Information</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Exports all PENDING tickets ready for external processing</li>
              <li>• CSV includes ticket number, title, description, status, severity, and dates</li>
              <li>• File will be downloaded automatically to your default download folder</li>
            </ul>
          </div>

          <div className="flex justify-center">
            <Button 
              onClick={handleExport} 
              disabled={isExporting}
              className="flex items-center px-8 py-3 text-lg"
              size="lg"
            >
              <Download className="mr-2 h-5 w-5" />
              {isExporting ? 'Exporting...' : 'Export Pending Tickets'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default CSVExport
