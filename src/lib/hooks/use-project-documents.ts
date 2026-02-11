'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface ProjectDocument {
  id: string
  project_id: string
  workspace_id: string
  name: string
  description: string | null
  file_path: string
  file_size: number | null
  mime_type: string | null
  uploaded_by: string | null
  uploaded_by_type: string
  created_at: string
  updated_at: string
}

export interface ProjectDocumentInsert {
  project_id: string
  workspace_id: string
  name: string
  description?: string | null
  file_path: string
  file_size?: number | null
  mime_type?: string | null
  uploaded_by_type?: string
}

export function useProjectDocuments(projectId: string) {
  return useQuery({
    queryKey: ['project-documents', projectId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('project_documents')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      return data as ProjectDocument[]
    },
    enabled: !!projectId
  })
}

export function useUploadProjectDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ 
      projectId, 
      workspaceId, 
      file, 
      name, 
      description,
      uploadedByType = 'admin'
    }: { 
      projectId: string
      workspaceId: string
      file: File
      name: string
      description?: string
      uploadedByType?: string
    }) => {
      const supabase = createClient()
      
      // Upload file to storage
      const fileExt = file.name.split('.').pop()
      const fileName = `${workspaceId}/${projectId}/${Date.now()}-${file.name}`
      
      const { error: uploadError } = await supabase.storage
        .from('project-documents')
        .upload(fileName, file)
      
      if (uploadError) throw uploadError
      
      // Create document record
      const { data, error } = await supabase
        .from('project_documents')
        .insert({
          project_id: projectId,
          workspace_id: workspaceId,
          name,
          description: description || null,
          file_path: fileName,
          file_size: file.size,
          mime_type: file.type,
          uploaded_by_type: uploadedByType
        })
        .select()
        .single()
      
      if (error) throw error
      return data as ProjectDocument
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', data.project_id] })
    }
  })
}

export function useDeleteProjectDocument() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId, filePath }: { id: string; projectId: string; filePath: string }) => {
      const supabase = createClient()
      
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('project-documents')
        .remove([filePath])
      
      if (storageError) {
        console.warn('Storage delete error:', storageError)
        // Continue anyway - file might already be deleted
      }
      
      // Delete record
      const { error } = await supabase
        .from('project_documents')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, projectId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['project-documents', data.projectId] })
    }
  })
}

export function useGetDocumentUrl() {
  return async (filePath: string) => {
    const supabase = createClient()
    const { data } = await supabase.storage
      .from('project-documents')
      .createSignedUrl(filePath, 3600) // 1 hour expiry
    
    return data?.signedUrl || null
  }
}
