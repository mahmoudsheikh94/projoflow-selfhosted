'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { useAuthUser, useClientAccess, useSignOut } from '@/lib/hooks/use-client-portal'
import { 
  useClientCredentials, 
  useCreateCredential, 
  useUpdateCredential, 
  useDeleteCredential 
} from '@/lib/hooks/use-client-credentials'
import { ClientCredential, CredentialType } from '@/types/database'
import { 
  LogOut, 
  Loader2, 
  Plus, 
  Key, 
  Eye, 
  EyeOff, 
  Pencil, 
  Trash2,
  ArrowLeft,
  Lock,
  Globe,
  Database,
  Terminal,
  KeyRound
} from 'lucide-react'
import Link from 'next/link'
import Image from 'next/image'
import { appConfig } from '@/lib/config/theme'
import { toast } from 'sonner'
import { format } from 'date-fns'

const credentialTypeIcons: Record<CredentialType, React.ReactNode> = {
  login: <Lock className="h-4 w-4" />,
  api_key: <Key className="h-4 w-4" />,
  oauth: <KeyRound className="h-4 w-4" />,
  ssh: <Terminal className="h-4 w-4" />,
  database: <Database className="h-4 w-4" />,
  other: <Globe className="h-4 w-4" />
}

const credentialTypeLabels: Record<CredentialType, string> = {
  login: 'Login',
  api_key: 'API Key',
  oauth: 'OAuth',
  ssh: 'SSH',
  database: 'Database',
  other: 'Other'
}

const defaultFormData = {
  name: '',
  credential_type: 'login' as CredentialType,
  username: '',
  password: '',
  api_key: '',
  url: '',
  notes: ''
}

export default function PortalCredentialsPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuthUser()
  const { data: clientAccess, isLoading: accessLoading } = useClientAccess(user?.id)
  const signOut = useSignOut()
  
  const clientId = clientAccess?.[0]?.client_id
  const clientName = clientAccess?.[0]?.clients?.name
  const userName = clientAccess?.[0]?.name || user?.user_metadata?.name || user?.email?.split('@')[0]
  
  const displayName = appConfig.name
  
  const { data: credentials, isLoading: credentialsLoading } = useClientCredentials(clientId)
  const createCredential = useCreateCredential()
  const updateCredential = useUpdateCredential()
  const deleteCredential = useDeleteCredential()
  
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingCredential, setEditingCredential] = useState<ClientCredential | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [formData, setFormData] = useState(defaultFormData)
  const [visiblePasswords, setVisiblePasswords] = useState<Set<string>>(new Set())

  const handleSignOut = async () => {
    await signOut.mutateAsync()
    router.push('/portal/login')
  }

  const togglePasswordVisibility = (id: string) => {
    const newVisible = new Set(visiblePasswords)
    if (newVisible.has(id)) {
      newVisible.delete(id)
    } else {
      newVisible.add(id)
    }
    setVisiblePasswords(newVisible)
  }

  const openCreateDialog = () => {
    setEditingCredential(null)
    setFormData(defaultFormData)
    setDialogOpen(true)
  }

  const openEditDialog = (credential: ClientCredential) => {
    setEditingCredential(credential)
    setFormData({
      name: credential.name,
      credential_type: credential.credential_type,
      username: credential.username || '',
      password: credential.password || '',
      api_key: credential.api_key || '',
      url: credential.url || '',
      notes: credential.notes || ''
    })
    setDialogOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('Please enter a name for this credential')
      return
    }

    if (!clientId) {
      toast.error('No client access')
      return
    }

    try {
      if (editingCredential) {
        await updateCredential.mutateAsync({
          id: editingCredential.id,
          ...formData
        })
        toast.success('Credential updated')
      } else {
        await createCredential.mutateAsync({
          client_id: clientId,
          ...formData
        })
        toast.success('Credential added')
      }
      setDialogOpen(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to save credential')
    }
  }

  const handleDelete = async () => {
    if (!deleteConfirmId || !clientId) return
    
    try {
      await deleteCredential.mutateAsync({ id: deleteConfirmId, clientId })
      toast.success('Credential deleted')
      setDeleteConfirmId(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete credential')
    }
  }

  if (authLoading || accessLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-950">
        <Loader2 className="h-8 w-8 text-emerald-500 animate-spin" />
      </div>
    )
  }

  if (!user || !clientAccess?.length) {
    router.push('/portal/login')
    return null
  }

  const isPending = createCredential.isPending || updateCredential.isPending

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-border-default bg-input-bg">
        <div className="max-w-6xl mx-auto px-4 py-3 md:py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 md:gap-3">
            <Image src={appConfig.logo} alt={displayName} width={28} height={28} className="h-6 w-6 md:h-7 md:w-7" />
            <div>
              <span className="text-base md:text-lg font-bold text-text-primary">{displayName}</span>
              <span className="text-text-muted text-xs md:text-sm ml-1 md:ml-2 hidden sm:inline">Client Portal</span>
            </div>
          </div>
          <div className="flex items-center gap-2 md:gap-4">
            <span className="text-xs md:text-sm text-text-secondary hidden sm:block truncate max-w-[150px]">{userName}</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSignOut}
              className="border-border-default text-text-primary hover:bg-surface-raised text-xs md:text-sm h-8"
            >
              <LogOut className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">Sign Out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-4 md:py-8">
        {/* Back link */}
        <Link 
          href="/portal" 
          className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-4 transition-colors"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Shared Credentials</h1>
            <p className="text-sm text-zinc-400 mt-1">
              Securely share API keys, logins, and other credentials with {clientName ? `your team at ${displayName}` : 'us'}.
            </p>
          </div>
          <Button
            onClick={openCreateDialog}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Credential
          </Button>
        </div>

        {/* Credentials List */}
        {credentialsLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
          </div>
        ) : !credentials?.length ? (
          <Card className="bg-zinc-900 border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-12 px-4">
              <Key className="h-12 w-12 text-zinc-700" />
              <h3 className="mt-4 text-lg font-medium text-white text-center">No credentials shared</h3>
              <p className="mt-2 text-zinc-400 text-center text-sm max-w-md">
                Add any API keys, logins, or credentials that you&apos;d like to share with us for your projects.
              </p>
              <Button
                onClick={openCreateDialog}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Credential
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {credentials.map((credential) => (
              <Card key={credential.id} className="bg-zinc-900 border-zinc-800">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="p-2 rounded-lg bg-zinc-800 text-emerald-500">
                        {credentialTypeIcons[credential.credential_type]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-medium text-white truncate">{credential.name}</h3>
                          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-xs">
                            {credentialTypeLabels[credential.credential_type]}
                          </Badge>
                        </div>
                        
                        {/* Credential details */}
                        <div className="space-y-1 text-sm">
                          {credential.url && (
                            <p className="text-zinc-400">
                              <span className="text-zinc-500">URL:</span> {credential.url}
                            </p>
                          )}
                          {credential.username && (
                            <p className="text-zinc-400">
                              <span className="text-zinc-500">Username:</span> {credential.username}
                            </p>
                          )}
                          {credential.password && (
                            <p className="text-zinc-400 flex items-center gap-2">
                              <span className="text-zinc-500">Password:</span>
                              <span className="font-mono">
                                {visiblePasswords.has(credential.id) ? credential.password : '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(credential.id)}
                                className="text-zinc-500 hover:text-zinc-300"
                              >
                                {visiblePasswords.has(credential.id) ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </p>
                          )}
                          {credential.api_key && (
                            <p className="text-zinc-400 flex items-center gap-2">
                              <span className="text-zinc-500">API Key:</span>
                              <span className="font-mono">
                                {visiblePasswords.has(`api-${credential.id}`) 
                                  ? credential.api_key 
                                  : credential.api_key.slice(0, 8) + '••••••••'}
                              </span>
                              <button
                                type="button"
                                onClick={() => togglePasswordVisibility(`api-${credential.id}`)}
                                className="text-zinc-500 hover:text-zinc-300"
                              >
                                {visiblePasswords.has(`api-${credential.id}`) ? (
                                  <EyeOff className="h-4 w-4" />
                                ) : (
                                  <Eye className="h-4 w-4" />
                                )}
                              </button>
                            </p>
                          )}
                          {credential.notes && (
                            <p className="text-zinc-500 text-xs mt-2">{credential.notes}</p>
                          )}
                        </div>
                        
                        <p className="text-xs text-zinc-600 mt-2">
                          Added {format(new Date(credential.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(credential)}
                        className="text-zinc-400 hover:text-white"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirmId(credential.id)}
                        className="text-zinc-400 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Security Note */}
        <div className="mt-6 p-4 rounded-lg bg-zinc-900 border border-zinc-800">
          <div className="flex items-start gap-3">
            <Lock className="h-5 w-5 text-emerald-500 mt-0.5" />
            <div>
              <h4 className="text-sm font-medium text-white">Your credentials are secure</h4>
              <p className="text-xs text-zinc-400 mt-1">
                Credentials are stored securely and only accessible by you and authorized team members.
                We recommend using dedicated API keys with limited scopes when possible.
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingCredential ? 'Edit Credential' : 'Add Credential'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Production API Key, Admin Login"
                className="bg-zinc-800 border-zinc-700"
                required
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={formData.credential_type}
                onValueChange={(v) => setFormData({ ...formData, credential_type: v as CredentialType })}
              >
                <SelectTrigger className="bg-zinc-800 border-zinc-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  <SelectItem value="login">Login (Username/Password)</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="oauth">OAuth</SelectItem>
                  <SelectItem value="ssh">SSH</SelectItem>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>URL (optional)</Label>
              <Input
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://..."
                className="bg-zinc-800 border-zinc-700"
              />
            </div>

            {(formData.credential_type === 'login' || formData.credential_type === 'database' || formData.credential_type === 'ssh') && (
              <>
                <div className="space-y-2">
                  <Label>Username</Label>
                  <Input
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="admin@example.com"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Password</Label>
                  <Input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder="••••••••"
                    className="bg-zinc-800 border-zinc-700"
                  />
                </div>
              </>
            )}

            {(formData.credential_type === 'api_key' || formData.credential_type === 'oauth') && (
              <div className="space-y-2">
                <Label>API Key / Token</Label>
                <Input
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  placeholder="sk-..."
                  className="bg-zinc-800 border-zinc-700 font-mono"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Notes (optional)</Label>
              <Textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional information..."
                className="bg-zinc-800 border-zinc-700"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDialogOpen(false)}
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
                    Saving...
                  </>
                ) : (
                  <>{editingCredential ? 'Update' : 'Add'} Credential</>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <AlertDialogContent className="bg-zinc-900 border-zinc-800">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Credential</AlertDialogTitle>
            <AlertDialogDescription className="text-zinc-400">
              Are you sure you want to delete this credential? This action cannot be undone.
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
    </div>
  )
}
