'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
import { useCreateTask, useUpdateTask } from '@/lib/hooks'
import { Task, TaskStatus, TaskPriority } from '@/types/database'
import { toast } from 'sonner'
import { Loader2, User, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'

interface AssignableUser {
  id: string
  name: string | null
  email: string
  type: 'team' | 'client'
}

interface PortalTaskDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  projectId: string
  workspaceId: string
  clientId?: string
  task?: Task
  initialStatus?: TaskStatus
  canDelete?: boolean
}

const defaultValues = {
  title: '',
  description: '',
  status: 'todo' as TaskStatus,
  priority: 'medium' as TaskPriority,
  estimated_hours: null as number | null,
  due_date: '',
  assigned_to: '' as string,
}

// Hook to fetch assignable users (workspace members + client users)
function useAssignableUsers(workspaceId: string, clientId?: string) {
  return useQuery({
    queryKey: ['assignable-users', workspaceId, clientId],
    queryFn: async () => {
      const supabase = createClient()
      const users: AssignableUser[] = []

      // Fetch workspace members (team/admins) - these should be visible via RLS
      const { data: members } = await supabase
        .from('workspace_members')
        .select('user_id, users(id, email, name)')
        .eq('workspace_id', workspaceId)
      
      if (members) {
        members.forEach(m => {
          const user = m.users as any
          if (user) {
            users.push({
              id: user.id,
              name: user.name,
              email: user.email,
              type: 'team'
            })
          }
        })
      }

      // Fetch client users for this client
      if (clientId) {
        const { data: clientUsers } = await supabase
          .from('client_users')
          .select('user_id, name, users(email)')
          .eq('client_id', clientId)
        
        if (clientUsers) {
          clientUsers.forEach(cu => {
            // Avoid duplicates (user might be both team and client)
            if (!users.find(u => u.id === cu.user_id)) {
              users.push({
                id: cu.user_id,
                name: cu.name,
                email: (cu.users as any)?.email || 'Unknown',
                type: 'client'
              })
            }
          })
        }
      }

      return users
    },
    enabled: !!workspaceId
  })
}

// Hook to delete a task
function useDeleteTask() {
  const queryClient = useQueryClient()
  
  return useMutation({
    mutationFn: async ({ id, projectId }: { id: string; projectId: string }) => {
      const supabase = createClient()
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      return { id, projectId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tasks', { projectId: data.projectId }] })
      queryClient.invalidateQueries({ queryKey: ['projects', data.projectId, 'stats'] })
    }
  })
}

export function PortalTaskDialog({ 
  open, 
  onOpenChange, 
  projectId,
  workspaceId,
  clientId,
  task, 
  initialStatus,
  canDelete = true
}: PortalTaskDialogProps) {
  const [formData, setFormData] = useState(defaultValues)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const { data: assignableUsers, isLoading: usersLoading } = useAssignableUsers(workspaceId, clientId)

  const createTask = useCreateTask()
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        estimated_hours: task.estimated_hours,
        due_date: task.due_date || '',
        assigned_to: task.assigned_to || '',
      })
    } else {
      setFormData({
        ...defaultValues,
        status: initialStatus || defaultValues.status
      })
    }
  }, [task, open, initialStatus])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.title.trim()) {
      toast.error('Task title is required')
      return
    }

    try {
      const data = {
        title: formData.title,
        description: formData.description || null,
        status: formData.status,
        priority: formData.priority,
        project_id: projectId,
        workspace_id: workspaceId,
        estimated_hours: formData.estimated_hours || null,
        due_date: formData.due_date || null,
        assigned_to: formData.assigned_to || null,
      }

      if (task) {
        await updateTask.mutateAsync({ id: task.id, ...data })
        toast.success('Task updated')
      } else {
        await createTask.mutateAsync(data)
        toast.success('Task created')
      }
      onOpenChange(false)
    } catch (error: any) {
      console.error('Task save error:', error)
      toast.error(error.message || 'Failed to save task')
    }
  }

  const handleDelete = async () => {
    if (!task) return
    
    try {
      await deleteTask.mutateAsync({ id: task.id, projectId })
      toast.success('Task deleted')
      setDeleteConfirmOpen(false)
      onOpenChange(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete task')
    }
  }

  const isPending = createTask.isPending || updateTask.isPending

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{task ? 'Edit Task' : 'New Task'}</span>
              {task && canDelete && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setDeleteConfirmOpen(true)}
                  className="text-zinc-400 hover:text-red-500 hover:bg-red-500/10"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Task Title *</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter task title..."
                className="bg-zinc-800 border-zinc-700"
                required
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Add details about this task..."
                className="bg-zinc-800 border-zinc-700 min-h-[100px]"
              />
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Status</Label>
                <Select
                  value={formData.status}
                  onValueChange={(v) => setFormData({ ...formData, status: v as TaskStatus })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="todo">To Do</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="review">Review</SelectItem>
                    <SelectItem value="done">Done</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v as TaskPriority })}
                >
                  <SelectTrigger className="bg-zinc-800 border-zinc-700">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignment dropdown */}
            <div className="space-y-2">
              <Label>Assign To</Label>
              <Select
                value={formData.assigned_to || '__none__'}
                onValueChange={(v) => setFormData({ ...formData, assigned_to: v === '__none__' ? '' : v })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue placeholder="Select assignee..." />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="__none__">
                    <span className="text-zinc-400">Unassigned</span>
                  </SelectItem>
                  {usersLoading ? (
                    <SelectItem value="loading" disabled>Loading users...</SelectItem>
                  ) : !assignableUsers?.length ? (
                    <SelectItem value="none" disabled>No users available</SelectItem>
                  ) : (
                    assignableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        <div className="flex items-center gap-2">
                          <User className="h-3 w-3 text-zinc-400" />
                          <span>{user.name || user.email}</span>
                          <span className="text-xs text-zinc-500">
                            ({user.type === 'team' ? 'Team' : 'Client'})
                          </span>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid gap-4 grid-cols-2">
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                  className="bg-zinc-800 border-zinc-700"
                />
              </div>

              <div className="space-y-2">
                <Label>Estimated Hours</Label>
                <Input
                  type="number"
                  step="0.5"
                  min="0"
                  value={formData.estimated_hours || ''}
                  onChange={(e) => setFormData({ ...formData, estimated_hours: parseFloat(e.target.value) || null })}
                  className="bg-zinc-800 border-zinc-700"
                  placeholder="2.5"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                disabled={isPending}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isPending}
              >
                {isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    {task ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  <>{task ? 'Update' : 'Create'} Task</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Task</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete "{task?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-zinc-700 text-zinc-300 hover:bg-zinc-800">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleteTask.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteTask.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
