'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { 
  useProjectDocuments, 
  useUploadProjectDocument, 
  useDeleteProjectDocument,
  useGetDocumentUrl,
  ProjectDocument 
} from '@/lib/hooks/use-project-documents'
import { 
  FileText, 
  Upload, 
  Download, 
  Trash2, 
  Loader2, 
  File,
  FileImage,
  FileSpreadsheet,
  FileCode,
  Plus
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { useDropzone } from 'react-dropzone'

interface ProjectDocumentsProps {
  projectId: string
  workspaceId: string
  canUpload?: boolean
  canDelete?: boolean
  uploadedByType?: 'admin' | 'client'
}

function getFileIcon(mimeType: string | null) {
  if (!mimeType) return <File className="h-8 w-8 text-zinc-400" />
  
  if (mimeType.startsWith('image/')) {
    return <FileImage className="h-8 w-8 text-blue-400" />
  }
  if (mimeType.includes('spreadsheet') || mimeType.includes('excel') || mimeType.includes('csv')) {
    return <FileSpreadsheet className="h-8 w-8 text-green-400" />
  }
  if (mimeType.includes('pdf')) {
    return <FileText className="h-8 w-8 text-red-400" />
  }
  if (mimeType.includes('code') || mimeType.includes('javascript') || mimeType.includes('json')) {
    return <FileCode className="h-8 w-8 text-yellow-400" />
  }
  return <File className="h-8 w-8 text-zinc-400" />
}

function formatFileSize(bytes: number | null) {
  if (!bytes) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function ProjectDocuments({ 
  projectId, 
  workspaceId, 
  canUpload = true, 
  canDelete = true,
  uploadedByType = 'admin'
}: ProjectDocumentsProps) {
  const { data: documents, isLoading } = useProjectDocuments(projectId)
  const uploadDocument = useUploadProjectDocument()
  const deleteDocument = useDeleteProjectDocument()
  const getDocumentUrl = useGetDocumentUrl()
  
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [docName, setDocName] = useState('')
  const [docDescription, setDocDescription] = useState('')
  const [downloading, setDownloading] = useState<string | null>(null)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      const file = acceptedFiles[0]
      setSelectedFile(file)
      setDocName(file.name.replace(/\.[^/.]+$/, '')) // Remove extension for name
    }
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxFiles: 1,
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const handleUpload = async () => {
    if (!selectedFile || !docName.trim()) {
      toast.error('Please select a file and enter a name')
      return
    }

    try {
      await uploadDocument.mutateAsync({
        projectId,
        workspaceId,
        file: selectedFile,
        name: docName.trim(),
        description: docDescription.trim() || undefined,
        uploadedByType
      })
      toast.success('Document uploaded successfully')
      setUploadDialogOpen(false)
      setSelectedFile(null)
      setDocName('')
      setDocDescription('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload document')
    }
  }

  const handleDownload = async (doc: ProjectDocument) => {
    setDownloading(doc.id)
    try {
      const url = await getDocumentUrl(doc.file_path)
      if (url) {
        window.open(url, '_blank')
      } else {
        toast.error('Could not generate download link')
      }
    } catch (error) {
      toast.error('Failed to download document')
    } finally {
      setDownloading(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId) return
    const doc = documents?.find(d => d.id === deleteConfirmId)
    if (!doc) return

    try {
      await deleteDocument.mutateAsync({
        id: doc.id,
        projectId: doc.project_id,
        filePath: doc.file_path
      })
      toast.success('Document deleted')
      setDeleteConfirmId(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete document')
    }
  }

  return (
    <Card className="bg-zinc-900 border-zinc-800">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
          <FileText className="h-5 w-5 text-emerald-500" />
          Project Documents
        </CardTitle>
        {canUpload && (
          <Button
            size="sm"
            onClick={() => setUploadDialogOpen(true)}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-4 w-4 mr-1" />
            Upload
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
          </div>
        ) : !documents?.length ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-400">No documents uploaded yet</p>
            {canUpload && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setUploadDialogOpen(true)}
                className="mt-3 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload First Document
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="flex items-start gap-3 p-3 rounded-lg bg-zinc-800 border border-zinc-700"
              >
                {getFileIcon(doc.mime_type)}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-white truncate">{doc.name}</h4>
                  {doc.description && (
                    <p className="text-sm text-zinc-400 mt-1 line-clamp-2">{doc.description}</p>
                  )}
                  <div className="flex items-center gap-3 mt-2 text-xs text-zinc-500">
                    <span>{formatFileSize(doc.file_size)}</span>
                    <span>•</span>
                    <span>{format(new Date(doc.created_at), 'MMM d, yyyy')}</span>
                    <span>•</span>
                    <span className="capitalize">{doc.uploaded_by_type}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDownload(doc)}
                    disabled={downloading === doc.id}
                    className="text-zinc-400 hover:text-white"
                  >
                    {downloading === doc.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                  </Button>
                  {canDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeleteConfirmId(doc.id)}
                      className="text-zinc-400 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Upload Dialog */}
      <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>Upload Document</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Dropzone */}
            <div
              {...getRootProps()}
              className={`
                border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                ${isDragActive ? 'border-emerald-500 bg-emerald-500/10' : 'border-zinc-700 hover:border-zinc-600'}
              `}
            >
              <input {...getInputProps()} />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-3">
                  {getFileIcon(selectedFile.type)}
                  <div className="text-left">
                    <p className="font-medium text-white">{selectedFile.name}</p>
                    <p className="text-sm text-zinc-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
              ) : (
                <>
                  <Upload className="h-10 w-10 text-zinc-500 mx-auto mb-2" />
                  <p className="text-zinc-300">
                    {isDragActive ? 'Drop file here...' : 'Drag & drop or click to select'}
                  </p>
                  <p className="text-xs text-zinc-500 mt-1">Max file size: 50MB</p>
                </>
              )}
            </div>

            {/* Name */}
            <div className="space-y-2">
              <Label>Document Name *</Label>
              <Input
                value={docName}
                onChange={(e) => setDocName(e.target.value)}
                placeholder="Project Requirements"
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={docDescription}
                onChange={(e) => setDocDescription(e.target.value)}
                placeholder="Add any notes about this document..."
                className="bg-zinc-800 border-zinc-700"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => {
                  setUploadDialogOpen(false)
                  setSelectedFile(null)
                  setDocName('')
                  setDocDescription('')
                }}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpload}
                disabled={!selectedFile || !docName.trim() || uploadDocument.isPending}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {uploadDocument.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Document</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this document? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
